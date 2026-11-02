// @ts-nocheck: Deno runtime, excluded from the app typecheck
// Deletes the caller's account. For Sign in with Apple users it first tries to
// revoke the Apple grant (required by App Store guideline 5.1.1(v)). A failed
// revocation never blocks deletion: it is logged and reported as revoked:false.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { SignJWT, importPKCS8 } from 'npm:jose@5';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

const PROD_CLIENT_ID = 'com.clutchr.baseball';

// Production bundle ID first, then any other configured ID (the dev bundle).
function clientIds(): string[] {
  const all = (Deno.env.get('APPLE_CLIENT_IDS') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...all.filter((id) => id === PROD_CLIENT_ID), ...all.filter((id) => id !== PROD_CLIENT_ID)];
}

async function clientSecret(clientId: string): Promise<string> {
  const pem = (Deno.env.get('APPLE_PRIVATE_KEY') ?? '').replace(/\\n/g, '\n');
  const key = await importPKCS8(pem, 'ES256');
  return await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: Deno.env.get('APPLE_KEY_ID')! })
    .setIssuer(Deno.env.get('APPLE_TEAM_ID')!)
    .setSubject(clientId)
    .setAudience('https://appleid.apple.com')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(key);
}

async function appleForm(url: string, params: Record<string, string>) {
  return await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
}

// Returns true only if Apple confirmed the revoke. Logs reasons, never secrets.
async function revokeApple(authorizationCode: string): Promise<boolean> {
  for (const clientId of clientIds()) {
    try {
      const secret = await clientSecret(clientId);
      const tokenRes = await appleForm('https://appleid.apple.com/auth/token', {
        client_id: clientId,
        client_secret: secret,
        code: authorizationCode,
        grant_type: 'authorization_code',
      });
      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        console.warn(`apple token exchange failed client=${clientId} status=${tokenRes.status} error=${err?.error ?? 'unknown'}`);
        continue;
      }
      const { refresh_token } = await tokenRes.json();
      if (!refresh_token) {
        console.warn(`apple token exchange returned no refresh token client=${clientId}`);
        return false;
      }
      const revokeRes = await appleForm('https://appleid.apple.com/auth/revoke', {
        client_id: clientId,
        client_secret: secret,
        token: refresh_token,
        token_type_hint: 'refresh_token',
      });
      if (!revokeRes.ok) {
        const err = await revokeRes.json().catch(() => ({}));
        console.warn(`apple revoke failed client=${clientId} status=${revokeRes.status} error=${err?.error ?? 'unknown'}`);
        return false;
      }
      return true;
    } catch (e) {
      console.warn(`apple revoke threw client=${clientId} name=${(e as Error)?.name ?? 'Error'}`);
    }
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ deleted: false }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ deleted: false }, 401);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ deleted: false }, 401);
  const user = userData.user;

  let authorizationCode: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.authorizationCode === 'string' && body.authorizationCode) {
      authorizationCode = body.authorizationCode;
    }
  } catch {
    // no body is fine for email and Google users
  }

  const isApple =
    user.app_metadata?.provider === 'apple' ||
    (user.identities ?? []).some((i) => i.provider === 'apple');

  let revoked: boolean | null = null;
  if (isApple) {
    if (authorizationCode) {
      revoked = await revokeApple(authorizationCode);
    } else {
      console.warn('apple user without authorization code, skipping revoke');
      revoked = false;
    }
  }

  // Caller's own JWT, so auth.uid() resolves inside the SECURITY DEFINER RPC.
  const { error: delErr } = await supabase.rpc('delete_my_account');
  if (delErr) {
    console.warn(`delete_my_account failed code=${delErr.code ?? 'unknown'}`);
    return json({ deleted: false, revoked }, 500);
  }

  return json({ deleted: true, revoked });
});

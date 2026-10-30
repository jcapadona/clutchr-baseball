import { supabase } from '@/lib/supabase';

export const MIN_PASSWORD = 8;
export const EMAIL_REDIRECT = 'clutchrbaseball://auth/callback';
export const RESET_REDIRECT = 'clutchrbaseball://reset-password';

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

// ─── Error copy ──────────────────────────────────────────────────────────────

export const COPY = {
  invalidEmail: 'Enter a valid email.',
  shortPassword: 'Use at least 8 characters.',
  mismatch: 'Passwords do not match.',
  wrongCredentials: 'That email or password is not right.',
  unconfirmed: 'Confirm your email first. We can send the link again.',
  rateLimit: 'Too many tries. Wait a minute and try again.',
  createFailed: 'We could not create that account. If you already have one, sign in or reset your password.',
  offline: 'No connection. Check your signal and try again.',
  expired: 'This link has expired. Request a new one.',
  generic: 'Something went wrong. Try again.',
};

function isOffline(err: any): boolean {
  const msg = String(err?.message ?? '').toLowerCase();
  return err?.name === 'AuthRetryableFetchError' || msg.includes('network request failed') || msg.includes('failed to fetch');
}

export function isRateLimit(err: any): boolean {
  return err?.status === 429 || String(err?.code ?? '').includes('rate_limit');
}

export function signInErrorMessage(err: any): { message: string; unconfirmed: boolean } {
  if (isOffline(err)) return { message: COPY.offline, unconfirmed: false };
  if (isRateLimit(err)) return { message: COPY.rateLimit, unconfirmed: false };
  if (err?.code === 'email_not_confirmed') return { message: COPY.unconfirmed, unconfirmed: true };
  if (err?.code === 'invalid_credentials') return { message: COPY.wrongCredentials, unconfirmed: false };
  return { message: COPY.generic, unconfirmed: false };
}

export function signUpErrorMessage(err: any): string {
  if (isOffline(err)) return COPY.offline;
  if (isRateLimit(err)) return COPY.rateLimit;
  if (err?.code === 'weak_password') return COPY.shortPassword;
  return COPY.createFailed;
}

// ─── Email link handling ─────────────────────────────────────────────────────

export interface ParsedAuthUrl {
  accessToken: string | null;
  refreshToken: string | null;
  code: string | null;
  type: string | null;
  hasError: boolean;
}

// Implicit flow puts tokens in the hash. A code or error may arrive in the query.
export function parseAuthUrl(url: string): ParsedAuthUrl {
  const hashIdx = url.indexOf('#');
  const hash = hashIdx >= 0 ? url.slice(hashIdx + 1) : '';
  const beforeHash = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
  const qIdx = beforeHash.indexOf('?');
  const query = qIdx >= 0 ? beforeHash.slice(qIdx + 1) : '';
  const h = new URLSearchParams(hash);
  const q = new URLSearchParams(query);
  const get = (k: string) => h.get(k) ?? q.get(k);
  return {
    accessToken: get('access_token'),
    refreshToken: get('refresh_token'),
    code: q.get('code'),
    type: get('type'),
    hasError: Boolean(get('error') || get('error_code')),
  };
}

export type LinkResult =
  | { ok: true; type: string | null }
  | { ok: false };

// Turns an email link into a session. Returns ok false when the link carries
// an error, no credentials, or credentials Supabase rejects.
export async function applySessionFromUrl(url: string): Promise<LinkResult> {
  const p = parseAuthUrl(url);
  if (p.hasError) return { ok: false };
  try {
    if (p.accessToken && p.refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: p.accessToken,
        refresh_token: p.refreshToken,
      });
      if (error) return { ok: false };
      return { ok: true, type: p.type };
    }
    if (p.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(p.code);
      if (error) return { ok: false };
      return { ok: true, type: p.type };
    }
  } catch {
    // fall through
  }
  return { ok: false };
}

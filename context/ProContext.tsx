import Purchases, { CustomerInfo } from 'react-native-purchases';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export const PRO_ENTITLEMENT_ID = 'Clutchr Pro';

interface ProContextType {
  isPro: boolean;
  isProLoading: boolean;
  refreshPro: () => Promise<void>;
}

const ProContext = createContext<ProContextType | null>(null);

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [isProLoading, setIsProLoading] = useState(true);

  const updateFromInfo = useCallback((info: CustomerInfo) => {
    setIsPro(!!info.entitlements.active[PRO_ENTITLEMENT_ID]);
  }, []);

  const refreshPro = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      updateFromInfo(info);
    } catch {
      // keep current state on error
    }
  }, [updateFromInfo]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const info = await Purchases.getCustomerInfo();
        if (mounted) updateFromInfo(info);
      } catch {
        // keep false
      } finally {
        if (mounted) setIsProLoading(false);
      }
    })();

    function onUpdate(info: CustomerInfo) {
      updateFromInfo(info);
    }

    Purchases.addCustomerInfoUpdateListener(onUpdate);

    return () => {
      mounted = false;
      Purchases.removeCustomerInfoUpdateListener(onUpdate);
    };
  }, []);

  return (
    <ProContext.Provider value={{ isPro, isProLoading, refreshPro }}>
      {children}
    </ProContext.Provider>
  );
}

export function useProContext() {
  const ctx = useContext(ProContext);
  if (!ctx) throw new Error('useProContext must be inside ProProvider');
  return ctx;
}

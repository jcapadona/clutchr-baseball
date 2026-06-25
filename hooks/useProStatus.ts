import { useEffect, useState } from 'react';
import Purchases from 'react-native-purchases';

export function useProStatus() {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const info = await Purchases.getCustomerInfo();
        setIsPro(!!info.entitlements.active['pro']);
      } catch {
        setIsPro(false);
      } finally {
        setIsLoading(false);
      }
    }
    check();
  }, []);

  return { isPro, isLoading };
}

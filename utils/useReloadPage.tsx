import { useRouter } from "next/dist/client/router";
import { useCallback } from "react";
import { useIsMounted } from "./useIsMounted";

export function useReloadPage() {
  const router = useRouter();
  const isMounted = useIsMounted();
  return useCallback(async () => {
    if (isMounted()) {
      await router.replace(router.asPath);
    }
  }, [router.asPath]);
}

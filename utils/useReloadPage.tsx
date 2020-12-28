import { useRouter } from "next/dist/client/router";
import { useCallback } from "react";
import { useIsMounted } from "./useIsMounted";

/**
 * Navigates the router to itself, causing `getServerSideProps` to be triggered
 */
export function useReloadPage() {
  const router = useRouter();
  const isMounted = useIsMounted();
  return useCallback(async () => {
    if (isMounted()) {
      await router.replace(router.asPath);
    }
  }, [router.asPath]);
}

import nProgress from "nprogress";
import { useEffect } from "react";

export function ProgressBar(props: { loading: boolean }) {
  useEffect(() => {
    props.loading ? nProgress.start() : nProgress.done();
  }, [props.loading]);

  return null;
}

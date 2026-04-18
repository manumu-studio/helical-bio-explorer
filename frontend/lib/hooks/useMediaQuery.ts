// Client-only `matchMedia` for responsive layout (charts, headers).

"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const onChange = () => {
      setMatches(mq.matches);
    };
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
    };
  }, [query]);

  return matches;
}

/** Narrow phones / small portrait — extra Plotly title margin, left-aligned title, mode bar on hover. */
export function useIsCompactChartLayout(): boolean {
  return useMediaQuery("(max-width: 640px)");
}

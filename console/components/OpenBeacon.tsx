"use client";

import { useEffect, useRef } from "react";

/** Tells the console the delivery page was opened (runs in the browser only, once per load). */
export function OpenBeacon({ token }: { token: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch(`/api/d/${encodeURIComponent(token)}/open`, { method: "POST", keepalive: true }).catch(() => undefined);
  }, [token]);
  return null;
}

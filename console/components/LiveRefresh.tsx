"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { t } from "@/lib/strings";

/**
 * While generation jobs are active: nudges the queue (POST /api/jobs/tick) and refreshes
 * the page so progress shows without reloading. Stops once nothing is active.
 */
export function LiveRefresh({ active, showLabel = true }: { active: boolean; showLabel?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        await fetch("/api/jobs/tick", { method: "POST" });
      } catch {
        // try again on the next round
      }
      if (stopped) return;
      router.refresh();
      timer = setTimeout(tick, 1200);
    };
    timer = setTimeout(tick, 300);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [active, router]);
  if (!active || !showLabel) return null;
  return <span className="live">{t.jobs.live}</span>;
}

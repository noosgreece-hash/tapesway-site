"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { t } from "@/lib/strings";

/** The phone menu: a <details> drawer that closes itself after navigating. */
export function MobileMenu({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const path = usePathname();
  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [path]);
  return (
    <details ref={ref}>
      <summary>
        {t.menu}
        <svg className="bars" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </summary>
      <div className="drawer">{children}</div>
    </details>
  );
}

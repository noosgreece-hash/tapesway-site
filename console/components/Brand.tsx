/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { t } from "@/lib/strings";

export function Brand({ dark = true, sub = true }: { dark?: boolean; sub?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label={`${t.brand} ${t.consoleName}`}>
      <img src={dark ? "/brand/logo-mark-white.svg" : "/brand/logo-mark-black.svg"} alt="" width={27} height={30} />
      <span>
        <span className="brand-word">{t.brand}</span>
        {sub ? <span className="brand-sub">{t.consoleName}</span> : null}
      </span>
    </Link>
  );
}

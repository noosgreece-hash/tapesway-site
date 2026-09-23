"use client";

import { useState } from "react";

export function CopyButton({ text, label, done, className = "btn btn--ghost btn--sm" }: { text: string; label: string; done: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button type="button" className={className} onClick={copy} aria-live="polite">
      {copied ? done : label}
    </button>
  );
}

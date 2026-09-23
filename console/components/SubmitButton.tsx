"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pending, className = "btn", confirm, ...rest }: { children: React.ReactNode; pending?: string; className?: string; confirm?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const status = useFormStatus();
  return (
    <button
      {...rest}
      type="submit"
      className={className}
      disabled={status.pending || rest.disabled}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {status.pending && pending ? pending : children}
    </button>
  );
}

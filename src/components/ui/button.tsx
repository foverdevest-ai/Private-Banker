import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition",
        variant === "primary"
          ? "bg-emerald-400 text-slate-900 hover:bg-emerald-300"
          : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10",
        className,
      )}
      {...props}
    />
  );
}

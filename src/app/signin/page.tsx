"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#0f172a,#020617)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/70 p-7">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Private Banker</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Sign in</h1>
        <p className="mt-2 text-sm text-slate-300">
          Use your approved Google account. In demo mode you can continue without external credentials.
        </p>
        <Button className="mt-6 w-full" onClick={() => signIn("google", { callbackUrl: "/" })}>
          Continue with Google
        </Button>
        <Button variant="ghost" className="mt-3 w-full" onClick={() => signIn("demo", { callbackUrl: "/" })}>
          Enter demo mode
        </Button>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { isDemoMode } from "@/lib/env";
import { shouldRedirectToSignIn } from "@/lib/auth-guard";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (shouldRedirectToSignIn(session?.user?.email, isDemoMode)) {
    redirect("/signin");
  }

  return <AppShell>{children}</AppShell>;
}

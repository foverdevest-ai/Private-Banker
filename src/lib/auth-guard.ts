export function shouldRedirectToSignIn(email: string | null | undefined, demoMode: boolean) {
  return !email && !demoMode;
}

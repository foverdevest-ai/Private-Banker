import { describe, expect, it } from "vitest";
import { shouldRedirectToSignIn } from "@/lib/auth-guard";

describe("auth guard", () => {
  it("requires sign-in when no email and demo mode disabled", () => {
    expect(shouldRedirectToSignIn(undefined, false)).toBe(true);
  });

  it("allows access when demo mode is enabled", () => {
    expect(shouldRedirectToSignIn(undefined, true)).toBe(false);
  });

  it("allows access when user email exists", () => {
    expect(shouldRedirectToSignIn("user@example.com", false)).toBe(false);
  });
});

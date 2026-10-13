import { describe, it, expect } from "vitest";
import { auth, hashPassword, authHandlers, getSession, getAuthContext, getUserProfile } from "./index";

describe("@pspk/auth configuration and exports", () => {
  it("harus mengekspor auth instance dengan properti handler yang valid", () => {
    expect(auth).toBeDefined();
    expect(typeof auth.handler).toBe("function");
    expect(auth.api).toBeDefined();
  });

  it("harus mengekspor authHandlers untuk Next.js App Router API route", () => {
    expect(authHandlers).toBeDefined();
    expect(typeof authHandlers.GET).toBe("function");
    expect(typeof authHandlers.POST).toBe("function");
  });

  it("harus dapat melakukan hash password dengan hashPassword utility", async () => {
    const raw = "SuperSecretPassword123!";
    const hashed = await hashPassword(raw);
    expect(hashed).toBeDefined();
    expect(typeof hashed).toBe("string");
    expect(hashed.length).toBeGreaterThan(10);
    expect(hashed).not.toBe(raw);
  });

  it("harus mengekspor helper session yang valid", () => {
    expect(typeof getSession).toBe("function");
    expect(typeof getAuthContext).toBe("function");
    expect(typeof getUserProfile).toBe("function");
  });

  it("harus menerapkan konfigurasi keamanan ketat (disableSignUp, minPasswordLength 8, rateLimit)", () => {
    const emailAndPasswordOpts = auth.options.emailAndPassword;
    expect(emailAndPasswordOpts).toBeDefined();
    expect(emailAndPasswordOpts?.disableSignUp).toBe(true);
    expect(emailAndPasswordOpts?.minPasswordLength).toBe(8);

    const rateLimitOpts = auth.options.rateLimit;
    expect(rateLimitOpts).toBeDefined();
    expect(rateLimitOpts?.enabled).toBe(true);
    expect(rateLimitOpts?.customRules?.["/sign-in/email"]).toEqual({
      window: 60,
      max: 5,
    });
  });
});

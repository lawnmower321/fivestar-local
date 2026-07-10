import { describe, it, expect, beforeEach } from "vitest";
import { hashPasscode, isValidSession } from "@/lib/replydesk/auth";

describe("auth", () => {
  beforeEach(() => {
    process.env.REPLYDESK_PASSCODE = "correct horse battery staple";
  });
  it("hash is deterministic and hex", () => {
    expect(hashPasscode("abc")).toBe(hashPasscode("abc"));
    expect(hashPasscode("abc")).toMatch(/^[0-9a-f]{64}$/);
  });
  it("accepts the cookie holding the hash of the real passcode", () => {
    expect(isValidSession(hashPasscode("correct horse battery staple"))).toBe(true);
  });
  it("rejects wrong or missing cookies", () => {
    expect(isValidSession(hashPasscode("wrong"))).toBe(false);
    expect(isValidSession(undefined)).toBe(false);
    expect(isValidSession("")).toBe(false);
  });
  it("rejects everything when the env passcode is unset", () => {
    delete process.env.REPLYDESK_PASSCODE;
    expect(isValidSession(hashPasscode("anything"))).toBe(false);
  });
});

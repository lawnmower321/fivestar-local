import { describe, it, expect } from "vitest";
import { userFromClaims } from "@/lib/auth/claims";

describe("userFromClaims", () => {
  it("returns the id for a valid sub", () => {
    expect(userFromClaims({ claims: { sub: "user-123" } })).toEqual({ id: "user-123" });
  });

  it("returns null when data is null (signed out)", () => {
    expect(userFromClaims(null)).toBeNull();
  });

  it("returns null when sub is missing", () => {
    expect(userFromClaims({ claims: {} })).toBeNull();
  });

  it("returns null when sub is an empty string", () => {
    expect(userFromClaims({ claims: { sub: "" } })).toBeNull();
  });
});

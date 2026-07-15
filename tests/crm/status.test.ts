import { describe, it, expect } from "vitest";
import { STATUSES, isClientStatus, canDeleteBusiness } from "@/lib/crm/status";

describe("STATUSES", () => {
  it("lists the four client statuses in order", () => {
    expect(STATUSES).toEqual(["lead", "active", "paused", "churned"]);
  });
});

describe("isClientStatus", () => {
  it.each(STATUSES)("accepts %s", (s) => {
    expect(isClientStatus(s)).toBe(true);
  });
  it("rejects unknown values", () => {
    expect(isClientStatus("prospect")).toBe(false);
    expect(isClientStatus("")).toBe(false);
    expect(isClientStatus("Lead")).toBe(false);
  });
});

describe("canDeleteBusiness", () => {
  it("allows deleting a lead", () => {
    expect(canDeleteBusiness("lead")).toBe(true);
  });
  it.each(["active", "paused", "churned"] as const)("refuses %s", (s) => {
    expect(canDeleteBusiness(s)).toBe(false);
  });
});

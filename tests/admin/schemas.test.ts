import { describe, it, expect } from "vitest";
import {
  loginSchema, createBusinessSchema, generateReplySchema,
  markPostedSchema, buildKbFromUrlSchema, buildKbFromTextSchema,
  saveKbSchema, saveVoiceSchema, extractVoiceSchema, deleteBusinessSchema,
  updateClientSchema, addNoteSchema, deleteNoteSchema,
  createTaskSchema, setTaskStatusSchema, deleteTaskSchema,
} from "@/app/admin/schemas";

const UUID = "a2f7c1de-3b44-4e6f-9a10-8a2f1c3d4e5f";

describe("loginSchema", () => {
  it("accepts a valid email + password", () => {
    expect(loginSchema.parse({ email: "a@b.com", password: "x" }))
      .toEqual({ email: "a@b.com", password: "x" });
  });
  it("rejects a malformed email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });
  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("createBusinessSchema", () => {
  it("trims the name", () => {
    expect(createBusinessSchema.parse({ name: "  Tony's  ", reviewUrl: "" }).name).toBe("Tony's");
  });
  it("rejects an empty name", () => {
    expect(createBusinessSchema.safeParse({ name: "   ", reviewUrl: "" }).success).toBe(false);
  });
  it("keeps an http(s) review URL", () => {
    expect(createBusinessSchema.parse({ name: "T", reviewUrl: "https://g.page/x" }).reviewUrl)
      .toBe("https://g.page/x");
  });
  it("nulls a non-http review URL (javascript:)", () => {
    expect(createBusinessSchema.parse({ name: "T", reviewUrl: "javascript:alert(1)" }).reviewUrl)
      .toBeNull();
  });
});

describe("generateReplySchema", () => {
  const base = { businessId: UUID, rating: 5, reviewer: "", reviewText: "Great!" };
  it("accepts a valid input", () => {
    expect(generateReplySchema.parse(base).rating).toBe(5);
  });
  it("rejects rating 0", () => {
    expect(generateReplySchema.safeParse({ ...base, rating: 0 }).success).toBe(false);
  });
  it("rejects rating 6 (above the upper bound)", () => {
    expect(generateReplySchema.safeParse({ ...base, rating: 6 }).success).toBe(false);
  });
  it("rejects a fractional rating", () => {
    expect(generateReplySchema.safeParse({ ...base, rating: 4.5 }).success).toBe(false);
  });
  it("rejects empty review text", () => {
    expect(generateReplySchema.safeParse({ ...base, reviewText: "  " }).success).toBe(false);
  });
});

describe("id schemas", () => {
  it("markPostedSchema accepts two valid uuids", () => {
    expect(markPostedSchema.parse({ reviewId: UUID, businessId: UUID }))
      .toEqual({ reviewId: UUID, businessId: UUID });
  });
  it("markPostedSchema rejects a non-uuid", () => {
    expect(markPostedSchema.safeParse({ reviewId: "nope", businessId: UUID }).success).toBe(false);
  });
  it("buildKbFromUrlSchema accepts an https url", () => {
    expect(buildKbFromUrlSchema.parse({ businessId: UUID, url: "https://example.com" }))
      .toEqual({ businessId: UUID, url: "https://example.com" });
  });
  it("buildKbFromUrlSchema rejects a javascript: url", () => {
    expect(buildKbFromUrlSchema.safeParse({ businessId: UUID, url: "javascript:x" }).success).toBe(false);
  });
  it("buildKbFromTextSchema accepts real text", () => {
    expect(buildKbFromTextSchema.parse({ businessId: UUID, raw: "real text" }))
      .toEqual({ businessId: UUID, raw: "real text" });
  });
  it("buildKbFromTextSchema rejects whitespace-only text", () => {
    expect(buildKbFromTextSchema.safeParse({ businessId: UUID, raw: "   " }).success).toBe(false);
  });
});

describe("saveKbSchema", () => {
  it("accepts a valid businessId + kbMd", () => {
    expect(saveKbSchema.parse({ businessId: UUID, kbMd: "## KB" }))
      .toEqual({ businessId: UUID, kbMd: "## KB" });
  });
  it("rejects a non-uuid businessId", () => {
    expect(saveKbSchema.safeParse({ businessId: "nope", kbMd: "## KB" }).success).toBe(false);
  });
});

describe("saveVoiceSchema", () => {
  it("accepts a valid businessId + voiceMd", () => {
    expect(saveVoiceSchema.parse({ businessId: UUID, voiceMd: "## Voice" }))
      .toEqual({ businessId: UUID, voiceMd: "## Voice" });
  });
  it("rejects a non-uuid businessId", () => {
    expect(saveVoiceSchema.safeParse({ businessId: "nope", voiceMd: "## Voice" }).success).toBe(false);
  });
});

describe("extractVoiceSchema", () => {
  it("accepts a valid businessId + pastReplies", () => {
    expect(extractVoiceSchema.parse({ businessId: UUID, pastReplies: "some text" }))
      .toEqual({ businessId: UUID, pastReplies: "some text" });
  });
  it("rejects whitespace-only pastReplies", () => {
    expect(extractVoiceSchema.safeParse({ businessId: UUID, pastReplies: "   " }).success).toBe(false);
  });
});

describe("deleteBusinessSchema", () => {
  it("accepts a valid businessId", () => {
    expect(deleteBusinessSchema.parse({ businessId: UUID })).toEqual({ businessId: UUID });
  });
  it("rejects a non-uuid businessId", () => {
    expect(deleteBusinessSchema.safeParse({ businessId: "nope" }).success).toBe(false);
  });
});

describe("updateClientSchema", () => {
  const base = {
    businessId: UUID,
    status: "active",
    contactName: "Sam",
    contactEmail: "sam@example.com",
    contactPhone: "555-1234",
    reviewUrl: "https://g.page/r/abc",
  };
  it("accepts a full valid update", () => {
    expect(updateClientSchema.parse(base)).toEqual(base);
  });
  it("nulls empty contact fields and non-http review links", () => {
    const out = updateClientSchema.parse({
      businessId: UUID, status: "lead",
      contactName: "  ", contactEmail: "", contactPhone: "", reviewUrl: "not a url",
    });
    expect(out).toEqual({
      businessId: UUID, status: "lead",
      contactName: null, contactEmail: null, contactPhone: null, reviewUrl: null,
    });
  });
  it("rejects an unknown status", () => {
    expect(updateClientSchema.safeParse({ ...base, status: "prospect" }).success).toBe(false);
  });
  it("rejects a malformed email", () => {
    expect(updateClientSchema.safeParse({ ...base, contactEmail: "not-an-email" }).success).toBe(false);
  });
  it("rejects a non-uuid businessId", () => {
    expect(updateClientSchema.safeParse({ ...base, businessId: "nope" }).success).toBe(false);
  });
});

describe("addNoteSchema", () => {
  it("trims the body and requires non-empty", () => {
    const out = addNoteSchema.parse({
      businessId: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff", body: "  called them  ",
    });
    expect(out.body).toBe("called them");
    expect(() => addNoteSchema.parse({
      businessId: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff", body: "   ",
    })).toThrow();
  });
  it("rejects a non-uuid businessId", () => {
    expect(() => addNoteSchema.parse({ businessId: "nope", body: "x" })).toThrow();
  });
});

describe("deleteNoteSchema", () => {
  it("requires uuids for both ids", () => {
    expect(() => deleteNoteSchema.parse({ activityId: "nope", businessId: "nope" })).toThrow();
  });
});

describe("createTaskSchema", () => {
  const uuid = "6f9619ff-8b86-4d01-b42d-00cf4fc964ff";
  it("degrades empty businessId/dueDate/assignee to null", () => {
    const out = createTaskSchema.parse({ businessId: "", title: "Send invoice", dueDate: "", assignee: "" });
    expect(out).toEqual({ businessId: null, title: "Send invoice", dueDate: null, assignee: null });
  });
  it("accepts a full input", () => {
    const out = createTaskSchema.parse({ businessId: uuid, title: " x ", dueDate: "2026-08-01", assignee: uuid });
    expect(out.title).toBe("x");
    expect(out.dueDate).toBe("2026-08-01");
  });
  it("rejects a malformed date and an empty title", () => {
    expect(() => createTaskSchema.parse({ businessId: "", title: "x", dueDate: "8/1/2026", assignee: "" })).toThrow();
    expect(() => createTaskSchema.parse({ businessId: "", title: "  ", dueDate: "", assignee: "" })).toThrow();
  });
});

describe("setTaskStatusSchema", () => {
  const uuid = "6f9619ff-8b86-4d01-b42d-00cf4fc964ff";
  it("parses taskId + optional businessId + done flag", () => {
    expect(setTaskStatusSchema.parse({ taskId: uuid, businessId: "", done: true }))
      .toEqual({ taskId: uuid, businessId: null, done: true });
  });
});

describe("deleteTaskSchema", () => {
  const uuid = "6f9619ff-8b86-4d01-b42d-00cf4fc964ff";
  it("parses taskId + optional businessId", () => {
    expect(deleteTaskSchema.parse({ taskId: uuid, businessId: "" }))
      .toEqual({ taskId: uuid, businessId: null });
  });
  it("rejects a non-uuid taskId", () => {
    expect(() => deleteTaskSchema.parse({ taskId: "nope", businessId: "" })).toThrow();
  });
});

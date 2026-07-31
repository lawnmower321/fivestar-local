import { describe, it, expect } from "vitest";
import { activityLabel } from "@/lib/crm/timeline";
import type { Activity } from "@/lib/crm/types";

function act(partial: Partial<Activity>): Activity {
  return {
    id: "a1", businessId: "b1", userId: "u1", type: "note",
    body: null, metadata: null, createdAt: "2026-07-31T12:00:00Z",
    ...partial,
  };
}

describe("activityLabel", () => {
  it("note -> its body", () => {
    expect(activityLabel(act({ type: "note", body: "called them" }))).toBe("called them");
  });
  it("reply_posted -> fixed label", () => {
    expect(activityLabel(act({ type: "reply_posted", metadata: { review_id: "r1" } })))
      .toBe("Posted a review reply");
  });
  it("status_change -> from -> to", () => {
    expect(activityLabel(act({ type: "status_change", metadata: { from: "lead", to: "active" } })))
      .toBe("Status changed: lead \u2192 active");
  });
  it("kb_updated -> section-aware", () => {
    expect(activityLabel(act({ type: "kb_updated", metadata: { section: "kb" } })))
      .toBe("Knowledgebase updated");
    expect(activityLabel(act({ type: "kb_updated", metadata: { section: "voice" } })))
      .toBe("Voice guide updated");
  });
  it("task_completed -> quotes the task-title snapshot", () => {
    expect(activityLabel(act({ type: "task_completed", body: "Send invoice" })))
      .toBe("Completed task: \u201cSend invoice\u201d");
  });
  it("degrades safely on missing metadata", () => {
    expect(activityLabel(act({ type: "status_change", metadata: null })))
      .toBe("Status changed: ? \u2192 ?");
    expect(activityLabel(act({ type: "task_completed", body: null })))
      .toBe("Completed a task");
  });
});

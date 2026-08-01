import { z } from "zod";
import { STATUSES } from "@/lib/crm/status";

// Every server action parses its input with one of these immediately after
// requireUser() — malformed input fails before any DB or AI call.

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const HTTP_URL_RE = /^https?:\/\//;
const httpUrl = z.string().regex(HTTP_URL_RE, "must start with http(s)://");

export const createBusinessSchema = z.object({
  name: z.string().trim().min(1),
  // Non-http(s) input degrades to null (never reaches an <a href>) — same
  // behavior as the pre-zod regex in createBusinessAction.
  reviewUrl: z.string().trim().transform((s) => (HTTP_URL_RE.test(s) ? s : null)),
});

export const saveKbSchema = z.object({ businessId: z.uuid(), kbMd: z.string() });
export const saveVoiceSchema = z.object({ businessId: z.uuid(), voiceMd: z.string() });
export const buildKbFromUrlSchema = z.object({ businessId: z.uuid(), url: httpUrl });
export const buildKbFromTextSchema = z.object({ businessId: z.uuid(), raw: z.string().trim().min(1) });
export const extractVoiceSchema = z.object({ businessId: z.uuid(), pastReplies: z.string().trim().min(1) });

export const generateReplySchema = z.object({
  businessId: z.uuid(),
  rating: z.number().int().min(1).max(5),
  reviewer: z.string(),
  reviewText: z.string().trim().min(1),
});

export const markPostedSchema = z.object({ reviewId: z.uuid(), businessId: z.uuid() });
export const deleteBusinessSchema = z.object({ businessId: z.uuid() });

// Empty-string inputs from cleared form fields degrade to null.
const optionalTrimmed = z.string().trim().transform((s) => (s === "" ? null : s));

export const updateClientSchema = z.object({
  businessId: z.uuid(),
  status: z.enum(STATUSES),
  contactName: optionalTrimmed,
  contactEmail: optionalTrimmed.pipe(z.email().nullable()),
  contactPhone: optionalTrimmed,
  reviewUrl: z.string().trim().transform((s) => (HTTP_URL_RE.test(s) ? s : null)),
});

export const addNoteSchema = z.object({
  businessId: z.uuid(),
  body: z.string().trim().min(1),
});

export const deleteNoteSchema = z.object({
  activityId: z.uuid(),
  businessId: z.uuid(),
});

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// Empty form fields degrade to null (same convention as optionalTrimmed).
const optionalUuid = z.string().trim().transform((s) => (s === "" ? null : s)).pipe(z.uuid().nullable());
const optionalDate = z.string().trim().transform((s) => (s === "" ? null : s))
  .pipe(z.string().regex(DATE_RE, "must be YYYY-MM-DD").nullable());

export const createTaskSchema = z.object({
  businessId: optionalUuid,
  title: z.string().trim().min(1),
  dueDate: optionalDate,
  assignee: optionalUuid,
});
export const setTaskStatusSchema = z.object({
  taskId: z.uuid(),
  businessId: optionalUuid,
  done: z.boolean(),
});
export const deleteTaskSchema = z.object({
  taskId: z.uuid(),
  businessId: optionalUuid,
});

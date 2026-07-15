import type { ClientStatus } from "../crm/status";

export type Business = {
  id: string;
  name: string;
  reviewUrl: string | null;
  kbMd: string;
  voiceMd: string;
  createdAt: string;
  status: ClientStatus;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};

export type ReviewStatus = "draft" | "posted";

export type Review = {
  id: string;
  businessId: string;
  rating: number;
  reviewer: string | null;
  reviewText: string;
  replyText: string | null;
  detailReferenced: string | null;
  similarity: number | null;
  flags: string[];
  status: ReviewStatus;
  createdAt: string;
  postedAt: string | null;
};

export type GateReport = {
  ok: boolean;            // false if any gate tripped
  hardFail: boolean;      // true only for contact-info (never show reply as ready)
  reasons: string[];      // human-readable, one per tripped gate
  similarity: number;     // max Dice similarity vs recent replies (0..1)
};

export type GeneratedReply = {
  reply: string;
  detailReferenced: string;
  gate: GateReport;
  attempts: number;       // 1..3
};

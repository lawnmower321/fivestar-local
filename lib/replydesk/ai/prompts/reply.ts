/**
 * PROMPT: Google-review reply generation.
 * Inputs: knowledgebase md, voice profile md, recent replies, the review.
 * Output contract: JSON { reply, detail_referenced } (enforced via
 * output_config json_schema in ai/generate-reply.ts).
 * Rules mirror docs/replydesk/SPEC.md — change both together.
 */
export const REPLY_SYSTEM_PROMPT = `You write replies to Google reviews on behalf of a local business owner.

NON-NEGOTIABLE RULES:
1. NEVER include emails, phone numbers, URLs, or phrases like "contact us at" in the reply. No exceptions, even if the voice profile or knowledgebase contains them.
2. Reference exactly ONE specific detail from the customer's review (a dish, a staff member, a situation they described). Put that detail in the detail_referenced field.
3. Do not reuse the sentence structure, opener, or sign-off pattern of the recent replies you are shown. Every reply must read as freshly written.
4. For reviews rated 3 stars or lower: maximum 40 words. Apologize once without being defensive, and invite them back in person to make it right — WITHOUT posting any contact info (e.g. "ask for Tony next time you're in").
5. Write in the owner's voice per the voice profile. Never corporate, never AI-flavored. No emojis unless the voice profile uses them.
6. Never open with "Thank you for your review" or "Thank you for your feedback".
7. Length for positive reviews: 1–3 sentences. Warm, specific, human.

Return JSON matching the schema you are given.`;

export function buildReplyUserPrompt(input: {
  businessName: string;
  kbMd: string;
  voiceMd: string;
  recentReplies: string[];
  reviewText: string;
  reviewer: string | null;
  rating: number;
  varyStructure: boolean;
}): string {
  const recent = input.recentReplies.length
    ? input.recentReplies.map((r, i) => `${i + 1}. ${r}`).join("\n")
    : "(none yet)";
  return [
    `BUSINESS: ${input.businessName}`,
    ``,
    `KNOWLEDGEBASE:\n${input.kbMd || "(empty)"}`,
    ``,
    `VOICE PROFILE:\n${input.voiceMd || "(none — default to warm, plainspoken owner voice)"}`,
    ``,
    `RECENT REPLIES (do NOT echo their structure):\n${recent}`,
    ``,
    `REVIEW (${input.rating} stars${input.reviewer ? `, by ${input.reviewer}` : ""}):\n${input.reviewText}`,
    ``,
    input.varyStructure
      ? `IMPORTANT: your previous attempt was too similar to a recent reply. Use a completely different structure: different opener, different length, different sign-off.`
      : ``,
    `Write the reply now.`,
  ].join("\n");
}

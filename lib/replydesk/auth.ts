import { createHash, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "rd_session";

export function hashPasscode(p: string): string {
  return createHash("sha256").update(p).digest("hex");
}

export function isValidSession(cookieValue: string | undefined): boolean {
  const pass = process.env.REPLYDESK_PASSCODE;
  if (!pass || !cookieValue) return false;
  const expected = Buffer.from(hashPasscode(pass));
  const got = Buffer.from(cookieValue);
  return got.length === expected.length && timingSafeEqual(got, expected);
}

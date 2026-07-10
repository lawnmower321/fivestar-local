import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hashPasscode, isValidSession, SESSION_COOKIE } from "@/lib/replydesk/auth";

async function login(formData: FormData) {
  "use server";
  const passcode = String(formData.get("passcode") ?? "");
  const candidate = hashPasscode(passcode);
  if (!isValidSession(candidate)) redirect("/admin/login?error=1");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, candidate, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/admin",
  });
  redirect("/admin");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form action={login} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-slate-900">ReplyDesk</h1>
        <p className="mt-1 text-sm text-slate-500">FiveStar Local internal console</p>
        {error && <p className="mt-4 text-sm text-gred">Wrong passcode.</p>}
        <input
          type="password"
          name="passcode"
          autoFocus
          placeholder="Passcode"
          className="mt-6 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue"
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-gblue px-4 py-2 text-sm font-medium text-white hover:bg-gblue/90"
        >
          Enter
        </button>
      </form>
    </main>
  );
}

import { redirect } from "next/navigation";
import { getAuthClient } from "@/app/admin/auth-client";
import { loginSchema } from "@/app/admin/schemas";

async function login(formData: FormData) {
  "use server";
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) redirect("/admin/login?error=1");
  const supabase = await getAuthClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // One generic failure message — no user-enumeration detail.
  if (error) redirect("/admin/login?error=1");
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
        {error && <p className="mt-4 text-sm text-gred">Wrong email or password.</p>}
        <input
          type="email"
          name="email"
          autoFocus
          required
          placeholder="Email"
          className="mt-6 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue"
        />
        <input
          type="password"
          name="password"
          required
          placeholder="Password"
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue"
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-gblue px-4 py-2 text-sm font-medium text-white hover:bg-gblue/90"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}

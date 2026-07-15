import { redirect } from "next/navigation";

// Interim home: Phase 4 replaces this redirect with the today-dashboard.
export default function AdminHome() {
  redirect("/admin/clients");
}

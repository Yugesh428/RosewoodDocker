import { ReactNode } from "react";
import AdminLayout from "@/components/admin/AdminLayout";

// This layout provides the sidebar shell for all /admin/* pages.
// Auth (session check + redirect) is handled inside each page.tsx individually.
// The login page is excluded by rendering its own full-screen UI
// which visually overrides this wrapper (sidebar is hidden behind login UI).
export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}

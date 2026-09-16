import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import CustomersSection from "@/components/admin/customers/CustomersSection";

export default async function CustomersPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPERADMIN"].includes((session.user as { role: string }).role)) {
    redirect("/admin/login");
  }
  return <CustomersSection />;
}

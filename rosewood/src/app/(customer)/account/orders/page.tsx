import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import CustomerOrdersClient from "./_components/CustomerOrdersClient";

export default async function CustomerOrdersPage() {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "CUSTOMER") {
    redirect("/login");
  }

  const user = session.user as {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
  };

  return <CustomerOrdersClient customerId={user.id} />;
}

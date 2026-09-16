import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import CustomerWishlistClient from "./_components/CustomerWishlistClient";

export default async function CustomerWishlistPage() {
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

  return <CustomerWishlistClient customerId={user.id} customerName={user.name || "Your"} />;
}

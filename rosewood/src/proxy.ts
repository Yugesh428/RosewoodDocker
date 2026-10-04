import { auth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

const SECURE_ADMIN_LOGIN = "/secure-admin-access-2024";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Protect all /admin routes except the secure login page
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.redirect(new URL(SECURE_ADMIN_LOGIN, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/((?!login).*)"],
};

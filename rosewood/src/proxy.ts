import { auth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Protect all /admin routes except login
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/((?!login).*)"],
};

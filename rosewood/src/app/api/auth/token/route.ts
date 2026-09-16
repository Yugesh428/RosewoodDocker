import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/auth/token
 * Returns the decoded JWT payload for the current session.
 * Only works when the user is already signed in (session cookie present).
 * Useful for debugging — remove or protect this route in production.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    raw: false, // decoded payload
  });

  if (!token) {
    return NextResponse.json(
      { error: "Not authenticated. Sign in first." },
      { status: 401 },
    );
  }

  return NextResponse.json({ token }, { status: 200 });
}

/**
 * GET /api/auth/token?raw=true
 * Returns the raw signed JWT string (the actual Bearer token).
 */
export async function POST(req: NextRequest) {
  const rawJwt = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    raw: true, // signed JWT string
  });

  if (!rawJwt) {
    return NextResponse.json(
      { error: "Not authenticated. Sign in first." },
      { status: 401 },
    );
  }

  return NextResponse.json({ jwt: rawJwt }, { status: 200 });
}

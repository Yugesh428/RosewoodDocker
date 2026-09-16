export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { handlers } from "@/lib/auth/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  return handlers.POST(request);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import {
  getCategories,
  createCategory,
} from "@/features/Ui/ourProductCollection/productCollectionCategroryController";

// GET  /api/ui/collection/categories          — public (active) | admin (?all=true)
export async function GET(req: NextRequest) {
  return getCategories(req);
}

// POST /api/ui/collection/categories          — admin: create category
export async function POST(req: NextRequest) {
  return createCategory(req);
}

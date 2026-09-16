/* eslint-disable @typescript-eslint/no-require-imports */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const bcrypt = require("bcryptjs") as typeof import("bcryptjs");
    const { Pool } = require("pg") as typeof import("pg");
    const { v4: uuidv4 } = require("uuid") as typeof import("uuid");

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 2,
    });

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [normalizedEmail],
    );
    if (existing.rows.length > 0) {
      await pool.end();
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const id = uuidv4();
    const now = new Date();

    await pool.query(
      `INSERT INTO users (id, name, email, password, role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'CUSTOMER', $5, $6)`,
      [id, name.trim(), normalizedEmail, hashedPassword, now, now],
    );
    await pool.end();

    return NextResponse.json(
      { message: "Account created successfully." },
      { status: 201 },
    );
  } catch (err) {
    console.error("[REGISTER] error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

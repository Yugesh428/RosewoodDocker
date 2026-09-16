import { NextResponse } from "next/server";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorResponse(error: unknown, fallbackMessage = "Internal server error") {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: error.statusCode },
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { success: false, error: fallbackMessage },
    { status: 500 },
  );
}

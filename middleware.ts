import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth removed - all routes are now public
export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: []
};

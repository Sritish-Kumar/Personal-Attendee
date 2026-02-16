import { NextResponse } from "next/server";

import { firestoreHealthCheck } from "@/lib/firebase/health";

export async function GET() {
  try {
    const result = await firestoreHealthCheck();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Firestore health check error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { firestoreHealthCheck } from "@/lib/firebase/health";

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await firestoreHealthCheck();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Firestore health check error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

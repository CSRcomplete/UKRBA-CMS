import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Build ID of the running server. Open tabs poll this and reload when it changes. */
export async function GET() {
  return NextResponse.json(
    { buildId: process.env.NEXT_PUBLIC_BUILD_ID ?? "dev" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

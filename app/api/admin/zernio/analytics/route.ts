import { NextRequest, NextResponse } from "next/server";
import { getZernioClient } from "@/lib/zernio";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      platform: searchParams.get("platform") || undefined,
      accountId: searchParams.get("accountId") || undefined,
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
    };
    
    const client = getZernioClient();
    const { data } = await client.analytics.getAnalytics({ query: params });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Zernio analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
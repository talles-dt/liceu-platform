import { NextRequest, NextResponse } from "next/server";
import { getZernioClient } from "@/lib/zernio";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      platform: searchParams.get("platform") || undefined,
      accountId: searchParams.get("accountId") || undefined,
      status: searchParams.get("status") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined,
    };
    
    const client = getZernioClient();
    const { data } = await client.messages.listInboxConversations({ query: params });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Zernio inbox error:", error);
    return NextResponse.json({ error: "Failed to fetch inbox" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { getZernioClient, listConnectedAccounts } from "@/lib/zernio";

export async function GET(request: NextRequest) {
  try {
    const accounts = await listConnectedAccounts();
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Zernio accounts error:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}
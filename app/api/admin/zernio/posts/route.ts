import { NextRequest, NextResponse } from "next/server";
import { getZernioClient, createPost, listConnectedAccounts } from "@/lib/zernio";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      status: searchParams.get("status") || undefined,
      platform: searchParams.get("platform") || undefined,
      accountId: searchParams.get("accountId") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined,
    };
    
    const client = getZernioClient();
    const { data } = await client.posts.listPosts({ query: params });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Zernio posts error:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      content: string;
      platforms: { platform: string; accountId: string }[];
      scheduledFor?: string;
      publishNow?: boolean;
      mediaUrls?: string[];
      isDraft?: boolean;
    };
    
    const result = await createPost(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Zernio create post error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
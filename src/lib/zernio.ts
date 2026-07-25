// src/lib/zernio.ts
// Zernio integration for Liceu Underground
// Handles social media scheduling and cross-platform messaging

import Zernio from "@zernio/node";

// Lazy singleton client
let zernioClient: Zernio | null = null;

export function getZernioClient(): Zernio {
  if (!zernioClient) {
    const apiKey = process.env.ZERNIO_API_KEY;
    if (!apiKey) {
      throw new Error("ZERNIO_API_KEY not configured");
    }
    zernioClient = new Zernio({ apiKey });
  }
  return zernioClient;
}

// ─── Account Management ────────────────────────────────────────

export async function listConnectedAccounts() {
  const client = getZernioClient();
  const { data } = await client.accounts.listAccounts();
  return data.accounts.map((acc: any) => ({
    id: acc.id,
    platform: acc.platform,
    handle: acc.handle,
    status: acc.status,
  }));
}

export async function getAccountByPlatform(platform: string) {
  const accounts = await listConnectedAccounts();
  return accounts.find((acc: any) => acc.platform === platform);
}

export async function checkAccountsHealth() {
  const client = getZernioClient();
  const { data } = await client.accounts.getAllAccountsHealth();
  return data.accounts;
}

// ─── Post Creation & Scheduling ────────────────────────────────

export interface CreatePostInput {
  content: string;
  platforms: { platform: string; accountId: string }[];
  scheduledFor?: string; // ISO 8601, future date = scheduled
  publishNow?: boolean; // if true, posts immediately
  mediaUrls?: string[]; // optional media URLs
  isDraft?: boolean; // if true, saves as draft
}

export async function createPost(input: CreatePostInput) {
  const client = getZernioClient();

  const { data } = await client.posts.createPost({
    body: {
      content: input.content,
      platforms: input.platforms,
      scheduledFor: input.scheduledFor,
      publishNow: input.publishNow,
      mediaUrls: input.mediaUrls,
      isDraft: input.isDraft,
    },
  });

  return data.post;
}

export async function createDraft(
  content: string,
  platforms: { platform: string; accountId: string }[],
  mediaUrls?: string[]
) {
  return createPost({
    content,
    platforms,
    mediaUrls,
    isDraft: true,
  });
}

export async function schedulePost(
  content: string,
  platforms: { platform: string; accountId: string }[],
  scheduledFor: Date,
  mediaUrls?: string[]
) {
  return createPost({
    content,
    platforms,
    scheduledFor: scheduledFor.toISOString(),
    mediaUrls,
  });
}

export async function publishNow(
  content: string,
  platforms: { platform: string; accountId: string }[],
  mediaUrls?: string[]
) {
  return createPost({
    content,
    platforms,
    publishNow: true,
    mediaUrls,
  });
}

export async function getPostById(postId: string) {
  const client = getZernioClient();
  const { data } = await client.posts.getPost({ path: { postId } });
  return data.post;
}

// ─── Cross-Platform Messaging (Inbox) ──────────────────────────

export interface ListConversationsFilters {
  platform?: string;
  status?: "open" | "closed" | "all";
  limit?: number;
  page?: number;
}

export async function listConversations(filters?: ListConversationsFilters) {
  const client = getZernioClient();
  const { data } = await client.messages.listInboxConversations({
    query: {
      platform: filters?.platform,
      status: filters?.status,
      limit: filters?.limit || 50,
      page: filters?.page,
    },
  });
  return data.conversations;
}

export async function getConversation(conversationId: string, accountId: string) {
  const client = getZernioClient();
  const { data } = await client.messages.getInboxConversation({
    path: { conversationId },
    query: { accountId },
  });
  return data.conversation;
}

export async function sendMessage(
  conversationId: string,
  content: string,
  mediaUrls?: string[]
) {
  const client = getZernioClient();
  const { data } = await client.messages.sendInboxMessage({
    path: { conversationId },
    body: { content, mediaUrls },
  });
  return data.message;
}

// ─── Analytics ──────────────────────────────────────────────────

export async function getPostAnalytics(postId?: string, options?: {
  fromDate?: string;
  toDate?: string;
  platform?: string;
  limit?: number;
}) {
  const client = getZernioClient();
  const { data } = await client.analytics.getAnalytics({
    query: {
      postId,
      fromDate: options?.fromDate,
      toDate: options?.toDate,
      platform: options?.platform,
      limit: options?.limit,
    },
  });
  return data;
}

export async function getAccountAnalytics(accountId: string, period: "7d" | "30d" | "90d" = "30d") {
  const client = getZernioClient();
  const fromDate = new Date(Date.now() - parsePeriod(period)).toISOString();
  const { data } = await client.analytics.getAnalytics({
    query: {
      accountId,
      fromDate,
    },
  });
  return data;
}

function parsePeriod(period: string): number {
  const days = parseInt(period.replace("d", ""), 10);
  return days * 24 * 60 * 60 * 1000;
}

// ─── Media Upload ──────────────────────────────────────────────

export async function uploadMedia(
  file: Buffer,
  mimeType: string,
  filename: string
) {
  const client = getZernioClient();
  
  // Convert Buffer to ArrayBuffer for Blob compatibility
  const arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: mimeType });
  const formData = new FormData();
  formData.append("file", blob, filename);
  formData.append("mimeType", mimeType);

  const { data } = await client.messages.uploadMediaDirect({
    body: formData as any,
  });
  
  return data.media;
}

// ─── Health Check ──────────────────────────────────────────────

export async function checkConnection(): Promise<{ connected: boolean; accounts: number }> {
  try {
    const accounts = await listConnectedAccounts();
    return { connected: true, accounts: accounts.length };
  } catch (error) {
    console.error("Zernio connection check failed:", error);
    return { connected: false, accounts: 0 };
  }
}
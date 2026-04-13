import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

const BUCKET_NAME = "assignment-files";
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * POST /api/cron/cleanup-files
 *
 * Cron job that deletes files in the "assignment-files" storage bucket
 * older than 90 days. Protected by CRON_SECRET bearer token.
 */
export async function POST(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const cutoffDate = new Date(Date.now() - NINETY_DAYS_MS);

  // List all files in the bucket
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list();

  if (listError) {
    return NextResponse.json(
      { error: "Failed to list files", details: listError.message },
      { status: 500 },
    );
  }

  if (!files || files.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  // Filter files older than 90 days
  const expiredFiles = files.filter((file) => {
    const updatedAt = new Date(file.updated_at ?? file.created_at ?? 0);
    return updatedAt < cutoffDate;
  });

  if (expiredFiles.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  const filePaths = expiredFiles.map((file) => file.name);

  // Delete expired files
  const { data: deleteResult, error: deleteError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(filePaths);

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to delete files", details: deleteError.message, deleted: 0 },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted: deleteResult?.length ?? filePaths.length });
}

# Supabase Setup Instructions

## 1. Create the `assignment-files` Storage Bucket

### Via Dashboard (Recommended)
1. Go to [app.supabase.com](https://app.supabase.com) and open your project **rymzyaxhrcusqqzllzay**
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure as follows:
   - **Name**: `assignment-files`
   - **Public bucket**: ✅ Yes
   - **File size limit**: `10485760` (10 MB)
   - **Allowed MIME types**: Leave empty (allow all) or add: `application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain`
5. Click **Create bucket**

### Via SQL (Alternative)
Run this in the SQL Editor:
```sql
-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('assignment-files', 'assignment-files', true, 10485760);
```

## 2. Configure Storage Policies (RLS)

Run these in the SQL Editor to allow authenticated users to upload and read their own files:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload assignment files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to read all files (for review)
CREATE POLICY "Admins can read all assignment files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignment-files'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow users to read their own files
CREATE POLICY "Users can read their own assignment files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignment-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## 3. Verify the Setup

After creating the bucket and policies, test with:

1. **Login** to the platform as a student
2. Navigate to any module with an assignment
3. Click **"Selecionar arquivo"** and upload a small test file (PDF or TXT)
4. Submit the assignment
5. Check the Supabase Storage dashboard — you should see the file under `assignment-files/{userId}/{moduleId}/`

## 4. Required Database Columns

The `assignment_submissions` table needs a `file_url` column. If it doesn't exist yet, run:

```sql
ALTER TABLE assignment_submissions
ADD COLUMN IF NOT EXISTS file_url TEXT;
```

## 5. Optional: Add `reviewer_notes` Column

If the admin review panel needs to leave feedback, ensure this column exists:

```sql
ALTER TABLE assignment_submissions
ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;
```

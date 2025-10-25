# Supabase Storage Setup for Manim Explainer System

## Issue Identified
The error `new row violates row-level security policy` occurs because the Supabase Storage bucket `dreamcut` doesn't have the proper RLS (Row Level Security) policies configured for the explainer video uploads.

## Solution: Configure RLS Policies

### 1. Create Storage Bucket (if not exists)

In your Supabase dashboard, go to **Storage** and create a bucket named `dreamcut`:

```sql
-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dreamcut',
  'dreamcut',
  false, -- Keep private for security
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'image/jpeg', 'image/png', 'image/gif']
);
```

### 2. Enable RLS on Storage Objects

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

### 3. Create RLS Policies

#### Policy 1: Allow users to upload files to their own folder
```sql
-- Policy for uploading files
CREATE POLICY "Users can upload files to their own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'dreamcut' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 2: Allow users to view their own files
```sql
-- Policy for viewing files
CREATE POLICY "Users can view their own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'dreamcut' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 3: Allow users to update their own files
```sql
-- Policy for updating files
CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'dreamcut' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 4: Allow users to delete their own files
```sql
-- Policy for deleting files
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'dreamcut' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. Alternative: Simpler Policy (if above doesn't work)

If the folder-based policies don't work, try this simpler approach:

```sql
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can upload files to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Create simpler policies
CREATE POLICY "Authenticated users can upload to dreamcut" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'dreamcut' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view dreamcut files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'dreamcut' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update dreamcut files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'dreamcut' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete dreamcut files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'dreamcut' 
  AND auth.role() = 'authenticated'
);
```

### 5. Test the Setup

After applying the RLS policies, test the API:

```bash
# Test the generation endpoint
curl -X POST http://localhost:3001/api/explainers/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "animate a rotating cube",
    "hasVoiceover": false,
    "voiceStyle": "educational",
    "language": "english",
    "duration": 5,
    "aspectRatio": "16:9",
    "resolution": "720p",
    "style": "auto"
  }'
```

### 6. File Path Structure

The system uses this file path structure:
```
dreamcut/
└── renders/
    └── explainers/
        └── {user_id}/
            └── {job_id}.mp4
```

Example: `dreamcut/renders/explainers/550e8400-e29b-41d4-a716-446655440000/123e4567-e89b-12d3-a456-426614174000.mp4`

### 7. Troubleshooting

#### If you still get RLS errors:

1. **Check if the bucket exists:**
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'dreamcut';
   ```

2. **Check if RLS is enabled:**
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'objects' AND schemaname = 'storage';
   ```

3. **List existing policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
   ```

4. **Test with a simple upload:**
   ```sql
   -- Test if you can insert a record
   INSERT INTO storage.objects (bucket_id, name, owner, path_tokens)
   VALUES ('dreamcut', 'test.txt', auth.uid(), ARRAY['test.txt']);
   ```

### 8. Alternative: Use Public Bucket (Less Secure)

If RLS continues to cause issues, you can make the bucket public (less secure but simpler):

```sql
-- Make bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'dreamcut';

-- Remove RLS policies
DROP POLICY IF EXISTS "Users can upload files to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
```

## Expected Result

After setting up the RLS policies correctly, the API should be able to:
1. Create signed upload URLs for the `dreamcut` bucket
2. Upload MP4 files to the user's folder
3. Allow users to view and download their generated videos

The error `new row violates row-level security policy` should be resolved.


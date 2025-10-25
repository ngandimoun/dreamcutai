# DreamCut Storage Structure Documentation

## Overview
This document outlines the complete storage structure for the DreamCut application, including bucket organization, folder structure, file naming conventions, and signed URL patterns.

## Storage Bucket Configuration

### Primary Bucket
- **Bucket Name:** `dreamcut`
- **Bucket ID:** `dreamcut`
- **Created:** 2025-10-09 00:04:10.317861+00
- **Status:** Active and operational

## Folder Structure

The storage bucket follows a consistent hierarchical structure:

```
dreamcut/
└── renders/
    ├── avatars/
    │   └── {user_id}/
    │       ├── references/
    │       ├── logo/
    │       └── generated/
    ├── charts/
    │   └── {user_id}/
    │       ├── csv/
    │       ├── logo/
    │       └── generated/
    ├── comics/
    │   └── {user_id}/
    ├── concept-worlds/
    │   └── {user_id}/
    │       ├── references/
    │       ├── logo/
    │       └── generated/
    ├── explainers/
    │   └── {user_id}/
    │       └── {job_id}.mp4
    ├── illustrations/
    │   └── {user_id}/
    │       ├── references/
    │       └── generated/
    ├── music-jingles/
    │   └── {user_id}/
    │       └── generated/
    ├── product-mockups/
    │   └── {user_id}/
    │       ├── references/
    │       ├── logo/
    │       └── generated/
    ├── diverse-motion/
    │   ├── single/
    │   │   └── {user_id}/
    │   │       ├── assets/
    │   │       └── generated/
    │   └── dual/
    │       └── {user_id}/
    │           ├── assets/
    │           └── generated/
    ├── sound-fx/
    │   └── {user_id}/
    │       ├── references/
    │       └── generated/
    ├── subtitles/
    │   └── {user_id}/
    │       └── generated/
    ├── talking-avatars/
    │   └── {user_id}/
    │       └── generated/
    ├── translations/
    │   └── {user_id}/
    ├── ugc-ads/
    │   └── {user_id}/
    │       ├── logos/
    │       ├── products/
    │       └── generated/
    ├── voice-creation/
    │   └── {user_id}/
    │       └── generated/
    ├── voiceovers/
    │   └── {user_id}/
    │       └── generated/
    └── watermarks/
        └── {user_id}/
            ├── input/
            └── output/
```

## Content Type Storage Mapping

### Visuals Category
| Content Type | Table | Storage Path Pattern | Storage Fields |
|--------------|-------|---------------------|----------------|
| **Illustrations** | `illustrations` | `renders/illustrations/{user_id}/generated/` | `storage_paths` (ARRAY) |
| **Comics** | `comics` | `renders/comics/{user_id}/` | `storage_path` (TEXT) |
| **Avatars & Personas** | `avatars_personas` | `renders/avatars/{user_id}/generated/` | `storage_paths` (ARRAY) |
| **Product Mockups** | `product_mockups` | `renders/product-mockups/{user_id}/` | `storage_paths` (ARRAY) |
| **Concept Worlds** | `concept_worlds` | `renders/concept-worlds/{user_id}/generated/` | `storage_paths` (ARRAY) |
| **Charts & Infographics** | `charts_infographics` | `renders/charts/{user_id}/generated/` | `storage_paths` (ARRAY) |

### Audios Category
| Content Type | Table | Storage Path Pattern | Storage Fields |
|--------------|-------|---------------------|----------------|
| **Voice Creation** | `voices_creations` | `renders/voice-creation/{user_id}/generated/` | `storage_path` (TEXT) |
| **Voiceovers** | `voiceovers` | `renders/voiceovers/{user_id}/generated/` | `storage_path` (TEXT) |
| **Music & Jingles** | `music_jingles` | `renders/music-jingles/{user_id}/generated/` | `storage_path` (TEXT) |
| **Sound FX** | `sound_fx` | `renders/sound-fx/{user_id}/generated/` | `storage_path` (TEXT) |

### Motions Category
| Content Type | Table | Storage Path Pattern | Storage Fields |
|--------------|-------|---------------------|----------------|
| **Explainers** | `explainers` | `renders/explainers/{user_id}/{job_id}.mp4` | `storage_path` (TEXT) |
| **UGC Ads** | `ugc_ads` | `renders/ugc-ads/{user_id}/generated/` | `storage_path` (TEXT) |
| **Diverse Motion Single** | `diverse_motion_single` | `renders/diverse-motion/single/{user_id}/generated/` | `storage_path` (TEXT) |
| **Diverse Motion Dual** | `diverse_motion_dual` | `renders/diverse-motion/dual/{user_id}/generated/` | `storage_path` (TEXT) |
| **Talking Avatars** | `talking_avatars` | `renders/talking-avatars/{user_id}/generated/` | `storage_path` (TEXT) |

### Edit Category
| Content Type | Table | Storage Path Pattern | Storage Fields |
|--------------|-------|---------------------|----------------|
| **Subtitles** | `subtitles` | `renders/subtitles/{user_id}/generated/` | `storage_path` (TEXT) |
| **Watermarks** | `watermarks` | `renders/watermarks/{user_id}/output/` | `storage_path` (TEXT) |
| **Video Translations** | `video_translations` | `renders/translations/{user_id}/` | `storage_path` (TEXT) |

## File Naming Conventions

### Generated Content Files
- **Images:** `{uuid}-generated_{index}.{ext}` (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890-generated_1.jpg`)
- **Videos:** `{uuid}-generated.{ext}` (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890-generated.mp4`)
- **Audio:** `{uuid}-generated.{ext}` (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890-generated.mp3`)
- **Explainers:** `{job_id}.mp4` (e.g., `3df86907-544a-4edc-bdd5-5caa9080466a.mp4`)

### Reference Files
- **Images:** `ref_{timestamp}_{index}.{ext}` (e.g., `ref_1703123456789_0.jpg`)
- **Logos:** `logo_{timestamp}.{ext}` (e.g., `logo_1703123456789.png`)
- **CSV Files:** `{uuid}-{original_name}` (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890-data.csv`)

### Input Files
- **Videos:** `{timestamp}_{original_name}` (e.g., `1703123456789_video.mp4`)
- **Audio:** `{uuid}-{original_name}` (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890-audio.mp3`)

## Signed URL Generation

### Implementation
The application uses `lib/storage/signed-urls.ts` for generating signed URLs:

```typescript
// Generate single signed URL
const signedUrl = await generateSignedUrl(storagePath, 3600); // 1 hour expiration

// Generate multiple signed URLs
const signedUrls = await generateSignedUrls(storagePaths, 3600);

// Check if URL is a storage path
const isStorage = isStoragePath(url); // Returns true if starts with 'renders/'

// Convert storage paths to signed URLs
const signedUrls = await convertToSignedUrls(urls);
```

### URL Patterns
- **Storage Paths:** Start with `renders/` (e.g., `renders/illustrations/user123/generated/image.jpg`)
- **Signed URLs:** Generated with 1-hour expiration by default
- **Fallback:** If signing fails, returns original URL

## Database Storage Field Mapping

### Single File Storage
Tables with `storage_path` (TEXT) field:
- `comics`
- `voices_creations`
- `voiceovers`
- `music_jingles`
- `sound_fx`
- `explainers`
- `ugc_ads`
- `product_motions`
- `talking_avatars`
- `subtitles`
- `watermarks`
- `video_translations`

### Multiple File Storage
Tables with `storage_paths` (ARRAY) field:
- `illustrations`
- `avatars_personas`
- `product_mockups`
- `concept_worlds`
- `charts_infographics`

## Current Storage Status

### Existing Content
- **Total Folders:** 17 content type folders
- **Existing Videos:** 17 explainer videos in `renders/explainers/bd90c288-0b19-40c9-8eb0-6b13842bd736/`
- **Folder Structure:** All required folders exist with `.keep` files

### Storage Statistics
```
Content Type          | Files | Status
---------------------|-------|--------
explainers           | 17    | ✅ Active (existing videos)
avatars              | 1     | ✅ Ready (.keep file)
charts               | 1     | ✅ Ready (.keep file)
comics               | 1     | ✅ Ready (.keep file)
concept-worlds       | 1     | ✅ Ready (.keep file)
illustrations        | 1     | ✅ Ready (.keep file)
music-jingles        | 1     | ✅ Ready (.keep file)
product-mockups      | 1     | ✅ Ready (.keep file)
diverse-motion       | 1     | ✅ Ready (.keep file)
sound-fx             | 1     | ✅ Ready (.keep file)
subtitles            | 1     | ✅ Ready (.keep file)
talking-avatars      | 1     | ✅ Ready (.keep file)
translations         | 1     | ✅ Ready (.keep file)
ugc-ads              | 1     | ✅ Ready (.keep file)
voice-creation       | 1     | ✅ Ready (.keep file)
voiceovers           | 1     | ✅ Ready (.keep file)
watermarks           | 1     | ✅ Ready (.keep file)
```

## RLS Policies

### Storage Access
- **Bucket Access:** Users can only access files in their own user folders
- **Path Structure:** `renders/{content_type}/{user_id}/...`
- **Security:** RLS policies ensure users cannot access other users' content

### File Operations
- **Upload:** Users can upload to their own folders
- **Download:** Users can download from their own folders via signed URLs
- **Delete:** Users can delete their own files

## Integration with Library System

### Library Items Table
The `library_items` table references content by:
- `content_type`: Maps to table name (e.g., 'illustrations', 'explainers')
- `content_id`: References the primary key of the content table
- `date_added_to_library`: Timestamp when added to library

### Content Retrieval Flow
1. **Library API** queries `library_items` table
2. **Joins** with content tables (illustrations, explainers, etc.)
3. **Extracts** storage paths from `storage_path` or `storage_paths` fields
4. **Generates** signed URLs using `lib/storage/signed-urls.ts`
5. **Returns** content with accessible URLs

## Best Practices

### File Organization
- ✅ Use consistent folder structure: `renders/{content_type}/{user_id}/`
- ✅ Separate input files from generated content
- ✅ Use UUIDs for generated file names to avoid conflicts
- ✅ Include timestamps for reference files

### Security
- ✅ All paths include user_id for RLS enforcement
- ✅ Signed URLs have appropriate expiration times
- ✅ No direct file access without authentication

### Performance
- ✅ Use array fields for multiple files (storage_paths)
- ✅ Use single text fields for single files (storage_path)
- ✅ Generate signed URLs on-demand, not pre-generate

## Maintenance

### Cleanup
- Remove orphaned files when content is deleted
- Clean up temporary upload files
- Monitor storage usage per user

### Monitoring
- Track storage usage by content type
- Monitor signed URL generation performance
- Alert on storage quota limits

---

**Last Updated:** January 15, 2025  
**Version:** 1.0  
**Status:** ✅ Complete and Verified

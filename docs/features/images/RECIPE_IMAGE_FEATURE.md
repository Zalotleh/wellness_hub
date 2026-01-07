# Recipe Image Feature Implementation Plan

## Overview
Add image upload capability to recipes (manual & AI-generated) with support for both URL input and device file upload.

## Requirements

### Manual Recipe Creator
- ✅ Add image during creation (Step 1 - Recipe Setup)
- ✅ Add/update image when editing recipe
- ✅ Two input methods: URL or File Upload

### AI Recipe Generator
- ✅ Add image after recipe generation (on recipe detail page)
- ✅ Update image anytime on recipe detail page
- ✅ Two input methods: URL or File Upload

## Database Schema
```prisma
// Already exists in schema.prisma ✅
model Recipe {
  imageUrl String? // Optional image URL
}
```

## Implementation Phases

### Phase 1: URL Input (Quick Win - 2-3 hours)
**Goal:** Allow users to paste image URLs

**Files to modify:**
1. `/components/recipes/RecipeForm.tsx`
   - Add imageUrl input field in Step 1 (Recipe Setup)
   - Add image preview component
   - Validate URL format

2. `/app/recipes/[id]/page.tsx`
   - Add "Add/Update Image" button for recipe owner
   - Show current image if exists

3. `/components/recipes/ImageUploader.tsx` (NEW)
   - Reusable component for both URL and file upload
   - Image preview
   - Remove image button

**Features:**
- Text input for image URL
- Live preview of pasted URL
- Validation (must be valid image URL)
- Remove image option
- Works immediately (no storage setup needed)

---

### Phase 2: File Upload (Premium Feature - 4-6 hours)
**Goal:** Allow direct file uploads from device

**Cloud Storage Options:**
1. **Vercel Blob** (Recommended for Vercel deployment)
   - Easy integration
   - Built-in CDN
   - Pay as you go ($0.15/GB storage, $0.30/GB bandwidth)
   
2. **Cloudinary** (Free tier: 25GB storage, 25GB bandwidth)
   - Image optimization
   - Auto-resize/crop
   - Free tier generous

3. **AWS S3** (Most scalable)
   - $0.023/GB storage
   - Complex setup

**Recommendation: Start with Cloudinary (free tier)**

**Files to create/modify:**
1. `/lib/image-upload.ts` (NEW)
   - Upload to Cloudinary
   - Compress/optimize images
   - Generate secure URLs

2. `/app/api/upload/image/route.ts` (NEW)
   - Handle file upload
   - Validate file size (<5MB)
   - Validate file type (jpg, png, webp)
   - Return image URL

3. `/components/recipes/ImageUploader.tsx` (ENHANCE)
   - Add file dropzone
   - Progress bar during upload
   - Client-side image compression
   - Preview before upload

**Features:**
- Drag & drop or click to upload
- File size limit: 5MB
- Accepted formats: JPG, PNG, WEBP
- Auto-compress large images
- Upload progress indicator
- Preview before saving

---

### Phase 3: Image Management on Recipe Detail Page (2-3 hours)
**Goal:** Add/update images from recipe view

**Files to modify:**
1. `/app/recipes/[id]/page.tsx`
   - Add "Add Image" button (if no image)
   - Add "Update Image" button (if image exists)
   - Show ImageUploader modal on click

2. `/components/recipes/ImageModal.tsx` (NEW)
   - Modal popup with ImageUploader
   - Save/Cancel buttons
   - Update recipe via API

3. `/app/api/recipes/[id]/route.ts` (ENHANCE)
   - Accept imageUrl in PUT request
   - Validate ownership before update

---

## User Flow

### Manual Recipe Creation
```
Step 1: Recipe Setup
├── Title, Description, Times, etc.
├── Defense Systems & Key Foods (left column)
├── Ingredients (right column)
└── 📸 Recipe Image (below ingredients)
    ├── Tab 1: Paste URL
    │   ├── Input: Image URL
    │   └── Preview: Live preview
    └── Tab 2: Upload File (Phase 2)
        ├── Drop zone
        ├── Upload progress
        └── Preview

Step 2: Instructions
Step 3: Review (shows image in preview)
Submit → Recipe created with image
```

### AI Recipe Generation
```
1. Generate recipe → Recipe created (no image yet)
2. View recipe page
3. Click "Add Recipe Image" button
4. Modal opens with ImageUploader
   ├── Tab 1: Paste URL
   └── Tab 2: Upload File
5. Save → Image added to recipe
```

### Update Image (Any Recipe)
```
1. Open recipe detail page
2. If owner: See "Update Image" button on image
3. Click → Modal opens
4. Change URL or upload new file
5. Save → Image updated
```

---

## Component Structure

### ImageUploader Component
```tsx
<ImageUploader
  currentImageUrl={recipe.imageUrl}
  onSave={(url: string) => handleImageSave(url)}
  onRemove={() => handleImageRemove()}
  allowUpload={true} // false for Phase 1
/>

Features:
- Tabs: URL Input | File Upload
- Preview: Show current or new image
- Buttons: Save, Remove, Cancel
- Validation: URL format, file size, file type
- Loading states: Uploading...
```

---

## API Endpoints

### Upload Image (Phase 2)
```typescript
POST /api/upload/image
Body: FormData with file
Response: { imageUrl: string }

Validation:
- File size < 5MB
- File type: image/jpeg, image/png, image/webp
- Compress if > 1MB
- Upload to Cloudinary
- Return secure URL
```

### Update Recipe Image
```typescript
PUT /api/recipes/[id]
Body: { imageUrl: string }
Response: { data: Recipe }

Validation:
- User owns recipe
- Valid image URL
- Update recipe.imageUrl
```

---

## UI/UX Details

### In RecipeForm (Step 1)
```
┌─────────────────────────────────────┐
│ Recipe Setup                        │
├─────────────────────────────────────┤
│ Left Column:                        │
│ • Title, Description                │
│ • Times, Servings                   │
│ • Defense Systems                   │
│ • Key Foods                         │
├─────────────────────────────────────┤
│ Right Column:                       │
│ • Ingredients List                  │
│                                     │
│ 📸 Recipe Image (Optional)          │
│ ┌─────────────────────────────┐   │
│ │ [URL] [Upload]              │   │
│ ├─────────────────────────────┤   │
│ │ Paste image URL:            │   │
│ │ [https://example.com/...]   │   │
│ │                             │   │
│ │ [Preview appears here]      │   │
│ │                             │   │
│ │ [Remove Image]              │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### On Recipe Detail Page
```
┌─────────────────────────────────────┐
│ Recipe Title                        │
├─────────────────────────────────────┤
│ ┌───────────────────┐               │
│ │                   │               │
│ │  Recipe Image     │  [+ Add Image]│
│ │                   │  [✏️ Update]   │
│ │                   │               │
│ └───────────────────┘               │
├─────────────────────────────────────┤
│ Description...                      │
└─────────────────────────────────────┘
```

---

## Validation & Error Handling

### URL Input
- ✅ Valid URL format
- ✅ Ends with image extension (.jpg, .png, .webp, .gif)
- ❌ Error: "Please enter a valid image URL"
- ⚠️ Warning: External URLs may break over time

### File Upload (Phase 2)
- ✅ File size < 5MB
- ✅ File type: image/*
- ✅ Compress if > 1MB
- ❌ Error: "File too large (max 5MB)"
- ❌ Error: "Invalid file type"
- ⚠️ Show upload progress

---

## Cost Estimation

### Phase 1 (URL Input)
- **Development:** 2-3 hours
- **Cost:** $0 (uses external URLs)
- **Risk:** External URLs can break

### Phase 2 (File Upload - Cloudinary Free Tier)
- **Development:** 4-6 hours
- **Storage:** 25GB free/month
- **Bandwidth:** 25GB free/month
- **Est. Usage:** 
  - Average image: 200KB (compressed)
  - 1000 users × 5 recipes = 5000 images
  - Storage: 5000 × 200KB = 1GB (well under free tier)
  - Bandwidth: ~5GB/month (under free tier)
- **Cost:** $0 for MVP, then ~$10-20/month if scale beyond free tier

---

## Security Considerations

1. **URL Validation:**
   - Validate URL format
   - Check for HTTPS
   - Prevent XSS attacks

2. **File Upload:**
   - Validate file size
   - Validate MIME type
   - Scan for malware (Cloudinary auto-scans)
   - Rate limit uploads (prevent abuse)

3. **Ownership:**
   - Only recipe owner can add/update image
   - Validate user session before upload

---

## Testing Checklist

### Manual Recipe Creator
- [ ] Add image via URL during creation
- [ ] Add image via upload during creation (Phase 2)
- [ ] Preview shows correctly
- [ ] Image saves with recipe
- [ ] Edit recipe and update image
- [ ] Remove image works
- [ ] Validation errors show correctly

### AI Recipe Generator
- [ ] Recipe creates without image
- [ ] "Add Image" button shows for owner
- [ ] Click opens modal
- [ ] Add via URL works
- [ ] Add via upload works (Phase 2)
- [ ] Image saves to recipe
- [ ] Update image works
- [ ] Remove image works

### Edge Cases
- [ ] Invalid URL shows error
- [ ] File too large rejected (Phase 2)
- [ ] Wrong file type rejected (Phase 2)
- [ ] Non-owner cannot add image
- [ ] Image displays on mobile
- [ ] Image displays in dark mode

---

## Rollout Plan

### Week 1: Phase 1 (URL Input)
**Day 1-2:**
- Create ImageUploader component (URL tab only)
- Add to RecipeForm Step 1
- Test & commit

**Day 3:**
- Add to recipe detail page
- Add modal for AI recipes
- Test & commit

### Week 2: Phase 2 (File Upload) - Optional
**Day 1:**
- Set up Cloudinary account
- Create upload API endpoint
- Test upload flow

**Day 2:**
- Add file upload tab to ImageUploader
- Add progress indicator
- Test compression

**Day 3:**
- Integration testing
- Security review
- Deploy

---

## Future Enhancements (Post-MVP)

1. **AI Image Generation (Phase 3)**
   - Use DALL-E to auto-generate recipe images
   - Premium feature: 10 images/month
   - Cost: ~$0.02-0.04 per image

2. **Image Optimization**
   - Auto-crop to standard ratio (16:9 or 1:1)
   - Multiple sizes (thumbnail, medium, large)
   - Lazy loading

3. **Image Gallery**
   - Users upload multiple images per recipe
   - Carousel/slideshow view
   - Community can vote on best image

4. **Smart Defaults**
   - Suggest images from Unsplash API (free)
   - Placeholder images based on ingredients
   - Defense system themed defaults

---

## Implementation Priority

✅ **HIGH PRIORITY (Do First):**
- Phase 1: URL Input for manual recipes
- Add image modal on recipe detail page

⏳ **MEDIUM PRIORITY (Do Soon):**
- Phase 2: File upload with Cloudinary
- Image compression
- Mobile optimization

🔮 **LOW PRIORITY (Future):**
- AI image generation
- Multiple images per recipe
- Advanced image editing

---

## Success Metrics

After implementation, track:
- % of recipes with images
- URL vs Upload usage ratio
- Average file size
- Upload success rate
- Storage/bandwidth costs
- User feedback on feature

**Target:** 50%+ of new recipes should have images within 1 month

---

## Ready to Implement!

Start with **Phase 1 (URL Input)** - it's quick, free, and provides immediate value.
Then add **Phase 2 (File Upload)** when ready to invest in cloud storage.

Let me know when you want to start implementation! 🚀

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 413 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type must be JPG, PNG, WEBP, or GIF' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'recipes');
    const thumbsDir = path.join(uploadsDir, 'thumbs');
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    if (!existsSync(thumbsDir)) {
      await mkdir(thumbsDir, { recursive: true });
    }

    // Generate unique filename (without extension, we'll add .webp)
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const baseFilename = `recipe-${timestamp}-${randomString}`;

    // Process image with Sharp
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Create optimized WebP version (main image)
    const optimizedFilename = `${baseFilename}.webp`;
    const optimizedPath = path.join(uploadsDir, optimizedFilename);
    
    await image
      .resize(1920, 1080, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .webp({ quality: 85 })
      .toFile(optimizedPath);

    // Create thumbnail (400x400)
    const thumbnailFilename = `${baseFilename}.webp`;
    const thumbnailPath = path.join(thumbsDir, thumbnailFilename);
    
    await sharp(buffer)
      .resize(400, 400, { 
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toFile(thumbnailPath);

    // Get file sizes for response
    const fs = await import('fs/promises');
    const optimizedStats = await fs.stat(optimizedPath);
    const thumbnailStats = await fs.stat(thumbnailPath);

    // Return public URLs
    const imageUrl = `/uploads/recipes/${optimizedFilename}`;
    const thumbnailUrl = `/uploads/recipes/thumbs/${thumbnailFilename}`;

    return NextResponse.json({
      imageUrl,
      thumbnailUrl,
      filename: optimizedFilename,
      originalSize: file.size,
      optimizedSize: optimizedStats.size,
      thumbnailSize: thumbnailStats.size,
      compressionRatio: Math.round((1 - optimizedStats.size / file.size) * 100),
      format: 'webp',
      dimensions: {
        width: metadata.width,
        height: metadata.height,
      },
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}

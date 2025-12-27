'use client';

import { useState, useCallback } from 'react';
import { Image as ImageIcon, Upload, X, Link as LinkIcon, Loader2, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  currentImageUrl?: string;
  onSave: (imageUrl: string) => void;
  onRemove?: () => void;
  allowUpload?: boolean;
}

export default function ImageUploader({
  currentImageUrl,
  onSave,
  onRemove,
  allowUpload = true,
}: ImageUploaderProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [urlInput, setUrlInput] = useState(currentImageUrl || '');
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Validate URL format
  const validateImageUrl = (url: string): boolean => {
    if (!url) return false;
    
    try {
      new URL(url);
      // Check if URL ends with common image extensions
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
      const lowerUrl = url.toLowerCase();
      return imageExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('image');
    } catch {
      return false;
    }
  };

  // Handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setUrlInput(url);
    setError('');

    if (url && validateImageUrl(url)) {
      setPreviewUrl(url);
    } else if (url) {
      setError('Please enter a valid image URL');
    } else {
      setPreviewUrl('');
    }
  };

  // Handle URL save
  const handleUrlSave = () => {
    if (!urlInput.trim()) {
      setError('Please enter an image URL');
      return;
    }

    if (!validateImageUrl(urlInput)) {
      setError('Please enter a valid image URL (must end with .jpg, .png, .webp, etc.)');
      return;
    }

    onSave(urlInput);
  };

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    setError('');

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('File type must be JPG, PNG, WEBP, or GIF');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      onSave(data.imageUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      setPreviewUrl('');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle remove image
  const handleRemove = () => {
    setPreviewUrl('');
    setUrlInput('');
    setError('');
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'url'
              ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <LinkIcon className="w-4 h-4" />
            <span>Image URL</span>
          </div>
        </button>
        {allowUpload && (
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'upload'
                ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
            </div>
          </button>
        )}
      </div>

      {/* URL Tab Content */}
      {activeTab === 'url' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Paste Image URL
            </label>
            <input
              type="url"
              value={urlInput}
              onChange={handleUrlChange}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-green-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              URL must end with .jpg, .png, .webp, or .gif
            </p>
          </div>
          {!previewUrl && (
            <button
              type="button"
              onClick={handleUrlSave}
              disabled={!urlInput.trim() || !validateImageUrl(urlInput)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Load Preview
            </button>
          )}
        </div>
      )}

      {/* Upload Tab Content */}
      {activeTab === 'upload' && allowUpload && (
        <div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
            }`}
          >
            <input
              type="file"
              id="image-upload"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isUploading}
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              {isUploading ? (
                <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-3" />
              ) : (
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                JPG, PNG, WEBP, or GIF (max 5MB)
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Image Preview */}
      {previewUrl && (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img
              src={previewUrl}
              alt="Recipe preview"
              className="w-full h-64 object-cover"
              onError={() => {
                setError('Failed to load image. Please check the URL.');
                setPreviewUrl('');
              }}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4" />
              <span>Image ready</span>
            </div>
            {activeTab === 'url' && !isUploading && (
              <button
                type="button"
                onClick={handleUrlSave}
                className="text-green-600 dark:text-green-400 hover:underline font-medium"
              >
                Update URL
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

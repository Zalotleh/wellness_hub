'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Share2, Copy, Mail, MessageCircle, Download, ExternalLink, 
  Check, Loader2, QrCode, X, Facebook, Twitter, Linkedin
} from 'lucide-react';

interface ShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  mealPlanId?: string;
  mealPlanTitle: string;
  onShare: (method: 'link' | 'whatsapp' | 'email' | 'facebook' | 'twitter' | 'linkedin') => void;
  onExportPDF: () => void;
  className?: string;
}

export default function ShareMenu({
  isOpen,
  onClose,
  mealPlanId,
  mealPlanTitle,
  onShare,
  onExportPDF,
  className = '',
}: ShareMenuProps) {
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const shareUrl = mealPlanId ? `${window.location.origin}/meal-plans/${mealPlanId}` : '';

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Handle ESC key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Reset states when menu opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCopiedToClipboard(false);
      setShowQR(false);
    }
  }, [isOpen]);

  const handleCopyLink = async () => {
    if (!shareUrl) {
      alert('Please save the meal plan first.');
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };

  const handlePDFExport = async () => {
    setIsExportingPDF(true);
    try {
      await onExportPDF();
    } finally {
      setIsExportingPDF(false);
    }
  };

  const shareOptions = [
    {
      id: 'link',
      label: 'Copy Link',
      icon: Copy,
      description: 'Copy shareable link to clipboard',
      action: handleCopyLink,
      color: 'text-gray-700',
      bgColor: 'hover:bg-gray-50',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      description: 'Share via WhatsApp',
      action: () => onShare('whatsapp'),
      color: 'text-green-600',
      bgColor: 'hover:bg-green-50',
    },
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      description: 'Share via email',
      action: () => onShare('email'),
      color: 'text-blue-600',
      bgColor: 'hover:bg-blue-50',
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: Facebook,
      description: 'Share on Facebook',
      action: () => onShare('facebook'),
      color: 'text-blue-700',
      bgColor: 'hover:bg-blue-50',
    },
    {
      id: 'twitter',
      label: 'Twitter',
      icon: Twitter,
      description: 'Share on Twitter',
      action: () => onShare('twitter'),
      color: 'text-sky-500',
      bgColor: 'hover:bg-sky-50',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      icon: Linkedin,
      description: 'Share on LinkedIn',
      action: () => onShare('linkedin'),
      color: 'text-blue-600',
      bgColor: 'hover:bg-blue-50',
    },
  ];

  if (!isOpen) return null;

  const canShare = Boolean(mealPlanId);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-25 z-40 sm:hidden" onClick={onClose} />
      
      {/* Menu */}
      <div 
        ref={menuRef}
        className={`
          absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50
          transform transition-all duration-200 origin-top-right
          ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}
          ${className}
        `}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Share Meal Plan</h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close share menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1 truncate" title={mealPlanTitle}>
            {mealPlanTitle}
          </p>
        </div>

        {/* Content */}
        <div className="p-4">
          {!canShare ? (
            <div className="text-center py-4">
              <div className="text-gray-400 mb-2">
                <Share2 className="w-8 h-8 mx-auto" />
              </div>
              <p className="text-sm text-gray-600">
                Please save the meal plan first to enable sharing.
              </p>
            </div>
          ) : (
            <>
              {/* Share Options */}
              <div className="space-y-1 mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Share with others</h4>
                {shareOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={option.action}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                        ${option.bgColor} ${option.color}
                      `}
                      disabled={option.id === 'link' && copiedToClipboard}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">
                          {option.id === 'link' && copiedToClipboard ? 'Copied!' : option.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {option.description}
                        </div>
                      </div>
                      {option.id === 'link' && copiedToClipboard && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Share URL Display */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shareable Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedToClipboard ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Export Section */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Export & Download</h4>
                <button
                  onClick={handlePDFExport}
                  disabled={isExportingPDF}
                  className="w-full flex items-center gap-3 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExportingPDF ? (
                    <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                  ) : (
                    <Download className="w-5 h-5 flex-shrink-0" />
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium">
                      {isExportingPDF ? 'Generating PDF...' : 'Export as PDF'}
                    </div>
                    <div className="text-xs text-red-600">
                      Download printable meal plan
                    </div>
                  </div>
                </button>
              </div>

              {/* QR Code Section (Optional) */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <QrCode className="w-5 h-5" />
                  <span className="font-medium">
                    {showQR ? 'Hide QR Code' : 'Show QR Code'}
                  </span>
                </button>
                
                {showQR && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg text-center">
                    <div className="w-32 h-32 bg-white border border-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-600">
                      QR code for quick sharing
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      (Scan with phone camera)
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ExternalLink className="w-3 h-3" />
            <span>Shared meal plans are publicly accessible</span>
          </div>
        </div>
      </div>
    </>
  );
}
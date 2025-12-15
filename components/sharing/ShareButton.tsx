// components/sharing/ShareButton.tsx
'use client';

import { useState } from 'react';
import {
  Share2,
  Mail,
  MessageCircle,
  Calendar,
  Download,
  Copy,
  QrCode,
  Facebook,
  Twitter,
  Linkedin,
  X,
  Check,
  ShoppingCart,
  FileText,
  StickyNote,
} from 'lucide-react';
import {
  generateWhatsAppUrl,
  generateEmailUrl,
  generateSocialUrls,
  generateCalendarEvent,
  generateQRCode,
  generateShareableLink,
  copyToClipboard,
  downloadAsFile,
  nativeShare,
  formatMealPlanText,
  formatShoppingListText,
  generateAppleNotesExport,
  generateGoogleKeepUrl,
  generateInstacartLink,
  generateAmazonFreshLink,
  ShareOptions,
} from '@/lib/utils/sharing';
import { Feature } from '@/lib/features/feature-flags';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

interface ShareButtonProps {
  // Content to share
  title: string;
  description?: string;
  url?: string;
  
  // Type of content
  type?: 'meal-plan' | 'shopping-list' | 'recipe';
  
  // Full data for advanced sharing
  mealPlan?: any;
  shoppingList?: any;
  
  // Customization
  variant?: 'icon' | 'button' | 'dropdown';
  className?: string;
  
  // Callbacks
  onShare?: (platform: string) => void;
}

/**
 * Comprehensive sharing component with multiple share options
 * 
 * @example
 * ```tsx
 * <ShareButton
 *   title="My Weekly Meal Plan"
 *   description="Check out my healthy meal plan!"
 *   url="https://app.com/meal-plans/123"
 *   type="meal-plan"
 *   mealPlan={mealPlanData}
 * />
 * ```
 */
export function ShareButton({
  title,
  description,
  url,
  type = 'meal-plan',
  mealPlan,
  shoppingList,
  variant = 'button',
  className = '',
  onShare,
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  
  const { hasFeature } = useFeatureAccess();

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  
  const shareOptions: ShareOptions = {
    title,
    text: description,
    url: shareUrl,
  };

  // Handle native share (mobile)
  const handleNativeShare = async () => {
    const success = await nativeShare(shareOptions);
    if (success) {
      onShare?.('native');
      setIsOpen(false);
    }
  };

  // Handle copy link
  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      onShare?.('copy');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle WhatsApp
  const handleWhatsApp = () => {
    const whatsappUrl = generateWhatsAppUrl(shareOptions);
    window.open(whatsappUrl, '_blank');
    onShare?.('whatsapp');
    setIsOpen(false);
  };

  // Handle Email
  const handleEmail = () => {
    const emailUrl = generateEmailUrl(shareOptions);
    window.location.href = emailUrl;
    onShare?.('email');
    setIsOpen(false);
  };

  // Handle Calendar
  const handleCalendar = (platform: 'google' | 'ical' | 'outlook') => {
    if (!mealPlan) return;
    
    const calendarUrls = generateCalendarEvent({
      title: mealPlan.title,
      weekStart: mealPlan.weekStart,
      weekEnd: mealPlan.weekEnd,
      description: mealPlan.description,
    });

    if (platform === 'ical') {
      // Download iCal file
      window.location.href = calendarUrls.ical;
    } else if (platform === 'google') {
      window.open(calendarUrls.google, '_blank');
    } else if (platform === 'outlook') {
      window.open(calendarUrls.outlook, '_blank');
    }
    
    onShare?.(`calendar-${platform}`);
    setIsOpen(false);
  };

  // Handle Social Media
  const handleSocial = (platform: keyof ReturnType<typeof generateSocialUrls>) => {
    const socialUrls = generateSocialUrls(shareOptions);
    window.open(socialUrls[platform], '_blank', 'width=600,height=400');
    onShare?.(platform);
    setIsOpen(false);
  };

  // Handle QR Code
  const handleQRCode = async () => {
    if (!hasFeature(Feature.QR_CODES)) {
      alert('QR Codes are a premium feature. Upgrade to unlock!');
      return;
    }
    
    const qrUrl = await generateQRCode(shareUrl);
    setQrCodeUrl(qrUrl);
    onShare?.('qr-code');
  };

  // Handle Text Export
  const handleTextExport = () => {
    let content = '';
    let filename = '';
    
    if (type === 'meal-plan' && mealPlan) {
      content = formatMealPlanText(mealPlan);
      filename = `${mealPlan.title.replace(/\s+/g, '-')}.txt`;
    } else if (type === 'shopping-list' && shoppingList) {
      content = formatShoppingListText(shoppingList);
      filename = `${shoppingList.title.replace(/\s+/g, '-')}.txt`;
    }
    
    if (content) {
      downloadAsFile(content, filename);
      onShare?.('text-export');
      setIsOpen(false);
    }
  };

  // Handle Notes Export
  const handleNotesExport = (platform: 'apple' | 'google') => {
    let content = '';
    
    if (type === 'meal-plan' && mealPlan) {
      content = formatMealPlanText(mealPlan);
    } else if (type === 'shopping-list' && shoppingList) {
      content = formatShoppingListText(shoppingList);
    }

    if (platform === 'apple') {
      const url = generateAppleNotesExport({ title, content });
      window.location.href = url;
    } else {
      const url = generateGoogleKeepUrl({ title, content });
      window.open(url, '_blank');
    }
    
    onShare?.(`notes-${platform}`);
    setIsOpen(false);
  };

  // Handle Grocery Service
  const handleGroceryService = (service: 'instacart' | 'amazon') => {
    if (!shoppingList) return;
    
    const items = shoppingList.items.map((item: any) => item.ingredient);
    const url = service === 'instacart' 
      ? generateInstacartLink(items)
      : generateAmazonFreshLink(items);
    
    window.open(url, '_blank');
    onShare?.(service);
    setIsOpen(false);
  };

  // Icon button variant
  if (variant === 'icon') {
    return (
      <button
        onClick={handleNativeShare}
        className={`p-2 hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors ${className}`}
        title="Share"
      >
        <Share2 className="w-5 h-5" />
      </button>
    );
  }

  // Regular button variant
  if (variant === 'button') {
    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${className}`}
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </button>
    );
  }

  // Dropdown variant (full menu)
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 transition-colors ${className}`}
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Share</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-2">
              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600 dark:text-gray-200" />
                )}
                <span className="text-sm">{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm">WhatsApp</span>
              </button>

              {/* Email */}
              <button
                onClick={handleEmail}
                className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
              >
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="text-sm">Email</span>
              </button>

              {/* Calendar */}
              {type === 'meal-plan' && mealPlan && (
                <>
                  <div className="my-2 border-t border-gray-200" />
                  <div className="px-3 py-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Add to Calendar</p>
                  </div>
                  
                  <button
                    onClick={() => handleCalendar('google')}
                    className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="text-sm">Google Calendar</span>
                  </button>

                  <button
                    onClick={() => handleCalendar('ical')}
                    className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-200" />
                    <span className="text-sm">Apple Calendar</span>
                  </button>

                  <button
                    onClick={() => handleCalendar('outlook')}
                    className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <span className="text-sm">Outlook</span>
                  </button>
                </>
              )}

              {/* Social Media */}
              {hasFeature(Feature.PUBLIC_SHARING) && (
                <>
                  <div className="my-2 border-t border-gray-200" />
                  <div className="px-3 py-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Social Media</p>
                  </div>

                  <button
                    onClick={() => handleSocial('facebook')}
                    className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Facebook className="w-5 h-5 text-blue-600" />
                    <span className="text-sm">Facebook</span>
                  </button>

                  <button
                    onClick={() => handleSocial('twitter')}
                    className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Twitter className="w-5 h-5 text-sky-500" />
                    <span className="text-sm">Twitter</span>
                  </button>

                  <button
                    onClick={() => handleSocial('linkedin')}
                    className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Linkedin className="w-5 h-5 text-blue-700" />
                    <span className="text-sm">LinkedIn</span>
                  </button>
                </>
              )}

              {/* Export Options */}
              <div className="my-2 border-t border-gray-200" />
              <div className="px-3 py-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Export</p>
              </div>

              <button
                onClick={handleTextExport}
                className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
              >
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-200" />
                <span className="text-sm">Download as Text</span>
              </button>

              {hasFeature(Feature.APPLE_NOTES_SYNC) && (
                <button
                  onClick={() => handleNotesExport('apple')}
                  className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
                >
                  <StickyNote className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm">Apple Notes</span>
                </button>
              )}

              {hasFeature(Feature.GOOGLE_KEEP_SYNC) && (
                <button
                  onClick={() => handleNotesExport('google')}
                  className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
                >
                  <StickyNote className="w-5 h-5 text-amber-500" />
                  <span className="text-sm">Google Keep</span>
                </button>
              )}

              {hasFeature(Feature.QR_CODES) && (
                <button
                  onClick={handleQRCode}
                  className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
                >
                  <QrCode className="w-5 h-5 text-gray-600 dark:text-gray-200" />
                  <span className="text-sm">Generate QR Code</span>
                </button>
              )}

              {/* Grocery Services */}
              {type === 'shopping-list' && shoppingList && hasFeature(Feature.GROCERY_INTEGRATION) && (
                <>
                  <div className="my-2 border-t border-gray-200" />
                  <div className="px-3 py-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Grocery Services</p>
                  </div>

                  <button
                    onClick={() => handleGroceryService('instacart')}
                    className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Open in Instacart</span>
                  </button>

                  <button
                    onClick={() => handleGroceryService('amazon')}
                    className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5 text-orange-600" />
                    <span className="text-sm">Open in Amazon Fresh</span>
                  </button>
                </>
              )}
            </div>

            {/* QR Code Display */}
            {qrCodeUrl && (
              <div className="p-4 border-t border-gray-200">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="w-full h-auto rounded"
                />
                <p className="text-xs text-gray-500 dark:text-gray-300 text-center mt-2">
                  Scan to view on mobile
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

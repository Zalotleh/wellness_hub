'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Share2,
  MessageCircle,
  Mail,
  Link,
  FileDown,
  Calendar,
  MoreHorizontal,
  Check,
  Copy,
  Download,
  CalendarDays,
  X,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { 
  generateWhatsAppUrl, 
  generateEmailUrl, 
  generateCalendarEvent,
  copyToClipboard,
} from '@/lib/utils/sharing';

interface ShareMenuProps {
  // Content to share
  title: string;
  description?: string;
  url?: string;
  
  // PDF export data
  pdfData?: {
    filename: string;
    content: any; // This would be your meal plan data
  };
  
  // Calendar event data
  calendarData?: {
    title: string;
    startDate: Date;
    endDate: Date;
    description?: string;
  };
  
  // Positioning
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  // Styling
  variant?: 'icon' | 'button';
  className?: string;
  
  // Callbacks
  onShare?: (platform: string) => void;
  onPDFExport?: (data: any) => Promise<void>;
  onCalendarExport?: (type: 'google' | 'ical' | 'outlook') => Promise<void>;
}

export default function ShareMenu({
  title,
  description,
  url,
  pdfData,
  calendarData,
  position = 'bottom-right',
  variant = 'icon',
  className = '',
  onShare,
  onPDFExport,
  onCalendarExport,
}: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<string>('');
  const menuRef = useRef<HTMLDivElement>(null);
  const { success, error } = useToast();

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // WhatsApp sharing
  const handleWhatsAppShare = async () => {
    try {
      const whatsappUrl = generateWhatsAppUrl({
        title,
        text: description,
        url: shareUrl,
      });
      
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      success('Shared to WhatsApp', 'Opening WhatsApp to share your content');
      onShare?.('whatsapp');
    } catch (err) {
      error('WhatsApp Share Failed', 'Unable to open WhatsApp. Please try again.');
    } finally {
      setIsOpen(false);
    }
  };

  // Email sharing
  const handleEmailShare = async () => {
    try {
      const emailUrl = generateEmailUrl({
        title,
        text: description,
        url: shareUrl,
      });
      
      window.location.href = emailUrl;
      success('Email Opened', 'Your email client has been opened with the shared content');
      onShare?.('email');
    } catch (err) {
      error('Email Share Failed', 'Unable to open email client. Please try again.');
    } finally {
      setIsOpen(false);
    }
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      const success_copy = await copyToClipboard(shareUrl);
      if (success_copy) {
        success('Link Copied', 'Share link has been copied to your clipboard');
        onShare?.('copy');
      } else {
        throw new Error('Copy failed');
      }
    } catch (err) {
      error('Copy Failed', 'Unable to copy link to clipboard. Please try again.');
    } finally {
      setIsOpen(false);
    }
  };

  // PDF export
  const handlePDFExport = async () => {
    if (!pdfData || !onPDFExport) return;

    setIsExporting(true);
    setExportType('pdf');

    try {
      await onPDFExport(pdfData.content);
      success('PDF Exported', `${pdfData.filename} has been downloaded successfully`);
      onShare?.('pdf');
    } catch (err) {
      error('PDF Export Failed', 'Unable to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
      setExportType('');
      setIsOpen(false);
    }
  };

  // Calendar export
  const handleCalendarExport = async (type: 'google' | 'ical' | 'outlook') => {
    if (!calendarData) return;

    setIsExporting(true);
    setExportType(`calendar-${type}`);

    try {
      if (onCalendarExport) {
        await onCalendarExport(type);
      } else {
        // Fallback to direct calendar URLs
        const calendarUrls = generateCalendarEvent({
          title: calendarData.title,
          weekStart: calendarData.startDate,
          weekEnd: calendarData.endDate,
          description: calendarData.description,
        });

        if (type === 'ical') {
          // Download iCal file
          const blob = new Blob([calendarUrls.ical], { type: 'text/calendar' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${calendarData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          // Open calendar service
          const calendarUrl = type === 'google' ? calendarUrls.google : calendarUrls.outlook;
          window.open(calendarUrl, '_blank', 'noopener,noreferrer');
        }
      }

      const platformNames = {
        google: 'Google Calendar',
        ical: 'Apple Calendar',
        outlook: 'Outlook Calendar',
      };

      success(
        'Calendar Event Created',
        `Event has been ${type === 'ical' ? 'downloaded for' : 'added to'} ${platformNames[type]}`
      );
      onShare?.(`calendar-${type}`);
    } catch (err) {
      error('Calendar Export Failed', 'Unable to create calendar event. Please try again.');
    } finally {
      setIsExporting(false);
      setExportType('');
      setIsOpen(false);
    }
  };

  // Position classes
  const positionClasses = {
    'bottom-right': 'top-full right-0 mt-2',
    'bottom-left': 'top-full left-0 mt-2',
    'top-right': 'bottom-full right-0 mb-2',
    'top-left': 'bottom-full left-0 mb-2',
  };

  const shareOptions = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-600 hover:bg-green-50',
      action: handleWhatsAppShare,
    },
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      color: 'text-blue-600 hover:bg-blue-50',
      action: handleEmailShare,
    },
    {
      id: 'copy',
      label: 'Copy Link',
      icon: Link,
      color: 'text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700',
      action: handleCopyLink,
    },
  ];

  if (pdfData && onPDFExport) {
    shareOptions.push({
      id: 'pdf',
      label: 'Export PDF',
      icon: FileDown,
      color: 'text-red-600 hover:bg-red-50',
      action: handlePDFExport,
    });
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-2 transition-all duration-200
          ${variant === 'icon'
            ? 'p-2 text-gray-600 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:bg-gray-700 rounded-lg'
            : 'px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium shadow-sm hover:shadow-md'
          }
        `}
        aria-label="Share options"
        aria-expanded={isOpen}
      >
        <Share2 className="w-5 h-5" />
        {variant === 'button' && <span>Share</span>}
      </button>

      {/* Share Menu */}
      {isOpen && (
        <div className={`
          absolute z-50 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2
          transform transition-all duration-200 origin-top-right
          ${positionClasses[position]}
        `}>
          {/* Share Options */}
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Share Options</p>
          </div>

          {shareOptions.map((option) => {
            const Icon = option.icon;
            const isLoading = isExporting && exportType === option.id;

            return (
              <button
                key={option.id}
                onClick={option.action}
                disabled={isExporting}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                  ${option.color}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{option.label}</span>
                {isLoading && (
                  <span className="text-xs text-gray-500 dark:text-gray-300 ml-auto">Exporting...</span>
                )}
              </button>
            );
          })}

          {/* Calendar Export Section */}
          {calendarData && (
            <>
              <div className="px-3 py-2 border-t border-gray-100 mt-2">
                <p className="text-sm font-semibold text-gray-900">Add to Calendar</p>
              </div>

              {[
                { type: 'google' as const, label: 'Google Calendar', color: 'text-blue-600 hover:bg-blue-50' },
                { type: 'ical' as const, label: 'Apple Calendar', color: 'text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700' },
                { type: 'outlook' as const, label: 'Outlook Calendar', color: 'text-orange-600 hover:bg-orange-50' },
              ].map((cal) => {
                const isLoading = isExporting && exportType === `calendar-${cal.type}`;

                return (
                  <button
                    key={cal.type}
                    onClick={() => handleCalendarExport(cal.type)}
                    disabled={isExporting}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                      ${cal.color}
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CalendarDays className="w-5 h-5" />
                    )}
                    <span className="text-sm font-medium">{cal.label}</span>
                    {isLoading && (
                      <span className="text-xs text-gray-500 dark:text-gray-300 ml-auto">Adding...</span>
                    )}
                  </button>
                );
              })}
            </>
          )}

          {/* Close Button */}
          <div className="border-t border-gray-100 mt-2 pt-2">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="text-sm">Close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
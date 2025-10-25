// lib/utils/sharing.ts

export interface ShareOptions {
  title: string;
  text?: string;
  url: string;
}

/**
 * Generate WhatsApp share URL
 */
export function generateWhatsAppUrl(options: ShareOptions): string {
  const message = `${options.title}\n\n${options.text || ''}\n\n${options.url}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Generate email mailto link
 */
export function generateEmailUrl(options: ShareOptions): string {
  const subject = encodeURIComponent(options.title);
  const body = encodeURIComponent(
    `${options.text || ''}\n\nView the meal plan: ${options.url}`
  );
  return `mailto:?subject=${subject}&body=${body}`;
}

/**
 * Generate social media share URLs
 */
export function generateSocialUrls(options: ShareOptions) {
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(options.url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(options.title)}&url=${encodeURIComponent(options.url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(options.url)}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(options.url)}&description=${encodeURIComponent(options.title)}`,
  };
}

/**
 * Generate calendar event for meal plan
 */
export function generateCalendarEvent(mealPlan: {
  title: string;
  weekStart: Date;
  weekEnd: Date;
  description?: string;
}) {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = formatDate(new Date(mealPlan.weekStart));
  const endDate = formatDate(new Date(mealPlan.weekEnd));
  
  const description = encodeURIComponent(
    mealPlan.description || 'Weekly meal plan from 5x5x5 Health'
  );
  const title = encodeURIComponent(mealPlan.title);

  // Google Calendar URL
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${description}`;

  // iCal format for Apple Calendar
  const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${mealPlan.title}
DESCRIPTION:${mealPlan.description || 'Weekly meal plan from 5x5x5 Health'}
END:VEVENT
END:VCALENDAR`;

  return {
    google: googleCalUrl,
    ical: `data:text/calendar;charset=utf-8,${encodeURIComponent(icalContent)}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startDate}&enddt=${endDate}&body=${description}`,
  };
}

/**
 * Generate QR code data URL
 */
export async function generateQRCode(url: string): Promise<string> {
  // Using QR Server API as a simple solution
  // For production, consider using a library like 'qrcode' for offline generation
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
}

/**
 * Generate shareable link for meal plan
 */
export function generateShareableLink(mealPlanId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/meal-plans/${mealPlanId}`;
}

/**
 * Generate social media image template data
 */
export function generateSocialImageData(mealPlan: {
  title: string;
  weekStart: Date;
  weekEnd: Date;
  dailyMenus: any[];
}) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  return {
    title: mealPlan.title,
    dateRange: `${formatDate(new Date(mealPlan.weekStart))} - ${formatDate(new Date(mealPlan.weekEnd))}`,
    mealCount: mealPlan.dailyMenus.reduce((sum, day) => sum + day.meals.length, 0),
    days: mealPlan.dailyMenus.length,
    // This data can be used to generate an image on the backend
  };
}

/**
 * Generate Instacart shopping link
 */
export function generateInstacartLink(items: string[]): string {
  // Instacart doesn't have a direct API for adding items, but you can deep link to search
  // In production, you'd integrate with Instacart's partner API
  const query = items.slice(0, 5).join(', '); // Limit to first 5 items
  return `https://www.instacart.com/store/search?query=${encodeURIComponent(query)}`;
}

/**
 * Generate Amazon Fresh link
 */
export function generateAmazonFreshLink(items: string[]): string {
  // Amazon Fresh search URL
  const query = items.slice(0, 5).join(' '); // Limit to first 5 items
  return `https://www.amazon.com/alm/storefront?almBrandId=QW1hem9uIEZyZXNo&query=${encodeURIComponent(query)}`;
}

/**
 * Export to Apple Notes (generates a mailto link with special formatting)
 */
export function generateAppleNotesExport(options: {
  title: string;
  content: string;
}): string {
  const subject = encodeURIComponent(options.title);
  const body = encodeURIComponent(options.content);
  
  // mailto: link that can be opened to create a note
  return `mailto:?subject=${subject}&body=${body}`;
}

/**
 * Generate Google Keep note URL
 */
export function generateGoogleKeepUrl(options: {
  title: string;
  content: string;
}): string {
  // Google Keep doesn't have direct URL scheme, but we can use the web interface
  return `https://keep.google.com/u/0/#NOTE/new?title=${encodeURIComponent(options.title)}&text=${encodeURIComponent(options.content)}`;
}

/**
 * Format meal plan for text export
 */
export function formatMealPlanText(mealPlan: any): string {
  let text = `${mealPlan.title}\n`;
  text += `Week of ${new Date(mealPlan.weekStart).toLocaleDateString()} - ${new Date(mealPlan.weekEnd).toLocaleDateString()}\n\n`;
  
  if (mealPlan.description) {
    text += `${mealPlan.description}\n\n`;
  }

  for (const day of mealPlan.dailyMenus || []) {
    const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' });
    text += `${dayName.toUpperCase()}\n`;
    text += `${'='.repeat(dayName.length)}\n`;
    
    for (const meal of day.meals || []) {
      text += `\n${meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}: ${meal.mealName}\n`;
      if (meal.prepTime) {
        text += `  ⏱ ${meal.prepTime}\n`;
      }
      if (meal.defenseSystems && meal.defenseSystems.length > 0) {
        text += `  🛡 Systems: ${meal.defenseSystems.join(', ')}\n`;
      }
    }
    text += '\n';
  }

  return text;
}

/**
 * Format shopping list for text export
 */
export function formatShoppingListText(shoppingList: any): string {
  let text = `${shoppingList.title}\n`;
  text += `${'='.repeat(shoppingList.title.length)}\n\n`;

  const items = shoppingList.items as any[];
  const categories = [...new Set(items.map((item: any) => item.category))];

  for (const category of categories) {
    const categoryItems = items.filter((item: any) => item.category === category);
    if (categoryItems.length === 0) continue;

    text += `${category.toUpperCase()}\n`;
    text += `${'-'.repeat(category.length)}\n`;
    
    for (const item of categoryItems) {
      text += `☐ ${item.ingredient} - ${item.quantity} ${item.unit}`;
      if (item.estimatedCost) {
        text += ` ($${item.estimatedCost.toFixed(2)})`;
      }
      text += '\n';
    }
    text += '\n';
  }

  if (shoppingList.totalCost) {
    text += `\nEstimated Total: $${shoppingList.totalCost.toFixed(2)}\n`;
  }

  return text;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-HTTPS
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        textArea.remove();
        return true;
      } catch (error) {
        textArea.remove();
        return false;
      }
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Download text as a file
 */
export function downloadAsFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Native share API (mobile-friendly)
 */
export async function nativeShare(options: ShareOptions): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title: options.title,
      text: options.text,
      url: options.url,
    });
    return true;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Error sharing:', error);
    }
    return false;
  }
}

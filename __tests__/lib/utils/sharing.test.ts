// __tests__/lib/utils/sharing.test.ts

import {
  generateWhatsAppUrl,
  generateEmailUrl,
  generateSocialUrls,
  generateCalendarEvent,
  generateShareableLink,
  formatMealPlanText,
  formatShoppingListText,
  generateInstacartLink,
  generateAmazonFreshLink,
  copyToClipboard,
  ShareOptions,
} from '@/lib/utils/sharing';

describe('Sharing Utilities', () => {
  describe('generateWhatsAppUrl', () => {
    it('should generate correct WhatsApp URL', () => {
      const options: ShareOptions = {
        title: 'My Meal Plan',
        text: 'Check out this healthy plan!',
        url: 'https://example.com/plan/123',
      };

      const url = generateWhatsAppUrl(options);
      
      expect(url).toContain('https://wa.me/');
      expect(url).toContain(encodeURIComponent('My Meal Plan'));
      expect(url).toContain(encodeURIComponent(options.url));
    });

    it('should handle missing text', () => {
      const options: ShareOptions = {
        title: 'My Meal Plan',
        url: 'https://example.com/plan/123',
      };

      const url = generateWhatsAppUrl(options);
      expect(url).toBeTruthy();
      expect(url).toContain(encodeURIComponent('My Meal Plan'));
    });
  });

  describe('generateEmailUrl', () => {
    it('should generate correct mailto link', () => {
      const options: ShareOptions = {
        title: 'Weekly Meal Plan',
        text: 'Healthy eating made easy',
        url: 'https://example.com/plan/456',
      };

      const url = generateEmailUrl(options);
      
      expect(url).toStartWith('mailto:?');
      expect(url).toContain('subject=');
      expect(url).toContain('body=');
      expect(url).toContain(encodeURIComponent('Weekly Meal Plan'));
    });
  });

  describe('generateSocialUrls', () => {
    it('should generate all social media URLs', () => {
      const options: ShareOptions = {
        title: 'My Recipe',
        url: 'https://example.com/recipe/789',
      };

      const urls = generateSocialUrls(options);
      
      expect(urls.facebook).toContain('facebook.com');
      expect(urls.twitter).toContain('twitter.com');
      expect(urls.linkedin).toContain('linkedin.com');
      expect(urls.pinterest).toContain('pinterest.com');
      
      // Check URL encoding
      expect(urls.facebook).toContain(encodeURIComponent(options.url));
      expect(urls.twitter).toContain(encodeURIComponent(options.title));
    });
  });

  describe('generateCalendarEvent', () => {
    it('should generate calendar URLs for all platforms', () => {
      const mealPlan = {
        title: 'Healthy Week',
        weekStart: new Date('2025-10-27'),
        weekEnd: new Date('2025-11-02'),
        description: 'My weekly meal plan',
      };

      const calendar = generateCalendarEvent(mealPlan);
      
      expect(calendar.google).toContain('calendar.google.com');
      expect(calendar.google).toContain('action=TEMPLATE');
      expect(calendar.ical).toStartWith('data:text/calendar');
      expect(calendar.ical).toContain('BEGIN:VCALENDAR');
      expect(calendar.outlook).toContain('outlook.live.com');
    });

    it('should format dates correctly', () => {
      const mealPlan = {
        title: 'Test Plan',
        weekStart: new Date('2025-01-01T00:00:00Z'),
        weekEnd: new Date('2025-01-07T00:00:00Z'),
      };

      const calendar = generateCalendarEvent(mealPlan);
      
      // Check date format (YYYYMMDDTHHMMSSZ)
      expect(calendar.google).toMatch(/dates=\d{8}T\d{6}Z\/\d{8}T\d{6}Z/);
    });
  });

  describe('generateShareableLink', () => {
    it('should generate correct shareable link', () => {
      const mealPlanId = 'abc123';
      const link = generateShareableLink(mealPlanId);
      
      expect(link).toContain('/meal-plans/');
      expect(link).toContain(mealPlanId);
    });

    it('should use environment URL if available', () => {
      const originalEnv = process.env.NEXT_PUBLIC_APP_URL;
      process.env.NEXT_PUBLIC_APP_URL = 'https://custom-domain.com';
      
      const link = generateShareableLink('test-id');
      expect(link).toStartWith('https://custom-domain.com');
      
      process.env.NEXT_PUBLIC_APP_URL = originalEnv;
    });
  });

  describe('formatMealPlanText', () => {
    it('should format meal plan correctly', () => {
      const mealPlan = {
        title: 'My Weekly Plan',
        weekStart: new Date('2025-10-27'),
        weekEnd: new Date('2025-11-02'),
        description: 'Healthy eating',
        dailyMenus: [
          {
            date: new Date('2025-10-27'),
            meals: [
              {
                mealType: 'breakfast',
                mealName: 'Oatmeal Bowl',
                prepTime: '10 min',
                defenseSystems: ['MICROBIOME', 'IMMUNITY'],
              },
              {
                mealType: 'lunch',
                mealName: 'Salmon Salad',
                prepTime: '15 min',
                defenseSystems: ['ANGIOGENESIS'],
              },
            ],
          },
        ],
      };

      const text = formatMealPlanText(mealPlan);
      
      expect(text).toContain('My Weekly Plan');
      expect(text).toContain('MONDAY');
      expect(text).toContain('Breakfast: Oatmeal Bowl');
      expect(text).toContain('⏱ 10 min');
      expect(text).toContain('🛡 Systems: MICROBIOME, IMMUNITY');
      expect(text).toContain('Lunch: Salmon Salad');
    });
  });

  describe('formatShoppingListText', () => {
    it('should format shopping list correctly', () => {
      const shoppingList = {
        title: 'Weekly Groceries',
        items: [
          {
            ingredient: 'Tomatoes',
            quantity: 5,
            unit: 'pcs',
            category: 'Produce',
            estimatedCost: 3.99,
          },
          {
            ingredient: 'Chicken Breast',
            quantity: 2,
            unit: 'lbs',
            category: 'Meat',
            estimatedCost: 12.99,
          },
          {
            ingredient: 'Spinach',
            quantity: 1,
            unit: 'bag',
            category: 'Produce',
          },
        ],
        totalCost: 16.98,
      };

      const text = formatShoppingListText(shoppingList);
      
      expect(text).toContain('Weekly Groceries');
      expect(text).toContain('PRODUCE');
      expect(text).toContain('MEAT');
      expect(text).toContain('☐ Tomatoes - 5 pcs ($3.99)');
      expect(text).toContain('☐ Chicken Breast - 2 lbs ($12.99)');
      expect(text).toContain('Estimated Total: $16.98');
    });

    it('should group items by category', () => {
      const shoppingList = {
        title: 'Test List',
        items: [
          { ingredient: 'Apple', quantity: 3, unit: 'pcs', category: 'Produce' },
          { ingredient: 'Bread', quantity: 1, unit: 'loaf', category: 'Bakery' },
          { ingredient: 'Banana', quantity: 6, unit: 'pcs', category: 'Produce' },
        ],
      };

      const text = formatShoppingListText(shoppingList);
      
      const produceIndex = text.indexOf('PRODUCE');
      const bakeryIndex = text.indexOf('BAKERY');
      const appleIndex = text.indexOf('Apple');
      const bananaIndex = text.indexOf('Banana');
      
      expect(produceIndex).toBeGreaterThan(-1);
      expect(bakeryIndex).toBeGreaterThan(-1);
      expect(appleIndex).toBeGreaterThan(produceIndex);
      expect(bananaIndex).toBeGreaterThan(appleIndex);
    });
  });

  describe('generateInstacartLink', () => {
    it('should generate Instacart search URL', () => {
      const items = ['Tomatoes', 'Chicken', 'Rice', 'Spinach', 'Onions'];
      const url = generateInstacartLink(items);
      
      expect(url).toContain('instacart.com');
      expect(url).toContain('search');
      expect(url).toContain(encodeURIComponent('Tomatoes'));
    });

    it('should limit to 5 items', () => {
      const items = ['Item1', 'Item2', 'Item3', 'Item4', 'Item5', 'Item6', 'Item7'];
      const url = generateInstacartLink(items);
      
      expect(url).toContain('Item1');
      expect(url).toContain('Item5');
      expect(url).not.toContain('Item6');
    });
  });

  describe('generateAmazonFreshLink', () => {
    it('should generate Amazon Fresh URL', () => {
      const items = ['Eggs', 'Milk', 'Butter'];
      const url = generateAmazonFreshLink(items);
      
      expect(url).toContain('amazon.com');
      expect(url).toContain('query=');
    });
  });
});

// Mock clipboard for testing
describe('copyToClipboard', () => {
  it('should copy text to clipboard', async () => {
    // Mock navigator.clipboard
    const mockWriteText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    const text = 'Test text to copy';
    const result = await copyToClipboard(text);
    
    expect(result).toBe(true);
    expect(mockWriteText).toHaveBeenCalledWith(text);
  });
});

// Integration test example
describe('Integration: Complete Share Flow', () => {
  it('should generate all share options for a meal plan', () => {
    const mealPlan = {
      id: 'plan-123',
      title: 'Healthy October Week',
      description: 'Balanced meals for the week',
      weekStart: new Date('2025-10-27'),
      weekEnd: new Date('2025-11-02'),
      dailyMenus: [
        {
          date: new Date('2025-10-27'),
          meals: [
            {
              mealType: 'breakfast',
              mealName: 'Avocado Toast',
              prepTime: '10 min',
              defenseSystems: ['ANGIOGENESIS'],
            },
          ],
        },
      ],
    };

    // Generate shareable link
    const link = generateShareableLink(mealPlan.id);
    expect(link).toContain('plan-123');

    // Generate share options
    const shareOptions: ShareOptions = {
      title: mealPlan.title,
      text: mealPlan.description,
      url: link,
    };

    // Test all sharing methods
    const whatsapp = generateWhatsAppUrl(shareOptions);
    const email = generateEmailUrl(shareOptions);
    const social = generateSocialUrls(shareOptions);
    const calendar = generateCalendarEvent(mealPlan);
    const text = formatMealPlanText(mealPlan);

    expect(whatsapp).toBeTruthy();
    expect(email).toBeTruthy();
    expect(social.facebook).toBeTruthy();
    expect(calendar.google).toBeTruthy();
    expect(text).toContain('Healthy October Week');
    expect(text).toContain('Avocado Toast');
  });
});

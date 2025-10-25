# Sharing Utilities - Testing Guide

## Overview
This guide provides comprehensive instructions for testing the sharing utilities and ShareButton component.

## Table of Contents
1. [Setup](#setup)
2. [Unit Testing](#unit-testing)
3. [Component Testing](#component-testing)
4. [Manual Testing](#manual-testing)
5. [Mock Data](#mock-data)
6. [Browser Testing](#browser-testing)
7. [Mobile Testing](#mobile-testing)

---

## Setup

### Install Testing Dependencies
```bash
# Install Jest and React Testing Library (if not already installed)
npm install --save-dev @types/jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom

# Update package.json
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"]
  }
}
```

Create `jest.setup.js`:
```javascript
import '@testing-library/jest-dom';
```

---

## Unit Testing

### Testing Sharing Utilities

#### 1. Test WhatsApp URL Generation
```typescript
import { generateWhatsAppUrl } from '@/lib/utils/sharing';

test('generates valid WhatsApp URL', () => {
  const result = generateWhatsAppUrl({
    title: 'My Meal Plan',
    text: 'Check this out!',
    url: 'https://example.com/plan/123'
  });
  
  expect(result).toContain('wa.me');
  expect(result).toContain(encodeURIComponent('My Meal Plan'));
});
```

#### 2. Test Email URL Generation
```typescript
import { generateEmailUrl } from '@/lib/utils/sharing';

test('generates mailto link with subject and body', () => {
  const result = generateEmailUrl({
    title: 'Weekly Plan',
    text: 'My description',
    url: 'https://example.com'
  });
  
  expect(result).toStartWith('mailto:?');
  expect(result).toContain('subject=');
  expect(result).toContain('body=');
});
```

#### 3. Test Calendar Event Generation
```typescript
import { generateCalendarEvent } from '@/lib/utils/sharing';

test('generates calendar URLs for all platforms', () => {
  const mealPlan = {
    title: 'Healthy Week',
    weekStart: new Date('2025-10-27'),
    weekEnd: new Date('2025-11-02'),
    description: 'My plan'
  };
  
  const result = generateCalendarEvent(mealPlan);
  
  expect(result.google).toContain('calendar.google.com');
  expect(result.ical).toContain('BEGIN:VCALENDAR');
  expect(result.outlook).toContain('outlook.live.com');
});
```

#### 4. Test Meal Plan Formatting
```typescript
import { formatMealPlanText } from '@/lib/utils/sharing';

test('formats meal plan with proper structure', () => {
  const mealPlan = {
    title: 'Test Plan',
    weekStart: new Date('2025-10-27'),
    weekEnd: new Date('2025-11-02'),
    dailyMenus: [
      {
        date: new Date('2025-10-27'),
        meals: [
          {
            mealType: 'breakfast',
            mealName: 'Oatmeal',
            prepTime: '10 min',
            defenseSystems: ['MICROBIOME']
          }
        ]
      }
    ]
  };
  
  const result = formatMealPlanText(mealPlan);
  
  expect(result).toContain('Test Plan');
  expect(result).toContain('MONDAY');
  expect(result).toContain('Breakfast: Oatmeal');
  expect(result).toContain('⏱ 10 min');
});
```

#### 5. Test Shopping List Formatting
```typescript
import { formatShoppingListText } from '@/lib/utils/sharing';

test('formats shopping list grouped by category', () => {
  const list = {
    title: 'Groceries',
    items: [
      {
        ingredient: 'Tomatoes',
        quantity: 5,
        unit: 'pcs',
        category: 'Produce',
        estimatedCost: 3.99
      },
      {
        ingredient: 'Chicken',
        quantity: 2,
        unit: 'lbs',
        category: 'Meat',
        estimatedCost: 12.99
      }
    ],
    totalCost: 16.98
  };
  
  const result = formatShoppingListText(list);
  
  expect(result).toContain('PRODUCE');
  expect(result).toContain('MEAT');
  expect(result).toContain('☐ Tomatoes - 5 pcs ($3.99)');
  expect(result).toContain('Estimated Total: $16.98');
});
```

---

## Component Testing

### Testing ShareButton Component

#### 1. Basic Rendering Test
```typescript
import { render, screen } from '@testing-library/react';
import ShareButton from '@/components/sharing/ShareButton';

test('renders share button', () => {
  render(
    <ShareButton
      title="Test Plan"
      url="https://example.com/test"
      type="meal-plan"
    />
  );
  
  expect(screen.getByLabelText(/share/i)).toBeInTheDocument();
});
```

#### 2. Test Dropdown Menu
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import ShareButton from '@/components/sharing/ShareButton';

test('opens dropdown menu on click', async () => {
  render(
    <ShareButton
      title="Test Plan"
      url="https://example.com/test"
      type="meal-plan"
      variant="dropdown"
    />
  );
  
  const button = screen.getByRole('button');
  fireEvent.click(button);
  
  expect(screen.getByText(/WhatsApp/i)).toBeVisible();
  expect(screen.getByText(/Email/i)).toBeVisible();
});
```

#### 3. Test Copy Link Functionality
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShareButton from '@/components/sharing/ShareButton';

test('copies link to clipboard', async () => {
  // Mock clipboard API
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn().mockResolvedValue(undefined),
    },
  });
  
  render(
    <ShareButton
      title="Test"
      url="https://example.com/test"
      type="meal-plan"
      variant="dropdown"
    />
  );
  
  fireEvent.click(screen.getByRole('button'));
  fireEvent.click(screen.getByText(/Copy Link/i));
  
  await waitFor(() => {
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://example.com/test'
    );
  });
});
```

#### 4. Test Feature Flag Integration
```typescript
import { render, screen } from '@testing-library/react';
import ShareButton from '@/components/sharing/ShareButton';

// Mock useFeatureAccess hook
jest.mock('@/hooks/useFeatureAccess', () => ({
  useFeatureAccess: () => ({
    hasFeature: (feature: string) => {
      // Mock: only allow basic features for free tier
      return !feature.includes('QR') && !feature.includes('GROCERY');
    },
  }),
}));

test('hides premium features for free users', () => {
  render(
    <ShareButton
      title="Test"
      url="https://example.com/test"
      type="meal-plan"
      variant="dropdown"
    />
  );
  
  fireEvent.click(screen.getByRole('button'));
  
  // QR code should not be visible for free users
  expect(screen.queryByText(/QR Code/i)).not.toBeInTheDocument();
});
```

---

## Mock Data

### Meal Plan Mock Data
```typescript
export const mockMealPlan = {
  id: 'plan-123',
  title: 'Healthy October Week',
  description: 'Balanced nutrition for the entire week',
  weekStart: new Date('2025-10-27'),
  weekEnd: new Date('2025-11-02'),
  dailyMenus: [
    {
      date: new Date('2025-10-27'),
      dayOfWeek: 'monday',
      meals: [
        {
          mealType: 'breakfast',
          mealName: 'Avocado Toast with Poached Eggs',
          prepTime: '15 min',
          calories: 350,
          defenseSystems: ['ANGIOGENESIS', 'MICROBIOME'],
        },
        {
          mealType: 'lunch',
          mealName: 'Quinoa Buddha Bowl',
          prepTime: '20 min',
          calories: 450,
          defenseSystems: ['DNA_PROTECTION', 'IMMUNITY'],
        },
        {
          mealType: 'dinner',
          mealName: 'Grilled Salmon with Roasted Vegetables',
          prepTime: '30 min',
          calories: 550,
          defenseSystems: ['ANGIOGENESIS', 'REGENERATION'],
        },
      ],
    },
    {
      date: new Date('2025-10-28'),
      dayOfWeek: 'tuesday',
      meals: [
        {
          mealType: 'breakfast',
          mealName: 'Greek Yogurt Parfait',
          prepTime: '10 min',
          calories: 300,
          defenseSystems: ['MICROBIOME', 'IMMUNITY'],
        },
        {
          mealType: 'lunch',
          mealName: 'Mediterranean Chickpea Salad',
          prepTime: '15 min',
          calories: 400,
          defenseSystems: ['DNA_PROTECTION', 'STEM_CELL'],
        },
      ],
    },
  ],
};
```

### Shopping List Mock Data
```typescript
export const mockShoppingList = {
  id: 'list-456',
  title: 'Weekly Grocery List',
  mealPlanId: 'plan-123',
  items: [
    {
      ingredient: 'Avocados',
      quantity: 4,
      unit: 'pcs',
      category: 'Produce',
      estimatedCost: 5.99,
      checked: false,
    },
    {
      ingredient: 'Eggs',
      quantity: 12,
      unit: 'pcs',
      category: 'Dairy',
      estimatedCost: 4.99,
      checked: false,
    },
    {
      ingredient: 'Salmon Fillet',
      quantity: 1.5,
      unit: 'lbs',
      category: 'Seafood',
      estimatedCost: 18.99,
      checked: false,
    },
    {
      ingredient: 'Quinoa',
      quantity: 1,
      unit: 'bag',
      category: 'Grains',
      estimatedCost: 6.99,
      checked: false,
    },
    {
      ingredient: 'Greek Yogurt',
      quantity: 2,
      unit: 'containers',
      category: 'Dairy',
      estimatedCost: 7.99,
      checked: false,
    },
    {
      ingredient: 'Mixed Vegetables',
      quantity: 1,
      unit: 'bag',
      category: 'Frozen',
      estimatedCost: 4.99,
      checked: false,
    },
  ],
  totalCost: 49.94,
  generatedAt: new Date('2025-10-26'),
};
```

---

## Manual Testing

### Browser Testing Checklist

#### Desktop Testing (Chrome, Firefox, Safari, Edge)
- [ ] Copy link button works
- [ ] WhatsApp opens in new tab with correct message
- [ ] Email client opens with subject and body
- [ ] Calendar downloads work (Google, iCal, Outlook)
- [ ] Social media share dialogs open correctly
- [ ] QR code generates and displays
- [ ] Text export downloads as .txt file
- [ ] Dropdown menu opens/closes properly
- [ ] Feature flags hide premium features correctly

#### Test on Each Browser:
```bash
# Open your app
npm run dev

# Navigate to a meal plan or shopping list page
# Click the share button
# Test each sharing option
```

### Mobile Testing

#### iOS Safari
- [ ] Native share sheet opens (if available)
- [ ] WhatsApp app opens with message
- [ ] Email app opens with content
- [ ] Calendar import works
- [ ] Copy link provides feedback
- [ ] QR code displays correctly

#### Android Chrome
- [ ] Native share sheet opens
- [ ] WhatsApp app opens
- [ ] Email app opens
- [ ] Calendar options work
- [ ] Copy link works
- [ ] Grocery app links work (if apps installed)

### Testing Instructions:

1. **Test Copy Link:**
   - Click "Copy Link"
   - Verify checkmark appears
   - Paste in another app to verify URL

2. **Test WhatsApp:**
   - Click WhatsApp option
   - Verify message contains title and link
   - Send test message to yourself

3. **Test Email:**
   - Click Email option
   - Verify subject line is correct
   - Verify body contains description and link
   - Send test email

4. **Test Calendar:**
   - Click "Add to Google Calendar"
   - Verify event details (title, dates, description)
   - Save event and check calendar
   - Repeat for iCal and Outlook

5. **Test Social Media:**
   - Click Facebook share
   - Verify preview shows title and link
   - Post to timeline (or cancel)
   - Repeat for Twitter, LinkedIn

6. **Test QR Code:**
   - Click "Generate QR Code"
   - Verify QR displays
   - Scan with phone to verify it opens correct URL
   - Test download QR option

7. **Test Text Export:**
   - Click "Download as Text"
   - Verify file downloads
   - Open file and check formatting

8. **Test Grocery Services:**
   - Click Instacart/Amazon Fresh
   - Verify search opens with items
   - Check that items are correct

---

## Integration Testing Example

### Complete Share Flow Test
```typescript
import { generateShareableLink, formatMealPlanText, generateWhatsAppUrl } from '@/lib/utils/sharing';
import { mockMealPlan } from './mocks';

describe('Complete sharing workflow', () => {
  test('user can share meal plan via WhatsApp', () => {
    // 1. Generate shareable link
    const link = generateShareableLink(mockMealPlan.id);
    expect(link).toContain('/meal-plans/plan-123');
    
    // 2. Format meal plan text
    const text = formatMealPlanText(mockMealPlan);
    expect(text).toContain('Healthy October Week');
    
    // 3. Generate WhatsApp URL
    const whatsappUrl = generateWhatsAppUrl({
      title: mockMealPlan.title,
      text: mockMealPlan.description,
      url: link,
    });
    
    expect(whatsappUrl).toContain('wa.me');
    expect(whatsappUrl).toContain(encodeURIComponent(mockMealPlan.title));
    
    // 4. Verify URL opens (manual step or with browser automation)
    console.log('WhatsApp URL:', whatsappUrl);
  });
});
```

---

## Performance Testing

### Test Large Meal Plans
```typescript
test('handles large meal plan efficiently', () => {
  const largeMealPlan = {
    title: 'Monthly Plan',
    dailyMenus: Array(30).fill(null).map((_, i) => ({
      date: new Date(2025, 9, i + 1),
      meals: [
        { mealType: 'breakfast', mealName: `Breakfast ${i}` },
        { mealType: 'lunch', mealName: `Lunch ${i}` },
        { mealType: 'dinner', mealName: `Dinner ${i}` },
      ],
    })),
  };
  
  const start = performance.now();
  const result = formatMealPlanText(largeMealPlan);
  const end = performance.now();
  
  expect(end - start).toBeLessThan(100); // Should format in < 100ms
  expect(result).toContain('Monthly Plan');
});
```

---

## Accessibility Testing

### Test Keyboard Navigation
```typescript
test('ShareButton is keyboard accessible', async () => {
  const { container } = render(
    <ShareButton
      title="Test"
      url="https://example.com"
      type="meal-plan"
      variant="dropdown"
    />
  );
  
  const button = container.querySelector('button');
  
  // Focus button
  button?.focus();
  expect(document.activeElement).toBe(button);
  
  // Press Enter to open
  fireEvent.keyDown(button!, { key: 'Enter' });
  
  // Menu should be visible
  expect(screen.getByText(/WhatsApp/i)).toBeVisible();
});
```

---

## Error Handling Tests

```typescript
test('handles clipboard error gracefully', async () => {
  // Mock clipboard failure
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn().mockRejectedValue(new Error('Permission denied')),
    },
  });
  
  const result = await copyToClipboard('test');
  expect(result).toBe(false);
});

test('handles QR code generation failure', async () => {
  // Mock fetch failure
  global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
  
  const qrUrl = await generateQRCode('https://example.com');
  expect(qrUrl).toBeNull();
});
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test sharing.test.ts

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test
npm test -- -t "generates valid WhatsApp URL"
```

---

## CI/CD Integration

Add to `.github/workflows/test.yml`:
```yaml
name: Run Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run build
```

---

## Troubleshooting

### Common Issues:

**Issue: Clipboard tests failing**
- Solution: Mock `navigator.clipboard` in test setup
- Add to jest.setup.js:
```javascript
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
  },
});
```

**Issue: Calendar events not formatted correctly**
- Solution: Check timezone handling
- Use UTC dates for consistency

**Issue: Social media links broken**
- Solution: Verify URL encoding
- Test with actual URLs in browser console

---

## Next Steps

1. ✅ Set up testing environment
2. ✅ Run unit tests for all sharing functions
3. ✅ Test ShareButton component
4. ✅ Manual browser testing
5. ✅ Mobile device testing
6. ✅ Fix any issues found
7. ✅ Document test results
8. ✅ Set up CI/CD pipeline

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)
- [WhatsApp URL Scheme](https://faq.whatsapp.com/5913398998672934)
- [iCalendar Format](https://icalendar.org/)

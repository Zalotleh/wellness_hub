'use client';

import React from 'react';
import ShareMenu from '@/components/sharing/ShareMenu';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { exportMealPlanToPDF } from '@/lib/utils/sharing';

interface ShareMenuExampleProps {
  mealPlan?: {
    id: string;
    title: string;
    description?: string;
    weekStart: Date;
    weekEnd: Date;
    dailyMenus: any[];
  };
}

export default function ShareMenuExample({ mealPlan }: ShareMenuExampleProps) {
  const { toasts, removeToast } = useToast();

  // Example meal plan data if none provided
  const defaultMealPlan = {
    id: 'example-plan',
    title: 'My Healthy Week',
    description: 'A balanced meal plan focusing on all 5 defense systems',
    weekStart: new Date(),
    weekEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    dailyMenus: [
      {
        date: new Date(),
        meals: [
          {
            mealType: 'breakfast',
            mealName: 'Antioxidant Berry Bowl',
            prepTime: '10 min',
            defenseSystems: ['Antioxidants', 'Fiber'],
          },
          {
            mealType: 'lunch',
            mealName: 'Mediterranean Quinoa Salad',
            prepTime: '15 min',
            defenseSystems: ['Omega-3s', 'Fiber', 'Probiotics'],
          },
        ],
      },
    ],
  };

  const activeMealPlan = mealPlan || defaultMealPlan;

  const handlePDFExport = async (data: any) => {
    const filename = `${activeMealPlan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_meal_plan.pdf`;
    await exportMealPlanToPDF(data, filename);
  };

  const handleCalendarExport = async (type: 'google' | 'ical' | 'outlook') => {
    // Custom calendar export logic can go here
    // For now, we'll use the default behavior in ShareMenu
    console.log(`Exporting to ${type} calendar:`, activeMealPlan);
  };

  const handleShare = (platform: string) => {
    console.log(`Shared to ${platform}:`, activeMealPlan.title);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-semibold">Share Your Meal Plan</h3>
        
        {/* Icon variant */}
        <ShareMenu
          title={activeMealPlan.title}
          description={activeMealPlan.description}
          url={`https://yourapp.com/meal-plans/${activeMealPlan.id}`}
          variant="icon"
          pdfData={{
            filename: `${activeMealPlan.title}_meal_plan.pdf`,
            content: activeMealPlan,
          }}
          calendarData={{
            title: activeMealPlan.title,
            startDate: activeMealPlan.weekStart,
            endDate: activeMealPlan.weekEnd,
            description: activeMealPlan.description,
          }}
          onShare={handleShare}
          onPDFExport={handlePDFExport}
          onCalendarExport={handleCalendarExport}
        />

        {/* Button variant */}
        <ShareMenu
          title={activeMealPlan.title}
          description={activeMealPlan.description}
          url={`https://yourapp.com/meal-plans/${activeMealPlan.id}`}
          variant="button"
          position="bottom-left"
          pdfData={{
            filename: `${activeMealPlan.title}_meal_plan.pdf`,
            content: activeMealPlan,
          }}
          calendarData={{
            title: activeMealPlan.title,
            startDate: activeMealPlan.weekStart,
            endDate: activeMealPlan.weekEnd,
            description: activeMealPlan.description,
          }}
          onShare={handleShare}
          onPDFExport={handlePDFExport}
          onCalendarExport={handleCalendarExport}
        />
      </div>

      {/* Toast container for notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

// Provider component to wrap your app with toast functionality
export function ShareMenuProvider({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useToast();

  return (
    <div className="relative">
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
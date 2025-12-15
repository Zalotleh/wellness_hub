'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface PDFExportOptions {
  includeRecipes: boolean;
  includeShoppingList: boolean;
  includeNutrition: boolean;
}

interface PDFExportProps {
  mealPlanId: string;
  mealPlanTitle?: string;
  className?: string;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: string) => void;
}

export default function PDFExportButton({
  mealPlanId,
  mealPlanTitle = 'Meal Plan',
  className,
  onExportStart,
  onExportComplete,
  onExportError,
}: PDFExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [exportFormat, setExportFormat] = useState<'react-pdf' | 'jspdf'>('react-pdf');
  const [options, setOptions] = useState<PDFExportOptions>({
    includeRecipes: true,
    includeShoppingList: true,
    includeNutrition: false,
  });

  const downloadPDF = useCallback(async (exportOptions: PDFExportOptions) => {
    setIsExporting(true);
    setProgress(0);
    onExportStart?.();

    try {
      // Simulate progress steps
      setProgress(25);
      
      const params = new URLSearchParams({
        includeRecipes: exportOptions.includeRecipes.toString(),
        includeShoppingList: exportOptions.includeShoppingList.toString(),
        includeNutrition: exportOptions.includeNutrition.toString(),
      });

      setProgress(50);

      const endpoint = exportFormat === 'jspdf' 
        ? `/api/meal-planner/${mealPlanId}/export/pdf-jspdf?${params}`
        : `/api/meal-planner/${mealPlanId}/export/pdf?${params}`;

      const response = await fetch(endpoint);
      
      setProgress(75);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      setProgress(90);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${mealPlanTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setProgress(100);
      onExportComplete?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onExportError?.(errorMessage);
    } finally {
      setIsExporting(false);
      setProgress(0);
      setShowOptions(false);
    }
  }, [mealPlanId, mealPlanTitle, onExportStart, onExportComplete, onExportError]);

  const handleQuickExport = useCallback(() => {
    downloadPDF(options);
  }, [downloadPDF, options]);

  const handleCustomExport = useCallback(() => {
    downloadPDF(options);
  }, [downloadPDF, options]);

  return (
    <div className={cn('relative', className)}>
      {/* Main Export Button */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleQuickExport}
          disabled={isExporting}
          className={cn(
            'flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors',
            isExporting && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isExporting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4a2 2 0 00-2-2H8a2 2 0 00-2 2v2M7 6h10l1 10H6L7 6z" />
              </svg>
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export PDF</span>
            </>
          )}
        </button>

        <button
          onClick={() => setShowOptions(!showOptions)}
          disabled={isExporting}
          className="px-2 py-2 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:bg-gray-700 rounded-md transition-colors"
          title="Export options"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      {isExporting && (
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-200">Generating PDF...</span>
            <span className="text-sm text-gray-600 dark:text-gray-200">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
            {progress < 25 && 'Preparing data...'}
            {progress >= 25 && progress < 50 && 'Building document structure...'}
            {progress >= 50 && progress < 75 && 'Generating PDF content...'}
            {progress >= 75 && progress < 90 && 'Finalizing document...'}
            {progress >= 90 && 'Download ready!'}
          </div>
        </div>
      )}

      {/* Options Panel */}
      {showOptions && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Export Options</h3>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={options.includeRecipes}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeRecipes: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Include Recipes</span>
                  <p className="text-xs text-gray-500 dark:text-gray-300">Full recipe details with ingredients and instructions</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={options.includeShoppingList}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeShoppingList: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Include Shopping List</span>
                  <p className="text-xs text-gray-500 dark:text-gray-300">Organized grocery list with categories</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={options.includeNutrition}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeNutrition: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Include Nutrition Info</span>
                  <p className="text-xs text-gray-500 dark:text-gray-300">Calories, macros, and defense systems</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    Premium
                  </span>
                </div>
              </label>

              {/* Format Selection */}
              <div className="pt-3 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-900 mb-2">PDF Format</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="exportFormat"
                      checked={exportFormat === 'react-pdf'}
                      onChange={() => setExportFormat('react-pdf')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm text-gray-900">React PDF</span>
                      <p className="text-xs text-gray-500 dark:text-gray-300">High-quality formatting (recommended)</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="exportFormat"
                      checked={exportFormat === 'jspdf'}
                      onChange={() => setExportFormat('jspdf')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm text-gray-900">jsPDF</span>
                      <p className="text-xs text-gray-500 dark:text-gray-300">Fast generation, basic formatting</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={handleCustomExport}
                disabled={isExporting}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Export with Options
              </button>
              <button
                onClick={() => setShowOptions(false)}
                className="px-3 py-2 text-gray-700 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced PDF Export Hook
export function usePDFExport(mealPlanId: string) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const exportPDF = useCallback(async (
    options: PDFExportOptions, 
    fileName?: string,
    format: 'react-pdf' | 'jspdf' = 'react-pdf'
  ) => {
    setIsExporting(true);
    setProgress(0);
    setError(null);

    try {
      const params = new URLSearchParams({
        includeRecipes: options.includeRecipes.toString(),
        includeShoppingList: options.includeShoppingList.toString(),
        includeNutrition: options.includeNutrition.toString(),
      });

      setProgress(25);

      const endpoint = format === 'jspdf' 
        ? `/api/meal-planner/${mealPlanId}/export/pdf-jspdf?${params}`
        : `/api/meal-planner/${mealPlanId}/export/pdf?${params}`;

      const response = await fetch(endpoint);
      
      setProgress(50);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      setProgress(75);

      // Create download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'meal-plan.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setProgress(100);
      
      // Reset after a short delay
      setTimeout(() => {
        setProgress(0);
        setIsExporting(false);
      }, 1000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsExporting(false);
      setProgress(0);
    }
  }, [mealPlanId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    exportPDF,
    isExporting,
    progress,
    error,
    clearError,
  };
}

// Progress Indicator Component
interface PDFProgressProps {
  progress: number;
  isVisible: boolean;
}

export function PDFProgress({ progress, isVisible }: PDFProgressProps) {
  if (!isVisible) return null;

  const getProgressMessage = (progress: number) => {
    if (progress < 25) return 'Initializing export...';
    if (progress < 50) return 'Gathering meal plan data...';
    if (progress < 75) return 'Generating PDF document...';
    if (progress < 90) return 'Finalizing export...';
    return 'Download ready!';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <svg
              className="w-16 h-16 text-blue-500 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Generating PDF Export
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-200 mb-4">
            {getProgressMessage(progress)}
          </p>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500 dark:text-gray-300">{Math.round(progress)}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-300">
            This may take a few moments depending on the content size
          </p>
        </div>
      </div>
    </div>
  );
}
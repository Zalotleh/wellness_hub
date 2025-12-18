'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface FirstTimeModalProps {
  storageKey: string;
  title: string;
  description: string;
  tips: string[];
  examples?: {
    good: string[];
    bad: string[];
  };
  onClose: () => void;
}

export function FirstTimeModal({
  storageKey,
  title,
  description,
  tips,
  examples,
  onClose,
}: FirstTimeModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen this modal before
    const hasSeenModal = localStorage.getItem(storageKey);
    if (!hasSeenModal) {
      setIsOpen(true);
    }
  }, [storageKey]);

  const handleClose = () => {
    localStorage.setItem(storageKey, 'true');
    setIsOpen(false);
    onClose();
  };

  const handleDontShowAgain = () => {
    localStorage.setItem(storageKey, 'true');
    setIsOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Description */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-gray-700 leading-relaxed">{description}</p>
          </div>

          {/* Tips */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              💡 Tips for Success
            </h3>
            <ul className="space-y-2">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span className="text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Examples */}
          {examples && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Good Examples */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <span className="text-xl">✓</span> Good Examples
                </h4>
                <ul className="space-y-1.5 text-sm">
                  {examples.good.map((example, index) => (
                    <li key={index} className="text-green-800">
                      • {example}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bad Examples */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <span className="text-xl">✗</span> Avoid These
                </h4>
                <ul className="space-y-1.5 text-sm">
                  {examples.bad.map((example, index) => (
                    <li key={index} className="text-red-800">
                      • {example}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Monthly Limit Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-900 mb-2">
              📊 Your Monthly Limit
            </h4>
            <p className="text-amber-800 text-sm">
              FREE users get <strong>30 AI generations per month</strong> shared between
              recipe generator and meal plan recipes. Make each generation count by providing
              detailed, specific information!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleDontShowAgain}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Don't show this again
          </button>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Got it, let's start!
          </button>
        </div>
      </div>
    </div>
  );
}

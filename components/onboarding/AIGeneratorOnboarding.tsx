'use client';

import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { DefenseSystem } from '@/types';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { markOnboardingCompleted } from '@/lib/tracking/generation-stats';

interface AIGeneratorOnboardingProps {
  onClose: () => void;
  onComplete: (selectedSystem?: DefenseSystem) => void;
  type: 'recipe' | 'mealplan';
}

export default function AIGeneratorOnboarding({
  onClose,
  onComplete,
  type,
}: AIGeneratorOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSystem, setSelectedSystem] = useState<DefenseSystem | null>(
    null
  );

  const steps = [
    {
      title: 'Welcome to AI Recipe Generation! 🎉',
      description:
        type === 'recipe'
          ? 'Let me show you how to create amazing, health-focused recipes with AI.'
          : 'Let me show you how to create personalized meal plans with AI.',
      content: (
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-2">
              Why this works better:
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  Health-first approach based on scientific research
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  Quality guidance to help you get better results
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  Real-time tips and ingredient suggestions
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  Personalized recommendations based on your preferences
                </span>
              </li>
            </ul>
          </div>
          <p className="text-sm text-gray-400">
            This quick walkthrough will help you create your first{' '}
            {type === 'recipe' ? 'recipe' : 'meal plan'} successfully.
          </p>
        </div>
      ),
    },
    {
      title: 'Step 1: Choose Your Health Goal 🎯',
      description:
        'Select a defense system that aligns with your health objectives.',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Each system focuses on different aspects of your health:
          </p>
          <div className="grid gap-3">
            {Object.values(DefenseSystem).map((system) => {
              const systemInfo = DEFENSE_SYSTEMS[system];
              const isSelected = selectedSystem === system;

              return (
                <button
                  key={system}
                  onClick={() => setSelectedSystem(system)}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {isSelected ? (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-600 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white mb-1">
                        {systemInfo.name}
                      </h4>
                      <p className="text-xs text-gray-400">
                        {systemInfo.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      title: 'Step 2: Add Quality Ingredients 🥗',
      description: 'More details = better results from the AI.',
      content: (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-green-400 mb-3">
              Best Practices:
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-xs font-bold text-green-400">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Add 3+ specific ingredients
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Example: "salmon, asparagus, lemon" instead of just
                    "fish"
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-xs font-bold text-green-400">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Specify dietary restrictions
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Helps the AI avoid ingredients you can't or don't want to
                    eat
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-xs font-bold text-green-400">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Choose a meal type
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    The AI generates more appropriate portions and
                    preparations
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-400 mb-2">
              💡 Pro Tip:
            </h4>
            <p className="text-sm text-gray-300">
              Watch the quality score meter fill up as you add more details.
              Aim for 4-5 stars for best results!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "You're All Set! 🚀",
      description: 'Ready to create your first AI-generated recipe.',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-3">
              Quick Reminder:
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">→</span>
                <span>
                  The quality score guides you to better inputs
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">→</span>
                <span>
                  Check the tips section if you need help
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">→</span>
                <span>
                  You get {type === 'recipe' ? '30' : '1'} free{' '}
                  {type === 'recipe' ? 'recipes' : 'meal plan'} per month
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">→</span>
                <span>
                  Upgrade to Premium for unlimited generations
                </span>
              </li>
            </ul>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-white mb-2">
              Ready to start? 🎨
            </p>
            <p className="text-sm text-gray-400">
              {selectedSystem
                ? `We'll pre-select ${DEFENSE_SYSTEMS[selectedSystem].name} for you!`
                : 'You can start creating right away!'}
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    markOnboardingCompleted();
    onComplete(selectedSystem || undefined);
    onClose();
  };

  const handleSkip = () => {
    markOnboardingCompleted();
    onComplete();
    onClose();
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">
              {currentStepData.title}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {currentStepData.description}
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-white transition-colors ml-4"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  index <= currentStep ? 'bg-blue-500' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-800 bg-gray-800/30">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Skip Tutorial
          </button>
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            )}
            {!isLastStep ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
              >
                Get Started
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

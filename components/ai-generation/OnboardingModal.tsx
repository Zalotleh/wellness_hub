'use client';

import React, { useState } from 'react';
import { X, Sparkles, Target, Lightbulb, ChefHat } from 'lucide-react';

interface OnboardingModalProps {
  show: boolean;
  onComplete: () => void;
  context?: 'recipe' | 'mealplan';
}

export default function OnboardingModal({ show, onComplete, context = 'recipe' }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  if (!show) return null;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const isRecipe = context === 'recipe';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white relative">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            {isRecipe ? (
              <ChefHat className="w-8 h-8" />
            ) : (
              <Sparkles className="w-8 h-8" />
            )}
            <h2 className="text-2xl font-bold">
              {isRecipe ? 'AI Recipe Generator' : 'Meal Plan Creator'} Guide
            </h2>
          </div>
          <p className="text-green-50 text-sm">
            Learn how to get the best results in just 3 steps
          </p>
          
          {/* Progress indicators */}
          <div className="flex space-x-2 mt-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i <= step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {isRecipe ? 'Choose Your Defense System' : 'Select Your Health Goals'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {isRecipe 
                      ? 'Each defense system focuses on specific health benefits:'
                      : 'Pick 2-3 defense systems for a balanced meal plan:'}
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 font-bold">•</span>
                      <span><strong>Immunity:</strong> Boost your immune system with vitamin-rich foods</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 font-bold">•</span>
                      <span><strong>Microbiome:</strong> Support gut health with probiotics and fiber</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 font-bold">•</span>
                      <span><strong>DNA Protection:</strong> Antioxidant-rich foods for cellular health</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 font-bold">•</span>
                      <span><strong>Regeneration:</strong> Foods that support tissue repair and healing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 font-bold">•</span>
                      <span><strong>Angiogenesis:</strong> Improve circulation and blood vessel health</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {isRecipe ? 'Quality Ingredients Matter' : 'Plan Duration & Details'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {isRecipe
                      ? 'The AI generates better recipes when you provide:'
                      : 'Better planning leads to better results:'}
                  </p>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2 text-sm">
                    {isRecipe ? (
                      <>
                        <p className="flex items-start">
                          <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                          <span><strong>3+ specific ingredients</strong> (e.g., "chicken breast, broccoli, garlic")</span>
                        </p>
                        <p className="flex items-start">
                          <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                          <span><strong>Dietary restrictions</strong> help filter incompatible ingredients</span>
                        </p>
                        <p className="flex items-start">
                          <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                          <span><strong>Meal type</strong> ensures appropriate portion sizes</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="flex items-start">
                          <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                          <span><strong>2+ weeks</strong> provide better variety and balance</span>
                        </p>
                        <p className="flex items-start">
                          <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                          <span><strong>Accurate servings</strong> ensure proper portions</span>
                        </p>
                        <p className="flex items-start">
                          <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                          <span><strong>Clear title</strong> helps you organize your plans</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Watch Your Quality Score
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    We'll show you a real-time quality score as you fill in details:
                  </p>
                  
                  {/* Example quality indicator */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Input Quality
                      </span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        4.5/5.0 (90%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '90%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <p className="flex items-start">
                      <span className="text-yellow-500 mr-2">💡</span>
                      <span>Aim for <strong>80%+</strong> for best results</span>
                    </p>
                    <p className="flex items-start">
                      <span className="text-yellow-500 mr-2">💡</span>
                      <span>Follow the tips below the score to improve</span>
                    </p>
                    <p className="flex items-start">
                      <span className="text-yellow-500 mr-2">💡</span>
                      <span>We track your progress to help you improve over time</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-8 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={handlePrevious}
            disabled={step === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Step {step} of {totalSteps}
          </div>
          
          <button
            onClick={handleNext}
            className="px-6 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
          >
            {step === totalSteps ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

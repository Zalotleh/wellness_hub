// app/(dashboard)/advisor/page.tsx
'use client';

import { useState } from 'react';
import AIAdvisor from '@/components/advisor/AIAdvisor';
import { Sparkles, BookOpen, ChefHat, Lightbulb } from 'lucide-react';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { DefenseSystem } from '@/types';

export default function AdvisorPage() {
  const [quickQuestion, setQuickQuestion] = useState<string>('');

  const quickTopics = [
    {
      icon: '🛡️',
      title: 'Immunity Boost',
      question: 'What are the best foods to boost my immune system?',
      color: 'from-yellow-100 to-orange-100',
    },
    {
      icon: '🦠',
      title: 'Gut Health',
      question: 'How can I improve my gut microbiome with food?',
      color: 'from-purple-100 to-pink-100',
    },
    {
      icon: '🩸',
      title: 'Heart Health',
      question: 'What foods support healthy blood vessels and circulation?',
      color: 'from-red-100 to-pink-100',
    },
    {
      icon: '🧬',
      title: 'DNA Protection',
      question: 'Which foods help protect my DNA and slow aging?',
      color: 'from-blue-100 to-cyan-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                AI Nutrient Advisor
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Get personalized nutrition guidance powered by AI
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <AIAdvisor initialMessage={quickQuestion} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Topics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                <span>Quick Topics</span>
              </h3>
              <div className="space-y-3">
                {quickTopics.map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => setQuickQuestion(topic.question)}
                    className={`w-full text-left p-4 bg-gradient-to-r ${topic.color} dark:from-gray-700 dark:to-gray-600 rounded-lg hover:shadow-md transition-all`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{topic.icon}</span>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                          {topic.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {topic.question}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Defense Systems Reference */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <span>5 Defense Systems</span>
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-700">
                💡 <span className="font-medium">Click any defense system below</span> to learn about it and discover which foods support your health.
              </p>
              <div className="space-y-2">
                {Object.values(DefenseSystem).map((system) => {
                  const info = DEFENSE_SYSTEMS[system];
                  return (
                    <button
                      key={system}
                      onClick={() =>
                        setQuickQuestion(`Tell me about ${info.displayName} and which foods support it`)
                      }
                      className={`w-full text-left p-3 rounded-lg ${info.bgColor} dark:bg-gray-700 hover:shadow-md hover:scale-[1.02] transition-all group`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{info.icon}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {info.displayName}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Learn more →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Popular Questions */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border-2 border-blue-200 dark:border-blue-700">
              <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3">
                💡 Popular Questions
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-2">
                <li
                  onClick={() => setQuickQuestion('How do I start the 5x5x5 system?')}
                  className="cursor-pointer hover:underline"
                >
                  • How do I start the 5x5x5 system?
                </li>
                <li
                  onClick={() => setQuickQuestion('What are the best foods for cancer prevention?')}
                  className="cursor-pointer hover:underline"
                >
                  • Best foods for cancer prevention?
                </li>
                <li
                  onClick={() => setQuickQuestion('Suggest a meal plan for beginners')}
                  className="cursor-pointer hover:underline"
                >
                  • Meal plan for beginners
                </li>
                <li
                  onClick={() => setQuickQuestion('How much of each food should I eat?')}
                  className="cursor-pointer hover:underline"
                >
                  • How much of each food to eat?
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Related Resources</h3>
              <div className="space-y-2">
                <a
                  href="/recipes"
                  className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <ChefHat className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Browse Recipes
                    </span>
                  </div>
                </a>
                <a
                  href="/learn"
                  className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Learn 5x5x5
                    </span>
                  </div>
                </a>
                <a
                  href="/meal-planner"
                  className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">📅</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Meal Planner
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
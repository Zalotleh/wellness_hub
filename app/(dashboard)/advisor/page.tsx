// app/(dashboard)/advisor/page.tsx
'use client';

import { useState } from 'react';
import AIAdvisor from '@/components/advisor/AIAdvisor';
import { Sparkles, BookOpen, ChefHat, Lightbulb, ChevronRight, Calendar } from 'lucide-react';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { DefenseSystem } from '@/types';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function AdvisorPage() {
  const [quickQuestion, setQuickQuestion] = useState<string>('');

  const quickTopics = [
    {
      icon: '🛡️',
      title: 'Immunity Boost',
      question: 'What are the best foods to boost my immune system?',
      accent: 'from-amber-400 to-orange-500',
      bg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
      border: 'border-amber-200 dark:border-amber-800',
    },
    {
      icon: '🦠',
      title: 'Gut Health',
      question: 'How can I improve my gut microbiome with food?',
      accent: 'from-emerald-400 to-teal-500',
      bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      icon: '🩸',
      title: 'Heart Health',
      question: 'What foods support healthy blood vessels and circulation?',
      accent: 'from-red-400 to-rose-500',
      bg: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
      border: 'border-red-200 dark:border-red-800',
    },
    {
      icon: '🧬',
      title: 'DNA Protection',
      question: 'Which foods help protect my DNA and slow aging?',
      accent: 'from-blue-400 to-indigo-500',
      bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      border: 'border-blue-200 dark:border-blue-800',
    },
  ];

  const popularQuestions = [
    'How do I start the 5x5x5 system?',
    'Best foods for cancer prevention?',
    'Suggest a meal plan for beginners',
    'How much of each food should I eat?',
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* ── Sticky Top Nav ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center shadow flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none">AI Nutrient Advisor</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Personalized nutrition guidance powered by AI</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Hero banner ─────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 via-teal-500 to-emerald-600 p-6 text-white shadow-lg shadow-green-500/20 mb-8">
          <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-36 h-36 bg-emerald-300/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-green-100 text-sm font-medium mb-0.5">5x5x5 Wellness System</p>
              <h2 className="text-xl font-bold">Your personal AI nutrition coach</h2>
              <p className="text-green-100 text-sm mt-1">Ask anything about food, health, and your 5 defense systems.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main Chat Area ─────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <AIAdvisor initialMessage={quickQuestion} />
          </div>

          {/* ── Sidebar ───────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Quick Topics */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm ring-1 ring-gray-100 dark:ring-gray-700 p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Quick Topics
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {quickTopics.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => setQuickQuestion(topic.question)}
                    className={`text-left p-4 rounded-2xl bg-gradient-to-br ${topic.bg} border ${topic.border} hover:shadow-md hover:-translate-y-0.5 transition-all group flex flex-col`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${topic.accent} flex items-center justify-center text-xl mb-3 shadow group-hover:scale-110 transition-transform`}>
                      {topic.icon}
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{topic.title}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">{topic.question}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 5 Defense Systems */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm ring-1 ring-gray-100 dark:ring-gray-700 p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-500" />
                5 Defense Systems
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-start gap-1.5">
                <span>💡</span>
                <span>Click any system to ask the AI about it.</span>
              </p>
              <div className="space-y-1.5">
                {Object.values(DefenseSystem).map((system) => {
                  const info = DEFENSE_SYSTEMS[system];
                  return (
                    <button
                      key={system}
                      onClick={() => setQuickQuestion(`Tell me about ${info.displayName} and which foods support it`)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl ${info.bgColor} hover:shadow-sm hover:scale-[1.01] transition-all group flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{info.icon}</span>
                        <span className={`text-sm font-medium ${info.textColor}`}>{info.displayName}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Popular Questions */}
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-green-950 to-teal-950 rounded-2xl p-5 text-white">
              <div className="absolute -top-6 -right-6 w-28 h-28 bg-green-500/20 rounded-full blur-2xl pointer-events-none" />
              <h3 className="relative text-sm font-bold text-green-300 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Popular Questions
              </h3>
              <div className="relative space-y-2.5">
                {popularQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQuickQuestion(q)}
                    className="w-full text-left flex items-start gap-3 group"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-teal-500 text-white text-[10px] font-bold flex items-center justify-center mt-0.5 shadow-lg shadow-green-500/30">
                      {i + 1}
                    </span>
                    <span className="text-xs text-green-100/80 group-hover:text-white transition-colors leading-relaxed group-hover:underline underline-offset-2">
                      {q}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Related Resources */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm ring-1 ring-gray-100 dark:ring-gray-700 p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Related Resources</h3>
              <div className="space-y-1.5">
                {[
                  { href: '/recipes', icon: <ChefHat className="w-4 h-4 text-green-500" />, label: 'Browse Recipes' },
                  { href: '/learn', icon: <BookOpen className="w-4 h-4 text-teal-500" />, label: 'Learn 5x5x5' },
                  { href: '/meal-planner', icon: <Calendar className="w-4 h-4 text-emerald-500" />, label: 'Meal Planner' },
                ].map(({ href, icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      {icon}
                      <span className="text-sm font-medium text-gray-800 dark:text-white">{label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
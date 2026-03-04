'use client';

import Link from 'next/link';
import {
  Sparkles,
  ChefHat,
  Target,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Utensils,
  Sunrise,
  Sun,
  Moon,
  Bot,
  BookOpen,
  Users,
} from 'lucide-react';

interface EmptyStateWelcomeProps {
  /** True when the user has logged meals on previous days but nothing today */
  isReturningUser?: boolean;
  /** First name or full name pulled from session */
  userName?: string | null;
}

function getTimeOfDay(): { greeting: string; Icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour < 12) return { greeting: 'Good morning', Icon: Sunrise as typeof Sun };
  if (hour < 17) return { greeting: 'Good afternoon', Icon: Sun };
  return { greeting: 'Good evening', Icon: Moon as typeof Sun };
}

const ACTION_CARDS = [
  {
    href: '/advisor',
    Icon: Bot,
    gradient: 'from-violet-500 to-purple-600',
    title: 'AI Health Advisor',
    description: 'Get personalized nutrition advice and answers from your AI wellness coach.',
    cta: 'Ask the advisor',
  },
  {
    href: '/learn',
    Icon: BookOpen,
    gradient: 'from-amber-500 to-orange-500',
    title: 'Learn the 5x5x5 System',
    description: 'Dive into the science behind Dr. Li\'s framework and understand each defense system.',
    cta: 'Start learning',
  },
  {
    href: '/community',
    Icon: Users,
    gradient: 'from-teal-500 to-emerald-500',
    title: 'Join the Community',
    description: 'Connect with others on the same journey, share recipes, and stay motivated.',
    cta: 'Explore community',
  },
];

const STEPS = [
  {
    num: 1,
    Icon: ChefHat,
    title: 'Generate Your First Recipe',
    desc: 'Let our AI craft a personalized recipe based on your nutritional profile and health goals.',
    href: '/recipes/ai-generate',
    cta: 'Start Cooking',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    btnBg: 'bg-purple-500 hover:bg-purple-600',
    hoverRow: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
  },
  {
    num: 2,
    Icon: Calendar,
    title: 'Build Your Weekly Meal Plan',
    desc: 'Plan an entire week of balanced, 5x5x5-aligned meals with one click.',
    href: '/meal-planner',
    cta: 'Plan My Week',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    btnBg: 'bg-emerald-500 hover:bg-emerald-600',
    hoverRow: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
  },
  {
    num: 3,
    Icon: Utensils,
    title: 'Browse & Log from the Recipe Library',
    desc: 'Explore hundreds of 5x5x5-aligned recipes — find one you like and log it directly to your daily tracker.',
    href: '/recipes',
    cta: 'Browse Recipes',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    btnBg: 'bg-blue-500 hover:bg-blue-600',
    hoverRow: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
  },
];

function ActionCards() {
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {ACTION_CARDS.map(({ href, Icon, gradient, title, description, cta }) => (
        <Link
          key={href}
          href={href}
          className={`group relative overflow-hidden bg-gradient-to-br ${gradient} rounded-xl shadow-lg p-5 text-white hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5`}
        >
          {/* decorative circle */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />
          <Icon className="w-7 h-7 mb-3 relative" />
          <h4 className="text-base font-bold mb-1 relative">{title}</h4>
          <p className="text-sm text-white/80 mb-4 leading-snug relative">{description}</p>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold group-hover:gap-3 transition-all relative">
            {cta} <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   RETURNING USER  — no activity today, but has history
───────────────────────────────────────────────────────────── */
function ReturningUserEmpty({ userName }: { userName?: string | null }) {
  const { greeting, Icon: TimeIcon } = getTimeOfDay();
  const firstName = userName?.split(' ')[0] ?? null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-2xl shadow-2xl text-white">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-40 translate-x-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full translate-y-32 -translate-x-32 pointer-events-none" />

        <div className="relative p-8 md:p-10">
          <div className="flex items-center gap-2 mb-2 text-white/60">
            <TimeIcon className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">{greeting}</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
            {firstName ? `${greeting}, ${firstName}!` : `${greeting}!`}
          </h2>
          <p className="text-lg text-white/80 mb-7 max-w-xl">
            Today is a fresh start — no meals logged yet. Pick up where you left off or try something new.
          </p>

          {/* 5x5x5 mini pillars */}
          <div className="grid grid-cols-3 gap-3 max-w-sm">
            {[
              { v: '5', l: 'Defense Systems' },
              { v: '5', l: 'Meal Times' },
              { v: '5', l: 'Foods per System' },
            ].map(({ v, l }) => (
              <div key={l} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{v}</div>
                <div className="text-[11px] text-white/65 mt-0.5 leading-tight">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What would you like to do today? */}
      <div>
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
          What would you like to do today?
        </p>
        <ActionCards />
      </div>

      {/* Tip / info bar */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
        <div className="flex gap-3 items-start">
          <CheckCircle2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">
            <strong>Tip:</strong> Even on quieter days, logging a single meal helps maintain your streak and gives the AI better recommendations tomorrow.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FIRST-TIME USER  — no history at all
───────────────────────────────────────────────────────────── */
function FirstTimeWelcome() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-40 translate-x-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full translate-y-32 -translate-x-32 pointer-events-none" />

        <div className="relative p-8 md:p-12">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/75">Welcome</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
            Start Your Wellness Journey
          </h2>
          <p className="text-lg text-white/85 mb-8 max-w-lg leading-relaxed">
            Join thousands of people activating their body&apos;s natural defense systems through smart, intentional eating — it all starts today.
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-sm">
            {[
              { v: '5', l: 'Defense Systems' },
              { v: '5', l: 'Meal Times' },
              { v: '5', l: 'Foods per System' },
            ].map(({ v, l }) => (
              <div key={l} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{v}</div>
                <div className="text-[11px] text-white/65 mt-0.5 leading-tight">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3-step guide */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-500" />
          Get started in 3 simple steps
        </h3>
        <div className="space-y-3">
          {STEPS.map(({ num, Icon, title, desc, href, cta, bg, text, btnBg, hoverRow }) => (
            <div
              key={num}
              className={`flex gap-4 items-start p-4 rounded-xl transition-colors ${hoverRow} group`}
            >
              <div className={`flex-shrink-0 w-11 h-11 ${bg} rounded-full flex items-center justify-center ${text} font-bold text-base`}>
                {num}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">{desc}</p>
                <Link
                  href={href}
                  className={`inline-flex items-center gap-2 ${btnBg} text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3-up action cards */}
      <div>
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
          Jump right in
        </p>
        <ActionCards />
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   EXPORT
───────────────────────────────────────────────────────────── */
export default function EmptyStateWelcome({ isReturningUser = false, userName }: EmptyStateWelcomeProps) {
  if (isReturningUser) {
    return <ReturningUserEmpty userName={userName} />;
  }
  return <FirstTimeWelcome />;
}

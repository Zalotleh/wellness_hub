// components/layout/Navbar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useFeatureAccess, useLimit } from '@/hooks/useFeatureAccess';
import { TierBadge } from '@/components/features/FeatureGate';
import {
  Heart,
  ChefHat,
  TrendingUp,
  BookOpen,
  Users,
  Sparkles,
  User,
  LogOut,
  Settings,
  Menu,
  X,
  MessageCircle,
  Calendar,
  ShoppingCart,
  Bookmark,
  Crown,
  AlertCircle,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { tier, isTrialing, canUse } = useFeatureAccess();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Mock usage data - in real app, fetch from API
  const userMealPlans = ((session?.user as any)?.mealPlansThisMonth) || 0;
  const userAIQuestions = ((session?.user as any)?.aiQuestionsThisMonth) || 0;

  const mealPlanLimit = useLimit('meal_plans_per_month', userMealPlans);
  const aiLimit = useLimit('ai_questions_per_month', userAIQuestions);

  const navLinks = [
    { href: '/recipes', label: 'Recipes', icon: ChefHat },
    { href: '/meal-planner', label: 'Meal Planner', icon: Calendar },
    { href: '/saved-plans', label: 'Saved Plans', icon: Bookmark },
    { href: '/shopping-lists', label: 'Shopping Lists', icon: ShoppingCart },
    { href: '/progress', label: 'Progress', icon: TrendingUp },
    { href: '/advisor', label: 'AI Advisor', icon: MessageCircle },
    { href: '/learn', label: 'Learn 5x5x5', icon: BookOpen },
    { href: '/community', label: 'Community', icon: Users },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <nav className="bg-white shadow-md border-b-2 border-green-500 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/recipes" className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 p-2 rounded-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-gray-800">5x5x5 Wellness</span>
              {/* <span className="block text-xs text-gray-600">Eat to Beat Disease</span> */}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Tier Badge and Upgrade Button */}
            {status === 'authenticated' && session?.user && (
              <div className="hidden xl:flex items-center space-x-3">
                <TierBadge />
                {tier === 'FREE' && !isTrialing && (
                  <Link
                    href="/upgrade"
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all font-medium text-sm"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Upgrade to Premium</span>
                  </Link>
                )}
              </div>
            )}

            {/* Usage Limits Badge */}
            {status === 'authenticated' && session?.user && tier === 'FREE' && (
              <div className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                <div className="flex items-center space-x-1 text-xs">
                  <Calendar className="w-3 h-3 text-gray-600" />
                  <span className="text-gray-700">
                    {mealPlanLimit.remaining}/{mealPlanLimit.maxLimit}
                  </span>
                </div>
                <div className="w-px h-4 bg-gray-300" />
                <div className="flex items-center space-x-1 text-xs">
                  <MessageCircle className="w-3 h-3 text-gray-600" />
                  <span className="text-gray-700">
                    {aiLimit.remaining}/{aiLimit.maxLimit}
                  </span>
                </div>
                {(mealPlanLimit.isApproachingLimit || aiLimit.isApproachingLimit) && (
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                )}
              </div>
            )}

            {/* AI Generate Button */}
            <Link
              href="/recipes/ai-generate"
              className="hidden xl:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Generate</span>
            </Link>

            {/* User Menu */}
            {status === 'authenticated' && session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {session.user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {session.user.name}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {session.user.name}
                            </p>
                            <p className="text-xs text-gray-500">{session.user.email}</p>
                          </div>
                          <TierBadge className="ml-2" />
                        </div>
                      </div>

                      {/* Usage Stats for Free Users */}
                      {tier === 'FREE' && (
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Monthly Usage
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700">Meal Plans</span>
                              </div>
                              <span className="font-medium">
                                {mealPlanLimit.remaining}/{mealPlanLimit.maxLimit}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  mealPlanLimit.isApproachingLimit ? 'bg-amber-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${100 - mealPlanLimit.percentage}%` }}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <MessageCircle className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700">AI Questions</span>
                              </div>
                              <span className="font-medium">
                                {aiLimit.remaining}/{aiLimit.maxLimit}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  aiLimit.isApproachingLimit ? 'bg-amber-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${100 - aiLimit.percentage}%` }}
                              />
                            </div>
                          </div>

                          {!isTrialing && (
                            <Link
                              href="/upgrade"
                              className="flex items-center justify-center space-x-2 w-full mt-3 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all font-medium text-sm"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <Crown className="w-4 h-4" />
                              <span>Upgrade to Premium</span>
                            </Link>
                          )}
                        </div>
                      )}

                      <Link
                        href="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        href="/settings"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>

                      <hr className="my-1" />

                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {showMobileMenu ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden py-4 border-t border-gray-200">
            {/* Mobile Usage Stats for Free Users */}
            {status === 'authenticated' && session?.user && tier === 'FREE' && (
              <div className="px-4 py-3 mb-3 bg-gray-50 rounded-lg mx-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Monthly Usage
                  </h4>
                  <TierBadge />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-xs mb-1">
                      <Calendar className="w-3 h-3 text-gray-600" />
                      <span className="text-gray-700">Meal Plans</span>
                    </div>
                    <div className="text-sm font-medium">
                      {mealPlanLimit.remaining}/{mealPlanLimit.maxLimit}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div 
                        className={`h-1 rounded-full ${
                          mealPlanLimit.isApproachingLimit ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${100 - mealPlanLimit.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-xs mb-1">
                      <MessageCircle className="w-3 h-3 text-gray-600" />
                      <span className="text-gray-700">AI Questions</span>
                    </div>
                    <div className="text-sm font-medium">
                      {aiLimit.remaining}/{aiLimit.maxLimit}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div 
                        className={`h-1 rounded-full ${
                          aiLimit.isApproachingLimit ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${100 - aiLimit.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
                {!isTrialing && (
                  <Link
                    href="/upgrade"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center justify-center space-x-2 w-full mt-3 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all font-medium text-sm"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Upgrade to Premium</span>
                  </Link>
                )}
              </div>
            )}

            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive(link.href)
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              <Link
                href="/recipes/ai-generate"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white mt-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>AI Generate Recipe</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
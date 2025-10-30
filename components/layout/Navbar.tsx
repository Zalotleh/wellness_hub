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

  // Debug: Log current tier (remove in production)
  if (process.env.NODE_ENV === 'development' && session?.user) {
    console.log('Navbar tier:', tier, 'user:', (session.user as any)?.subscriptionTier);
  }

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
            {/* Upgrade Buttons Only */}
            {status === 'authenticated' && session?.user && (
              <div className="hidden xl:flex items-center space-x-3">
                {tier === 'FREE' && !isTrialing && (
                  <Link
                    href="/pricing"
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all font-medium text-sm"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Upgrade to Premium</span>
                  </Link>
                )}
                {String(tier) === 'PREMIUM' && (
                  <Link
                    href="/subscription/manage"
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium text-sm"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Premium Plan</span>
                  </Link>
                )}
                {String(tier) === 'FAMILY' && (
                  <Link
                    href="/subscription/manage"
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all font-medium text-sm"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Family Plan</span>
                  </Link>
                )}
              </div>
            )}

            {/* Usage Limits Badge - Enhanced */}
            {status === 'authenticated' && session?.user && tier === 'FREE' && (
              <div className="hidden lg:flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                {/* Meal Plans Usage */}
                <div className="flex flex-col items-center space-y-1 group relative">
                  <div className="flex items-center space-x-1">
                    <Calendar className={`w-3 h-3 ${
                      typeof mealPlanLimit.maxLimit === 'number' && mealPlanLimit.currentUsage >= mealPlanLimit.maxLimit 
                        ? 'text-red-500' : 'text-blue-600'
                    }`} />
                    <span className={`text-xs font-medium ${
                      typeof mealPlanLimit.maxLimit === 'number' && mealPlanLimit.currentUsage >= mealPlanLimit.maxLimit 
                        ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      {mealPlanLimit.maxLimit === Infinity ? 'Unlimited' : `${mealPlanLimit.currentUsage}/${mealPlanLimit.maxLimit}`}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium">Meal Plans</div>
                  {/* Progress bar */}
                  {typeof mealPlanLimit.maxLimit === 'number' && mealPlanLimit.maxLimit !== Infinity && (
                    <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          mealPlanLimit.currentUsage >= mealPlanLimit.maxLimit 
                            ? 'bg-red-500' 
                            : mealPlanLimit.isApproachingLimit 
                              ? 'bg-amber-500' 
                              : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, (mealPlanLimit.currentUsage / mealPlanLimit.maxLimit) * 100)}%` }}
                      />
                    </div>
                  )}
                  {/* Tooltip */}
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block z-50">
                    <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      Meal Plans Used This Month
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                    </div>
                  </div>
                </div>

                <div className="w-px h-8 bg-blue-200" />

                {/* AI Questions Usage */}
                <div className="flex flex-col items-center space-y-1 group relative">
                  <div className="flex items-center space-x-1">
                    <MessageCircle className={`w-3 h-3 ${
                      typeof aiLimit.maxLimit === 'number' && aiLimit.currentUsage >= aiLimit.maxLimit 
                        ? 'text-red-500' : 'text-purple-600'
                    }`} />
                    <span className={`text-xs font-medium ${
                      typeof aiLimit.maxLimit === 'number' && aiLimit.currentUsage >= aiLimit.maxLimit 
                        ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      {aiLimit.maxLimit === Infinity ? 'Unlimited' : `${aiLimit.currentUsage}/${aiLimit.maxLimit}`}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium">AI Questions</div>
                  {/* Progress bar */}
                  {typeof aiLimit.maxLimit === 'number' && aiLimit.maxLimit !== Infinity && (
                    <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          aiLimit.currentUsage >= aiLimit.maxLimit 
                            ? 'bg-red-500' 
                            : aiLimit.isApproachingLimit 
                              ? 'bg-amber-500' 
                              : 'bg-purple-500'
                        }`}
                        style={{ width: `${Math.min(100, (aiLimit.currentUsage / aiLimit.maxLimit) * 100)}%` }}
                      />
                    </div>
                  )}
                  {/* Tooltip */}
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block z-50">
                    <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      AI Questions Asked This Month
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                    </div>
                  </div>
                </div>

                {/* Warning indicator */}
                {((typeof mealPlanLimit.maxLimit === 'number' && mealPlanLimit.currentUsage >= mealPlanLimit.maxLimit) || 
                  (typeof aiLimit.maxLimit === 'number' && aiLimit.currentUsage >= aiLimit.maxLimit)) && (
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                  </div>
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
                                {mealPlanLimit.maxLimit === Infinity ? 'Unlimited' : `${mealPlanLimit.currentUsage}/${mealPlanLimit.maxLimit}`}
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
                                {aiLimit.maxLimit === Infinity ? 'Unlimited' : `${aiLimit.currentUsage}/${aiLimit.maxLimit}`}
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

                          {!isTrialing && tier === 'FREE' && (
                            <Link
                              href="/pricing"
                              className="flex items-center justify-center space-x-2 w-full mt-3 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all font-medium text-sm"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <Crown className="w-4 h-4" />
                              <span>Upgrade to Premium</span>
                            </Link>
                          )}
                          {(String(tier) === 'PREMIUM' || String(tier) === 'FAMILY') && (
                            <Link
                              href="/subscription/manage"
                              className={`flex items-center justify-center space-x-2 w-full mt-3 px-3 py-2 text-white rounded-lg transition-all font-medium text-sm ${
                                String(tier) === 'PREMIUM' 
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                                  : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                              }`}
                              onClick={() => setShowUserMenu(false)}
                            >
                              <Crown className="w-4 h-4" />
                              <span>{String(tier) === 'PREMIUM' ? 'Premium Plan' : 'Family Plan'}</span>
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
            {/* Mobile Usage Stats for Free Users - Enhanced */}
            {status === 'authenticated' && session?.user && tier === 'FREE' && (
              <div className="px-4 py-4 mb-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg mx-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    🏃‍♂️ Monthly Usage Limits
                  </h4>
                  <TierBadge />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                    <div className="flex items-center justify-center space-x-1 text-xs mb-2">
                      <Calendar className={`w-4 h-4 ${
                        typeof mealPlanLimit.maxLimit === 'number' && mealPlanLimit.currentUsage >= mealPlanLimit.maxLimit 
                          ? 'text-red-500' : 'text-blue-600'
                      }`} />
                      <span className="text-gray-700 font-medium">Meal Plans</span>
                    </div>
                    <div className={`text-lg font-bold mb-2 ${
                      typeof mealPlanLimit.maxLimit === 'number' && mealPlanLimit.currentUsage >= mealPlanLimit.maxLimit 
                        ? 'text-red-600' : 'text-gray-800'
                    }`}>
                      {mealPlanLimit.maxLimit === Infinity ? 'Unlimited' : `${mealPlanLimit.currentUsage}/${mealPlanLimit.maxLimit}`}
                    </div>
                    {/* Enhanced Progress bar */}
                    {typeof mealPlanLimit.maxLimit === 'number' && mealPlanLimit.maxLimit !== Infinity && (
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            mealPlanLimit.currentUsage >= mealPlanLimit.maxLimit 
                              ? 'bg-red-500' 
                              : mealPlanLimit.isApproachingLimit 
                                ? 'bg-amber-500' 
                                : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, (mealPlanLimit.currentUsage / mealPlanLimit.maxLimit) * 100)}%` }}
                        />
                      </div>
                    )}
                    {typeof mealPlanLimit.maxLimit === 'number' && mealPlanLimit.currentUsage >= mealPlanLimit.maxLimit && (
                      <div className="text-xs text-red-600 mt-1 font-medium">Limit Reached!</div>
                    )}
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
                    <div className="flex items-center justify-center space-x-1 text-xs mb-2">
                      <MessageCircle className={`w-4 h-4 ${
                        typeof aiLimit.maxLimit === 'number' && aiLimit.currentUsage >= aiLimit.maxLimit 
                          ? 'text-red-500' : 'text-purple-600'
                      }`} />
                      <span className="text-gray-700 font-medium">AI Questions</span>
                    </div>
                    <div className={`text-lg font-bold mb-2 ${
                      typeof aiLimit.maxLimit === 'number' && aiLimit.currentUsage >= aiLimit.maxLimit 
                        ? 'text-red-600' : 'text-gray-800'
                    }`}>
                      {aiLimit.maxLimit === Infinity ? 'Unlimited' : `${aiLimit.currentUsage}/${aiLimit.maxLimit}`}
                    </div>
                    {/* Enhanced Progress bar */}
                    {typeof aiLimit.maxLimit === 'number' && aiLimit.maxLimit !== Infinity && (
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            aiLimit.currentUsage >= aiLimit.maxLimit 
                              ? 'bg-red-500' 
                              : aiLimit.isApproachingLimit 
                                ? 'bg-amber-500' 
                                : 'bg-purple-500'
                          }`}
                          style={{ width: `${Math.min(100, (aiLimit.currentUsage / aiLimit.maxLimit) * 100)}%` }}
                        />
                      </div>
                    )}
                    {typeof aiLimit.maxLimit === 'number' && aiLimit.currentUsage >= aiLimit.maxLimit && (
                      <div className="text-xs text-red-600 mt-1 font-medium">Limit Reached!</div>
                    )}
                  </div>
                </div>
                {!isTrialing && tier === 'FREE' && (
                  <Link
                    href="/pricing"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center justify-center space-x-2 w-full mt-3 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all font-medium text-sm"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Upgrade to Premium</span>
                  </Link>
                )}
                {(String(tier) === 'PREMIUM' || String(tier) === 'FAMILY') && (
                  <Link
                    href="/subscription/manage"
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center justify-center space-x-2 w-full mt-3 px-3 py-2 text-white rounded-lg transition-all font-medium text-sm ${
                      String(tier) === 'PREMIUM' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                        : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                    }`}
                  >
                    <Crown className="w-4 h-4" />
                    <span>{String(tier) === 'PREMIUM' ? 'Premium Plan' : 'Family Plan'}</span>
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
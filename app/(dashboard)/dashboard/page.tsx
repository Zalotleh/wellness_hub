'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useProgress, useProgressStats } from '@/hooks/useProgress';
import { useProgressDays } from '@/hooks/useProgressDays';
import MealTimeTracker from '@/components/progress/MealTimeTracker';
import SystemProgressChart from '@/components/progress/SystemProgressChart';
import ShoppingListsSummary from '@/components/progress/ShoppingListsSummary';
import OverallScoreCard from '@/components/progress/OverallScoreCard';
import TimeFilter, { ViewType } from '@/components/progress/TimeFilter';
import SmartActionsPanel from '@/components/progress/SmartActionsPanel';
import { RecommendationCards } from '@/components/progress/RecommendationCards';
import { ProgressErrorBoundary } from '@/components/progress/ProgressErrorBoundary';
import EmptyStateWelcome from '@/components/progress/EmptyStateWelcome';
import WeeklyProgressView from '@/components/progress/WeeklyProgressView';
import { isToday, format } from 'date-fns';
import { Info, TrendingUp, Heart, Sparkles } from 'lucide-react';
import Footer from '@/components/layout/Footer';

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function ProgressPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  // Initialise date + view from URL query params (e.g. ?date=2026-03-04 from Weekly view)
  const initialDate = (() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  })();

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [view, setView] = useState<ViewType>('daily');
  const [showInfo, setShowInfo] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Force component refresh

  const { progress, dailyProgress, loading: progressLoading, logFood, refetch: refetchProgress } = useProgress(selectedDate);
  const { stats, loading: statsLoading, refetch: refetchStats } = useProgressStats('week');
  const { daysWithProgress } = useProgressDays();

  const userName = (session?.user as { name?: string | null } | undefined)?.name ?? null;

  // React to ?date= param changes (e.g. user is already on dashboard in weekly view
  // and clicks "View Day Details" — soft navigation updates searchParams without remount)
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        setSelectedDate(parsed);
        setView('daily');
      }
      // Strip the param from the URL without triggering another navigation
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  // Fetch recommendations only for today
  useEffect(() => {
    if (isToday(selectedDate)) {
      fetchRecommendations();
    } else {
      // Clear recommendations when viewing past dates
      setRecommendations([]);
      setLoadingRecs(false);
    }
  }, [selectedDate]);

  // Refetch data when arriving from another page with updates
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('updated')) {
      refetchProgress();
      fetchRecommendations();
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      // Add timestamp to bust cache and get fresh data
      const response = await fetch(`/api/recommendations?t=${Date.now()}`);
      if (response.ok) {
        const { data } = await response.json();
        setRecommendations(data || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleLogFood = async (system: any, foods: string[], notes?: string) => {
    await logFood(system, foods, notes);
  };

  const handleFoodLogSuccess = async () => {
    // Refresh progress data after successful food log
    await refetchProgress();
    await fetchRecommendations();
    // Force all components to refresh by updating key
    setRefreshKey(prev => prev + 1);
  };

  // Check if user has any progress data by checking if any defense system has foods logged TODAY
  const hasAnyProgress = dailyProgress && Object.values(dailyProgress.systems).some(system => system.count > 0);

  // Check if user has ANY historical progress (not just today)
  const hasHistoricalProgress = !!(daysWithProgress && daysWithProgress.length > 0);

  // Show empty/welcome state whenever today has no logged activity —
  // but differentiate between a brand-new user vs a returning one (isReturningUser).
  const shouldShowWelcome = !progressLoading && !hasAnyProgress && isToday(selectedDate);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">

      {/* ── EMPTY / WELCOME STATE ─────────────────────────────────────────── */}
      {shouldShowWelcome ? (
        <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Slim top bar with page identity + info toggle */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  My Health Dashboard
                </span>
              </div>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                aria-label="About the 5x5x5 framework"
              >
                <Info className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {showInfo && (
              <div className="mb-6 p-5 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-200 dark:border-purple-800 rounded-xl text-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📊 Why the 5x5x5 Framework Matters</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Based on Dr. William Li&apos;s research, the framework activates the body&apos;s natural defense systems through food:
                </p>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                  <li><strong>5 Defense Systems</strong> — Angiogenesis, Regeneration, Microbiome, DNA Protection, Immunity</li>
                  <li><strong>5 Foods per System</strong> — at least 5 different supporting foods per system daily</li>
                  <li><strong>5 Meal Times</strong> — distribute across meals and snacks throughout the day</li>
                </ul>
              </div>
            )}

            <EmptyStateWelcome
              isReturningUser={hasHistoricalProgress}
              userName={userName}
            />
          </div>
        </div>
      ) : (
        /* ── ACTIVE DASHBOARD STATE ─────────────────────────────────────── */
        <>
          {/* ── HERO SECTION (mirrors Welcome page pattern) ────────────── */}
          <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
            {/* Decorative blobs — same technique as the Welcome/marketing page */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-10 left-10 w-64 h-64 bg-green-300 dark:bg-green-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob" />
              <div className="absolute top-20 right-10 w-64 h-64 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-2000" />
              <div className="absolute -bottom-8 left-1/2 w-64 h-64 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-4000" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-14">
              {/* Greeting row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl shadow-lg">
                    <Heart className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider mb-0.5">
                      {getTimeGreeting()}{userName ? `, ${userName.split(' ')[0]}` : ''}
                    </p>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                      Your{' '}
                      <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        Health Dashboard
                      </span>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {isToday(selectedDate) ? 'Today — ' : ''}{format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="p-2.5 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm"
                  aria-label="About the 5x5x5 framework"
                >
                  <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Info panel */}
              {showInfo && (
                <div className="mt-6 p-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-purple-200 dark:border-purple-800 rounded-2xl shadow-lg">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Why the 5x5x5 Framework Matters
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    Based on Dr. William Li&apos;s groundbreaking research, the 5x5x5 framework helps you activate your body&apos;s natural defense systems through food. Each &ldquo;5&rdquo; represents:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                      <span><strong>5 Defense Systems:</strong> Angiogenesis, Regeneration, Microbiome, DNA Protection, and Immunity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                      <span><strong>5 Foods per System:</strong> Eat at least 5 different foods that support each defense system daily</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 font-bold">•</span>
                      <span><strong>5 Times per Day:</strong> Distribute these foods across multiple meals and snacks throughout the day</span>
                    </li>
                  </ul>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 font-medium">
                    🌟 Aim for 80+ overall score for optimal health benefits!
                  </p>
                </div>
              )}

              {/* Time Filter — placed inside the hero, below the title */}
              <div className="mt-6">
                <TimeFilter
                  view={view}
                  date={selectedDate}
                  onViewChange={setView}
                  onDateChange={setSelectedDate}
                />
              </div>
            </div>
          </section>

          {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
          <div className="max-w-7xl mx-auto px-4 pb-10">

            {/* Overall Score Card — surfaces just below the hero */}
            {view === 'daily' && (hasAnyProgress || !isToday(selectedDate)) && (
              <div className="-mt-4 mb-8">
                <ProgressErrorBoundary>
                  <OverallScoreCard
                    date={selectedDate}
                    className="horizontal"
                    key={`score-${refreshKey}`}
                  />
                </ProgressErrorBoundary>
              </div>
            )}

            {/* Content */}
            <div className="space-y-10">

              {/* ── DAILY VIEW ──────────────────────────────────────────── */}
              {view === 'daily' && (
                <>
                  {(hasAnyProgress || !isToday(selectedDate)) && (
                    <>
                      {/* Smart Actions — styled section */}
                      {isToday(selectedDate) && (
                        <section>
                          <div className="mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                                <Sparkles className="w-4 h-4 text-white" />
                              </span>
                              Next Best Action
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 ml-9">
                              AI-powered priority recommendation based on your current progress
                            </p>
                          </div>
                          <ProgressErrorBoundary>
                            <SmartActionsPanel date={selectedDate} />
                          </ProgressErrorBoundary>
                        </section>
                      )}

                      {/* Recommendations — styled like the features grid on the Welcome page */}
                      {isToday(selectedDate) && (
                        <section>
                          <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
                                <TrendingUp className="w-4 h-4 text-white" />
                              </span>
                              Personalized Recommendations
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 ml-9">
                              Action items tailored to strengthen your defense systems today
                            </p>
                          </div>
                          <ProgressErrorBoundary>
                            {!loadingRecs ? (
                              <RecommendationCards
                                recommendations={recommendations}
                                onRefresh={fetchRecommendations}
                              />
                            ) : (
                              <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl shadow-lg p-10 text-center">
                                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
                                <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
                                  Loading your recommendations…
                                </p>
                              </div>
                            )}
                          </ProgressErrorBoundary>
                        </section>
                      )}

                      {/* Meal Time Tracker */}
                      <section>
                        <div className="mb-4">
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Meal Time Tracker
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Log what you ate across all 5 meal times today
                          </p>
                        </div>
                        <ProgressErrorBoundary>
                          <MealTimeTracker
                            date={selectedDate}
                            key={`meals-${refreshKey}`}
                          />
                        </ProgressErrorBoundary>
                      </section>

                      {/* Defense Systems Progress */}
                      <section>
                        <div className="mb-4">
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Defense Systems Coverage
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            How well you are activating each of the 5 natural defense systems
                          </p>
                        </div>
                        <ProgressErrorBoundary>
                          <SystemProgressChart
                            date={selectedDate}
                            key={`systems-${refreshKey}`}
                          />
                        </ProgressErrorBoundary>
                      </section>

                      {/* Shopping Lists Summary */}
                      <section>
                        <div className="mb-4">
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Shopping Lists
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Your active shopping lists to keep the right ingredients on hand
                          </p>
                        </div>
                        <ProgressErrorBoundary>
                          <ShoppingListsSummary key={`shopping-${refreshKey}`} />
                        </ProgressErrorBoundary>
                      </section>
                    </>
                  )}
                </>
              )}

              {/* ── WEEKLY VIEW ─────────────────────────────────────────── */}
              {view === 'weekly' && (
                <ProgressErrorBoundary>
                  <WeeklyProgressView
                    selectedWeek={selectedDate}
                    onWeekChange={setSelectedDate}
                  />
                </ProgressErrorBoundary>
              )}

              {/* ── MONTHLY VIEW ────────────────────────────────────────── */}
              {view === 'monthly' && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-blue-100 dark:border-gray-700 shadow-lg p-10">
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl shadow-lg mb-6">
                      <span className="text-3xl">📅</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      Monthly View Coming Soon
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2 max-w-md mx-auto">
                      We&apos;re building comprehensive monthly analytics and trend visualizations.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      For now, use the weekly view to track your progress over time.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

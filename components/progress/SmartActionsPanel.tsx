'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  ChefHat,
  Calendar,
  ShoppingCart,
  CheckCircle2,
  X,
  TrendingUp,
  AlertCircle,
  Info,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBreakpoint, getTouchTargetClass, getSpacing } from '@/lib/utils/mobile-responsive';

interface SmartRecommendation {
  id: string;
  type: 'RECIPE' | 'MEAL_PLAN' | 'FOOD_SUGGESTION' | 'WORKFLOW_STEP';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  title: string;
  description: string;
  reasoning: string;
  actionLabel: string;
  actionUrl: string;
  actionData?: any;
  targetSystem?: string;
  targetMealTime?: string;
  expiresAt: string;
  createdAt: string;
}

interface SmartActionsPanelProps {
  date?: Date;
  className?: string;
}

export default function SmartActionsPanel({ date, className }: SmartActionsPanelProps) {
  const router = useRouter();
  const [recommendation, setRecommendation] = useState<SmartRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  
  const breakpoint = useBreakpoint();
  const touchTargetClass = getTouchTargetClass(breakpoint);
  const spacing = getSpacing(breakpoint);

  useEffect(() => {
    fetchRecommendation();
  }, [date]);

  const fetchRecommendation = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (date) {
        params.set('date', date.toISOString());
      }

      const response = await fetch(`/api/recommendations/next-action?${params}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch recommendation');
      }

      const data = await response.json();
      setRecommendation(data.recommendation || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!recommendation) return;

    try {
      setActioning(true);

      // Don't mark as ACTED_ON yet - wait until user actually completes the action
      // Just navigate to the action URL with tracking params
      
      // Build action URL with query params
      const url = new URL(recommendation.actionUrl, window.location.origin);
      
      if (recommendation.actionData) {
        // Add action data as query params
        Object.entries(recommendation.actionData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            // Serialize arrays as JSON for proper parsing
            if (Array.isArray(value)) {
              url.searchParams.set(key, JSON.stringify(value));
            } else {
              url.searchParams.set(key, String(value));
            }
          }
        });
      }

      // Add source tracking
      url.searchParams.set('from', 'recommendation');
      url.searchParams.set('recId', recommendation.id);

      // Navigate to the action URL
      router.push(url.pathname + url.search);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to navigate');
    } finally {
      setActioning(false);
    }
  };

  const handleDismiss = async () => {
    if (!recommendation) return;

    try {
      setActioning(true);

      const response = await fetch(`/api/recommendations/${recommendation.id}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss recommendation');
      }

      // Fetch next recommendation
      await fetchRecommendation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss');
    } finally {
      setActioning(false);
    }
  };

  const getIcon = () => {
    if (!recommendation) return <Lightbulb className="h-5 w-5" />;

    switch (recommendation.type) {
      case 'RECIPE':
        return <ChefHat className="h-5 w-5" />;
      case 'MEAL_PLAN':
        return <Calendar className="h-5 w-5" />;
      case 'FOOD_SUGGESTION':
        return <ShoppingCart className="h-5 w-5" />;
      case 'WORKFLOW_STEP':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          badge: 'bg-red-500 text-white hover:bg-red-600',
          card: 'border-red-200 bg-red-50/50',
          button: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'HIGH':
        return {
          badge: 'bg-orange-500 text-white hover:bg-orange-600',
          card: 'border-orange-200 bg-orange-50/50',
          button: 'bg-orange-600 hover:bg-orange-700 text-white',
        };
      case 'MEDIUM':
        return {
          badge: 'bg-blue-500 text-white hover:bg-blue-600',
          card: 'border-blue-200 bg-blue-50/50',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
      case 'LOW':
        return {
          badge: 'bg-gray-500 text-white hover:bg-gray-600',
          card: 'border-gray-200 bg-gray-50/50',
          button: 'bg-gray-600 hover:bg-gray-700 text-white',
        };
      default:
        return {
          badge: 'bg-primary text-primary-foreground',
          card: 'border-primary/20 bg-primary/5',
          button: 'bg-primary hover:bg-primary/90 text-primary-foreground',
        };
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!recommendation) {
    return (
      <Card className={cn('border-green-200 bg-green-50/50', className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-900">All Caught Up!</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            Great job! You&apos;re on track with your wellness goals. Keep up the excellent work!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const styles = getPriorityStyles(recommendation.priority);

  return (
    <Card className={cn(styles.card, className)}>
      <CardHeader className={spacing.card}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-0.5">{getIcon()}</div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className={breakpoint.mobile ? 'text-base' : 'text-lg'}>
                  {recommendation.title}
                </CardTitle>
                <Badge className={styles.badge}>{recommendation.priority}</Badge>
              </div>
              <CardDescription className={breakpoint.mobile ? 'text-xs' : 'text-sm'}>
                {recommendation.description}
              </CardDescription>
            </div>
          </div>
        </div>

        {/* Reasoning toggle */}
        <button
          onClick={() => setShowReasoning(!showReasoning)}
          className={cn(
            'flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2',
            touchTargetClass
          )}
        >
          <Info className="h-3 w-3" />
          {showReasoning ? 'Hide details' : 'Why this recommendation?'}
        </button>

        {showReasoning && (
          <div className="mt-2 p-3 rounded-lg bg-background/50 border text-sm text-muted-foreground">
            {recommendation.reasoning}
          </div>
        )}
      </CardHeader>

      <CardContent className={spacing.card}>
        <div className={`flex gap-2 ${breakpoint.mobile ? 'flex-col' : ''}`}>
          <Button
            onClick={handleAccept}
            disabled={actioning}
            className={cn('flex-1', styles.button, touchTargetClass)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {recommendation.actionLabel}
          </Button>
          <Button
            onClick={handleDismiss}
            disabled={actioning}
            variant="outline"
            className={cn(breakpoint.mobile ? 'w-full' : '', touchTargetClass)}
            size={breakpoint.mobile ? 'default' : 'icon'}
          >
            <X className="h-4 w-4" />
            {breakpoint.mobile && <span className="ml-2">Dismiss</span>}
          </Button>
        </div>

        {/* Target info badges */}
        {(recommendation.targetSystem || recommendation.targetMealTime) && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {recommendation.targetSystem && (
              <Badge variant="secondary" className="text-xs">
                {recommendation.targetSystem}
              </Badge>
            )}
            {recommendation.targetMealTime && (
              <Badge variant="secondary" className="text-xs">
                {recommendation.targetMealTime}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

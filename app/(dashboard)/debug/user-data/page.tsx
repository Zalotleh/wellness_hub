'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut, signIn } from 'next-auth/react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

export default function DebugUserData() {
  const { data: session, status, update } = useSession();
  const { tier, isTrialing } = useFeatureAccess();
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/user-data');
      if (response.ok) {
        const data = await response.json();
        setDebugData(data);
      } else {
        console.error('Failed to fetch debug data');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchDebugData();
    }
  }, [session]);

  const forceSessionRefresh = async () => {
    setLoading(true);
    try {
      await update(); // Force session refresh
      setTimeout(() => {
        fetchDebugData();
      }, 1000);
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to debug subscription data.</p>
          <button
            onClick={() => signIn()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Debug User Subscription Data</h1>
            <div className="flex space-x-2">
              <button
                onClick={forceSessionRefresh}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? 'Refreshing...' : 'Force Refresh Session'}
              </button>
              <button
                onClick={fetchDebugData}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
              >
                Reload Data
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-800">Session Data</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p><strong>Email:</strong> {session.user?.email}</p>
                <p><strong>Name:</strong> {session.user?.name}</p>
                <p><strong>Hook Tier:</strong> <span className="font-mono bg-gray-200 px-2 py-1 rounded">{tier}</span></p>
                <p><strong>Is Trialing:</strong> {isTrialing ? 'Yes' : 'No'}</p>
                <p><strong>Session Tier:</strong> <span className="font-mono bg-gray-200 px-2 py-1 rounded">{(session.user as any)?.subscriptionTier || 'N/A'}</span></p>
                <p><strong>Session Status:</strong> {(session.user as any)?.subscriptionStatus || 'N/A'}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-800">Database Data</h3>
              {debugData?.databaseData ? (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p><strong>Email:</strong> {debugData.databaseData.email}</p>
                  <p><strong>Name:</strong> {debugData.databaseData.name}</p>
                  <p><strong>DB Tier:</strong> <span className="font-mono bg-gray-200 px-2 py-1 rounded">{debugData.databaseData.subscriptionTier}</span></p>
                  <p><strong>DB Status:</strong> {debugData.databaseData.subscriptionStatus || 'N/A'}</p>
                  <p><strong>Trial Ends:</strong> {debugData.databaseData.trialEndsAt ? new Date(debugData.databaseData.trialEndsAt).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Meal Plans:</strong> {debugData.databaseData.mealPlansThisMonth}</p>
                  <p><strong>AI Questions:</strong> {debugData.databaseData.aiQuestionsThisMonth}</p>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600">Loading database data...</p>
                </div>
              )}
            </div>
          </div>

          {debugData && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-purple-800">Data Comparison</h3>
              <div className={`p-4 rounded-lg ${debugData.match ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'} border`}>
                <p className="font-semibold">
                  {debugData.match ? '✅ Session and Database Match' : '❌ Session and Database Mismatch'}
                </p>
                {!debugData.match && (
                  <p className="text-sm mt-2">
                    Session shows: {debugData.sessionData.sessionTier || 'N/A'} | Database shows: {debugData.databaseData.subscriptionTier}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Test Users:</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• emma@example.com → Should be FREE</p>
              <p>• john@example.com → Should be PREMIUM</p> 
              <p>• sarah@example.com → Should be FAMILY</p>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => signOut()}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
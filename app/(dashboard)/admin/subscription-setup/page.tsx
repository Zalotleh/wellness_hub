'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface TestUser {
  email: string;
  name: string;
  subscriptionTier: string;
  subscriptionStatus?: string;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  mealPlansThisMonth: number;
  aiQuestionsThisMonth: number;
}

export default function AdminSubscriptionSetup() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<TestUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (session) {
      fetchUsers();
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/set-subscription');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const setSubscription = async (email: string, tier: string) => {
    setLoading(true);
    setMessage('');

    try {
      const trialEndsAt = tier !== 'FREE' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null;

      const response = await fetch('/api/admin/set-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          subscriptionTier: tier,
          trialEndsAt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Updated ${email} to ${tier}`);
        fetchUsers(); // Refresh the list
      } else {
        const error = await response.json();
        setMessage(`❌ Error: ${error.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const setupAllTestUsers = async () => {
    setLoading(true);
    setMessage('Setting up test users...');

    try {
      // Emma -> FREE
      await setSubscription('emma@example.com', 'FREE');
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay

      // John -> PREMIUM  
      await setSubscription('john@example.com', 'PREMIUM');
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay

      // Sarah -> FAMILY
      await setSubscription('sarah@example.com', 'FAMILY');
      
      setMessage('✅ All test users configured successfully!');
    } catch (error) {
      setMessage(`❌ Error setting up users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access admin tools.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Test User Subscription Setup
          </h1>

          {message && (
            <div className={`mb-4 p-3 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}

          <div className="mb-6">
            <button
              onClick={setupAllTestUsers}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting Up...' : 'Setup All Test Users'}
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Current User Status</h2>
            
            {users.map((user) => (
              <div key={user.email} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${{
                      'FREE': 'bg-gray-100 text-gray-800',
                      'PREMIUM': 'bg-blue-100 text-blue-800',
                      'FAMILY': 'bg-purple-100 text-purple-800',
                    }[user.subscriptionTier] || 'bg-gray-100 text-gray-800'}`}>
                      {user.subscriptionTier}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                  <div>Status: {user.subscriptionStatus || 'N/A'}</div>
                  <div>Meal Plans Used: {user.mealPlansThisMonth}</div>
                  <div>AI Questions: {user.aiQuestionsThisMonth}</div>
                  <div>
                    Trial Ends: {user.trialEndsAt ? new Date(user.trialEndsAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setSubscription(user.email, 'FREE')}
                    disabled={loading}
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200 disabled:bg-gray-50"
                  >
                    Set FREE
                  </button>
                  <button
                    onClick={() => setSubscription(user.email, 'PREMIUM')}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 disabled:bg-gray-50"
                  >
                    Set PREMIUM
                  </button>
                  <button
                    onClick={() => setSubscription(user.email, 'FAMILY')}
                    disabled={loading}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm hover:bg-purple-200 disabled:bg-gray-50"
                  >
                    Set FAMILY
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Test Plan:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>emma@example.com</strong> → FREE plan (limited features)</li>
              <li>• <strong>john@example.com</strong> → PREMIUM plan (advanced features)</li>
              <li>• <strong>sarah@example.com</strong> → FAMILY plan (all features)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
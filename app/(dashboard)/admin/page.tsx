'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Users,
  FileText,
  Calendar,
  ShoppingCart,
  TrendingUp,
  Activity,
  BarChart3,
  Loader2,
  ClipboardList,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogIn,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  period: number;
  users: { total: number; active: number; new: number; byTier: Record<string, number> };
  content: { recipes: number; mealPlans: number; shoppingLists: number };
  apiUsage: { aiQuestions: number; recipeGenerations: number };
  subscriptions: Record<string, number>;
  recentActivity: {
    recipes: Array<{ id: string; title: string; createdAt: string; user: { name: string; email: string } }>;
    mealPlans: Array<{ id: string; createdAt: string; user: { name: string; email: string } }>;
  };
}

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: 'USER' | 'ADMIN';
  subscriptionTier: string;
  subscriptionStatus: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  anonymized: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  targetUserId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string } | null;
}

type Tab = 'analytics' | 'users' | 'audit-logs';

// ─── Modal: Create / Edit User ─────────────────────────────────────────────

function UserModal({
  mode,
  user,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit';
  user?: AdminUser;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'USER',
    subscriptionTier: user?.subscriptionTier || 'FREE',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const body: any = {
        name: form.name,
        email: form.email,
        role: form.role,
        subscriptionTier: form.subscriptionTier,
      };
      if (form.password) body.password = form.password;

      const res = await fetch(
        mode === 'create' ? '/api/admin/users' : `/api/admin/users/${user!.id}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save user');
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Create User' : 'Edit User'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password {mode === 'edit' && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={mode === 'create'}
              minLength={8}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan</label>
              <select
                value={form.subscriptionTier}
                onChange={(e) => setForm({ ...form, subscriptionTier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="FREE">Free</option>
                <option value="PREMIUM">Premium</option>
                <option value="FAMILY">Family</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {mode === 'create' ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────

function DeleteConfirmModal({
  user,
  onClose,
  onDeleted,
}: {
  user: AdminUser;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      onDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete User</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to delete <strong>{user.name || user.email}</strong>? This action cannot be undone.
        </p>
        {error && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Analytics ────────────────────────────────────────────────────────

function AnalyticsTab({ analytics, period, setPeriod }: { analytics: AnalyticsData; period: string; setPeriod: (v: string) => void }) {
  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{Number(value).toLocaleString()}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Users" value={analytics.users.total} color="bg-blue-500" />
        <StatCard icon={Activity} label="Active Users" value={analytics.users.active} color="bg-green-500" />
        <StatCard icon={TrendingUp} label="New Users" value={analytics.users.new} color="bg-purple-500" />
        <StatCard icon={FileText} label="Total Recipes" value={analytics.content.recipes} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Calendar} label="Meal Plans" value={analytics.content.mealPlans} color="bg-pink-500" />
        <StatCard icon={ShoppingCart} label="Shopping Lists" value={analytics.content.shoppingLists} color="bg-indigo-500" />
        <StatCard icon={BarChart3} label="AI Questions" value={analytics.apiUsage.aiQuestions} color="bg-cyan-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Users by Subscription Tier</h3>
          <div className="space-y-3">
            {Object.entries(analytics.users.byTier).map(([tier, count]) => (
              <div key={tier} className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300 font-medium">{tier}</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">API Usage</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300 font-medium">AI Questions</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.apiUsage.aiQuestions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Recipe Generations</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.apiUsage.recipeGenerations}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Latest Recipes</h4>
            <div className="space-y-2">
              {analytics.recentActivity.recipes.map((recipe) => (
                <div key={recipe.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{recipe.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    by {recipe.user.name || recipe.user.email} • {new Date(recipe.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Latest Meal Plans</h4>
            <div className="space-y-2">
              {analytics.recentActivity.mealPlans.map((plan) => (
                <div key={plan.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    Meal Plan #{plan.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    by {plan.user.name || plan.user.email} • {new Date(plan.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: User Management ──────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ type: 'create' | 'edit'; user?: AdminUser } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const tierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      FREE: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      PREMIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      FAMILY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    };
    return colors[tier] || colors.FREE;
  };

  const roleBadge = (role: string) => role === 'ADMIN'
    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {modal && (
        <UserModal
          mode={modal.type}
          user={modal.user}
          onClose={() => setModal(null)}
          onSave={fetchUsers}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={fetchUsers}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            Search
          </button>
        </form>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-left">Last Login</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{u.name || '—'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tierBadge(u.subscriptionTier)}`}>
                          {u.subscriptionTier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {u.lastLoginAt ? (
                          <span className="flex items-center gap-1">
                            <LogIn className="w-3 h-3 text-green-500" />
                            {new Date(u.lastLoginAt).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">Never</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setModal({ type: 'edit', user: u })}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            title="Edit user"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Audit Logs ───────────────────────────────────────────────────────

function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (actionFilter) params.set('action', actionFilter);
      const res = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const actionColor = (action: string) => {
    if (action === 'LOGIN') return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
    if (action.startsWith('DELETE')) return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    if (action.startsWith('CREATE')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    if (action.startsWith('UPDATE')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by action:</label>
        <select
          value={actionFilter}
          onChange={(e) => { setPage(1); setActionFilter(e.target.value); }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">All actions</option>
          <option value="LOGIN">LOGIN</option>
          <option value="CREATE_USER">CREATE_USER</option>
          <option value="UPDATE_USER">UPDATE_USER</option>
          <option value="DELETE_USER">DELETE_USER</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">When</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Target User</th>
                  <th className="px-4 py-3 text-left">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                      No audit log entries found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${actionColor(log.action)}`}>
                          {log.action === 'LOGIN' && <LogIn className="w-3 h-3" />}
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {log.user ? (
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{log.user.name || '—'}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{log.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">Unknown</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs font-mono">
                        {log.targetUserId ? log.targetUserId.slice(0, 14) + '…' : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs font-mono">
                        {log.ipAddress || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('analytics');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'ADMIN') { router.push('/'); return; }
      fetchAnalytics();
    }
  }, [status, session, router, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to fetch analytics');
      }
      setAnalytics(await res.json());
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('Unauthorized') || err.message.includes('Forbidden')) router.push('/');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || (loading && activeTab === 'analytics')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading admin dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md text-center">
          <span className="text-5xl mb-4 block">⚠️</span>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button onClick={() => router.push('/')} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'audit-logs', label: 'Audit Logs', icon: <ClipboardList className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-11">Platform management and monitoring</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm dark:border dark:border-gray-700 mb-6 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'analytics' && analytics && (
          <AnalyticsTab analytics={analytics} period={period} setPeriod={setPeriod} />
        )}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'audit-logs' && <AuditLogsTab />}
      </div>
    </div>
  );
}

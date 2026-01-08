'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Trash2, 
  AlertTriangle, 
  FileJson, 
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Shield,
  Info,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface UserConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  consentDate: string;
  updatedAt: string;
}

export default function PrivacySettings() {
  const router = useRouter();
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [consents, setConsents] = useState<UserConsent | null>(null);
  const [loadingConsents, setLoadingConsents] = useState(true);
  const [updatingConsent, setUpdatingConsent] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [consentSuccess, setConsentSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchConsents();
  }, []);

  const fetchConsents = async () => {
    try {
      setLoadingConsents(true);
      const response = await fetch('/api/user/consent');
      
      if (!response.ok) {
        throw new Error('Failed to fetch consent preferences');
      }
      
      const data = await response.json();
      setConsents(data.consent);
    } catch (error) {
      console.error('Error fetching consents:', error);
      setConsentError(error instanceof Error ? error.message : 'Failed to load consent preferences');
    } finally {
      setLoadingConsents(false);
    }
  };

  const updateConsent = async (consentType: 'analytics' | 'marketing', granted: boolean) => {
    try {
      setUpdatingConsent(consentType);
      setConsentError(null);
      setConsentSuccess(null);

      const response = await fetch('/api/user/consent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentType, granted }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update consent');
      }

      const data = await response.json();
      setConsents(data.consent);
      setConsentSuccess(`${consentType} consent ${granted ? 'granted' : 'revoked'}`);
      
      setTimeout(() => setConsentSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating consent:', error);
      setConsentError(error instanceof Error ? error.message : 'Failed to update consent');
    } finally {
      setUpdatingConsent(null);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      setExportError(null);
      setExportSuccess(false);

      const response = await fetch(`/api/user/data-export?format=${exportFormat}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wellness-hub-data-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (error) {
      console.error('Export error:', error);
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }

    try {
      setDeleting(true);
      setDeleteError(null);

      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirm: true,
          reason: deleteReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Deletion failed');
      }

      const data = await response.json();

      // Show success and log out
      alert(
        `Account deletion scheduled for ${new Date(data.deletionDate).toLocaleDateString()}. ` +
        `You have ${data.gracePeriodDays} days to cancel by logging in again.`
      );

      // Sign out
      await signOut({ redirect: true, callbackUrl: '/' });
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteError(error instanceof Error ? error.message : 'Deletion failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Consent Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <CardTitle>Data Usage Consent</CardTitle>
          </div>
          <CardDescription>
            Control how we use your data (GDPR Article 7)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingConsents ? (
            <div className="space-y-3">
              <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
          ) : (
            <>
              {consentSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {consentSuccess}
                  </AlertDescription>
                </Alert>
              )}

              {consentError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{consentError}</AlertDescription>
                </Alert>
              )}

              {/* Necessary Consent */}
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">Necessary (Required)</h4>
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                      Always On
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Essential for app functionality, account security, and core features. Cannot be disabled.
                  </p>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Analytics Consent */}
              <div className="flex items-start justify-between p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Analytics</h4>
                  <p className="text-sm text-gray-600">
                    Help us improve the app with anonymous usage statistics, feature analytics, and performance monitoring.
                  </p>
                </div>
                <button
                  onClick={() => updateConsent('analytics', !consents?.analytics)}
                  disabled={updatingConsent === 'analytics'}
                  className="ml-4"
                >
                  <div className={`w-12 h-6 rounded-full transition-colors flex items-center ${
                    consents?.analytics ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'
                  } px-1`}>
                    {updatingConsent === 'analytics' ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    )}
                  </div>
                </button>
              </div>

              {/* Marketing Consent */}
              <div className="flex items-start justify-between p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Marketing</h4>
                  <p className="text-sm text-gray-600">
                    Receive product updates, wellness tips, new feature announcements, and personalized recommendations via email.
                  </p>
                </div>
                <button
                  onClick={() => updateConsent('marketing', !consents?.marketing)}
                  disabled={updatingConsent === 'marketing'}
                  className="ml-4"
                >
                  <div className={`w-12 h-6 rounded-full transition-colors flex items-center ${
                    consents?.marketing ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'
                  } px-1`}>
                    {updatingConsent === 'marketing' ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    )}
                  </div>
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-blue-900">
                    <p className="font-semibold mb-1">Your consent, your control</p>
                    <p className="text-blue-800">
                      You can change these preferences at any time. Revoking consent will not affect 
                      the lawfulness of processing based on consent before its withdrawal.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data Retention Policy */}
      <Card>
        <CardHeader>
          <CardTitle>Data Retention Policy</CardTitle>
          <CardDescription>
            How long we keep your data (GDPR Article 5)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="font-semibold text-gray-900">Active Accounts</p>
                <p className="text-gray-600">Data retained indefinitely while you use the service</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="font-semibold text-gray-900">Inactive Accounts (18+ months)</p>
                <p className="text-gray-600">
                  We'll send a reminder email after 18 months of inactivity. If no response within 30 days, 
                  your account will be anonymized (personal data removed, anonymized statistics retained for research).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="font-semibold text-gray-900">Deleted Accounts</p>
                <p className="text-gray-600">
                  Permanent deletion within 30 days of deletion request. All personal data removed from our systems.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            <CardTitle>Export Your Data</CardTitle>
          </div>
          <CardDescription>
            Download all your personal data in a portable format (GDPR Article 20)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Export Format</label>
            <div className="flex gap-3">
              <button
                onClick={() => setExportFormat('json')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  exportFormat === 'json'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FileJson className="h-4 w-4" />
                JSON (Complete)
              </button>
              <button
                onClick={() => setExportFormat('csv')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  exportFormat === 'csv'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-4 w-4" />
                CSV (Summary)
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-blue-900 mb-2">What's included:</h4>
            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li>Personal information and preferences</li>
              <li>All progress tracking data and scores</li>
              <li>Recipes, meal plans, and shopping lists</li>
              <li>Favorites, ratings, and comments</li>
              <li>AI generation history and recommendations</li>
            </ul>
          </div>

          {exportSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Data exported successfully! Check your downloads.
              </AlertDescription>
            </Alert>
          )}

          {exportError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{exportError}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleExportData}
            disabled={exporting}
            className="w-full"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export My Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-900">Delete Account</CardTitle>
          </div>
          <CardDescription>
            Permanently delete your account and all associated data (GDPR Article 17)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action cannot be undone. All your data will be
              permanently deleted after a 30-day grace period.
            </AlertDescription>
          </Alert>

          {!showDeleteConfirm ? (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="outline"
              className="w-full border-red-300 text-red-700 hover:bg-red-50"
            >
              I want to delete my account
            </Button>
          ) : (
            <div className="space-y-4 p-4 border-2 border-red-200 rounded-lg bg-red-50/50">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Reason for leaving (optional)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Help us improve by sharing why you're leaving..."
                  className="w-full px-3 py-2 border rounded-lg resize-none h-20"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Type <code className="bg-red-100 px-2 py-1 rounded">DELETE</code> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-900">
                <p className="font-semibold mb-1">30-Day Grace Period</p>
                <p>
                  Your account will be scheduled for deletion but not immediately removed.
                  You can cancel by logging in within 30 days.
                </p>
              </div>

              {deleteError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{deleteError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirm('');
                    setDeleteReason('');
                    setDeleteError(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirm !== 'DELETE'}
                  variant="destructive"
                  className="flex-1"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete My Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GDPR Info */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm">Your Privacy Rights</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <p>
            Under GDPR, you have the right to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access your personal data (view in settings)</li>
            <li>Receive a copy of your data (export above)</li>
            <li>Correct inaccurate data (edit in settings)</li>
            <li>Delete your data (delete account above)</li>
            <li>Restrict processing (contact support)</li>
            <li>Object to processing (contact support)</li>
          </ul>
          <p className="pt-2">
            For questions about your data, contact:{' '}
            <a href="mailto:privacy@wellness-hub.com" className="text-blue-600 hover:underline">
              privacy@wellness-hub.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

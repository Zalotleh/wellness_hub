import { Metadata } from 'next';
import Link from 'next/link';
import { Cookie } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cookie Policy | 5x5x5 Wellness Hub',
  description: 'Learn about how we use cookies on the 5x5x5 Wellness Hub platform.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm">
              <Cookie className="w-12 h-12" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Cookie Policy
            </h1>
            <p className="text-xl text-green-50 max-w-3xl mx-auto">
              How we use cookies and similar technologies on our platform
            </p>
            <p className="text-sm text-green-100 mt-4">
              Last updated: December 29, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-lg mb-8">
            <p className="text-blue-900 dark:text-blue-200 m-0">
              <strong>Quick Summary:</strong> We use cookies to keep you signed in, remember your preferences, 
              and improve your experience. Essential cookies are necessary for the platform to work, while 
              optional cookies help us analyze and enhance our service.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-6">
            1. What Are Cookies?
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Cookies are small text files that are placed on your device when you visit our website. They help 
            us provide you with a better experience by remembering your preferences, keeping you signed in, 
            and understanding how you use our platform.
          </p>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-6">
            2. Types of Cookies We Use
          </h2>

          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
            Essential Cookies (Required)
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            These cookies are necessary for the platform to function properly. Without them, you won't be 
            able to use key features like signing in or accessing your account.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
            <ul className="space-y-3 m-0">
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Authentication cookies:</strong>
                  <span className="text-gray-600 dark:text-gray-300"> Keep you signed in to your account</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Security cookies:</strong>
                  <span className="text-gray-600 dark:text-gray-300"> Protect your account from unauthorized access</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Session cookies:</strong>
                  <span className="text-gray-600 dark:text-gray-300"> Remember your actions during a browsing session</span>
                </div>
              </li>
            </ul>
          </div>

          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
            Functional Cookies (Optional)
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            These cookies enhance your experience by remembering your preferences and settings.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
            <ul className="space-y-3 m-0">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">•</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Theme preferences:</strong>
                  <span className="text-gray-600 dark:text-gray-300"> Remember if you prefer light or dark mode</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">•</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Language settings:</strong>
                  <span className="text-gray-600 dark:text-gray-300"> Store your preferred language</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">•</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">View preferences:</strong>
                  <span className="text-gray-600 dark:text-gray-300"> Remember your preferred meal plan view (day/week/calendar)</span>
                </div>
              </li>
            </ul>
          </div>

          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
            Analytics Cookies (Optional)
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            These cookies help us understand how you use our platform so we can improve it.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
            <ul className="space-y-3 m-0">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">•</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Usage analytics:</strong>
                  <span className="text-gray-600 dark:text-gray-300"> Track which features are most popular</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">•</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Performance monitoring:</strong>
                  <span className="text-gray-600 dark:text-gray-300"> Identify and fix technical issues</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">•</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Error tracking:</strong>
                  <span className="text-gray-600 dark:text-gray-300"> Help us detect and resolve bugs</span>
                </div>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-6">
            3. Third-Party Cookies
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            We use trusted third-party services that may set their own cookies:
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
            <ul className="space-y-3 m-0">
              <li className="flex items-start">
                <span className="text-gray-400 mr-2 mt-1">→</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Authentication (NextAuth.js):</strong>
                  <span className="text-gray-600 dark:text-gray-300"> Secure sign-in and session management</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2 mt-1">→</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Payment Processing (Stripe):</strong>
                  <span className="text-gray-600 dark:text-gray-300"> Secure payment transactions</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2 mt-1">→</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Analytics:</strong>
                  <span className="text-gray-600 dark:text-gray-300"> Platform usage and performance analysis</span>
                </div>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-6">
            4. How Long Do Cookies Last?
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
            <ul className="space-y-4 m-0">
              <li className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                <strong className="text-gray-900 dark:text-white block mb-1">Session Cookies:</strong>
                <span className="text-gray-600 dark:text-gray-300">
                  Temporary cookies that expire when you close your browser
                </span>
              </li>
              <li className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                <strong className="text-gray-900 dark:text-white block mb-1">Persistent Cookies:</strong>
                <span className="text-gray-600 dark:text-gray-300">
                  Remain on your device for a set period (typically 30 days for authentication, up to 1 year for preferences)
                </span>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-6">
            5. Managing Your Cookie Preferences
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You have control over cookies. Here's how to manage them:
          </p>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
            Browser Settings
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Most browsers allow you to control cookies through settings. You can typically:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-6">
            <li>View cookies stored on your device</li>
            <li>Delete existing cookies</li>
            <li>Block certain or all cookies</li>
            <li>Set preferences for specific websites</li>
          </ul>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-6 rounded-r-lg mb-6">
            <p className="text-yellow-900 dark:text-yellow-200 m-0">
              <strong>Important:</strong> Blocking essential cookies will prevent you from using key features 
              of our platform, such as signing in or accessing your account.
            </p>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
            Our Cookie Consent Tool
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            When you first visit our platform, we'll ask for your consent to use optional cookies. You can:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-6">
            <li>Accept all cookies for the full experience</li>
            <li>Accept only essential cookies</li>
            <li>Customize which categories of cookies you allow</li>
            <li>Change your preferences anytime in your account settings</li>
          </ul>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-6">
            6. Do Not Track Signals
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Some browsers have a "Do Not Track" feature that signals to websites that you don't want to be 
            tracked. We respect your privacy choices and will honor Do Not Track signals for optional cookies.
          </p>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-6">
            7. Updates to This Policy
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            We may update this Cookie Policy from time to time to reflect changes in our practices or for 
            legal or regulatory reasons. We'll notify you of significant changes by posting a notice on our 
            platform or sending you an email.
          </p>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-6">
            8. Contact Us
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            If you have questions about our use of cookies, please contact us:
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <p className="text-gray-600 dark:text-gray-300 m-0">
              Email:{' '}
              <a href="mailto:privacy@5x5xwellness.com" className="text-green-600 dark:text-green-400 hover:underline">
                privacy@5x5xwellness.com
              </a>
              <br />
              Or visit our{' '}
              <Link href="/contact" className="text-green-600 dark:text-green-400 hover:underline">
                Contact Page
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Related Policies
        </h2>
        <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <Link
            href="/privacy"
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Privacy Policy</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">How we handle your data</p>
          </Link>
          <Link
            href="/terms"
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Terms of Service</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Platform usage terms</p>
          </Link>
          <Link
            href="/contact"
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Contact Us</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Get in touch</p>
          </Link>
        </div>
      </section>
    </div>
  );
}

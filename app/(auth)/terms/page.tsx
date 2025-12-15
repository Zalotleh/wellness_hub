import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/signup"
            className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign Up
          </Link>
          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl shadow-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
              <p className="text-gray-600 dark:text-gray-300">Last updated: December 14, 2025</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100 dark:border-gray-700">
          <div className="prose prose-green max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                Welcome to 5x5x5 Wellness Hub. By accessing and using our platform, you agree to be bound by these Terms of Service ("Terms"). 
                If you do not agree to these Terms, please do not use our services.
              </p>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                These Terms apply to all users of the 5x5x5 Wellness Hub, including visitors, registered users, and subscribers 
                of our premium services.
              </p>
            </section>

            {/* Medical Disclaimer */}
            <section className="mb-8 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-400 mb-4">⚠️ 2. Medical Disclaimer</h2>
              <p className="text-amber-900 dark:text-amber-300 leading-relaxed mb-4 font-semibold">
                IMPORTANT: The information provided by 5x5x5 Wellness Hub is for educational and informational purposes only 
                and is NOT a substitute for professional medical advice, diagnosis, or treatment.
              </p>
              <p className="text-amber-900 dark:text-amber-300 leading-relaxed mb-4">
                Always seek the advice of your physician, nutritionist, or other qualified health provider with any questions 
                you may have regarding a medical condition, dietary changes, or health concerns. Never disregard professional 
                medical advice or delay in seeking it because of information you have read on our platform.
              </p>
              <p className="text-amber-900 dark:text-amber-300 leading-relaxed">
                The AI-generated content, meal plans, recipes, and nutritional advice are suggestions based on general nutritional 
                science and the 5x5x5 defense systems approach. Individual health needs vary, and you should consult with healthcare 
                professionals before making any dietary or lifestyle changes.
              </p>
            </section>

            {/* Description of Service */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Description of Service</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                5x5x5 Wellness Hub provides:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 space-y-2 mb-4">
                <li>AI-powered meal planning and recipe generation</li>
                <li>Nutritional tracking and progress monitoring</li>
                <li>Health and wellness advice based on the five defense systems</li>
                <li>Shopping list creation and management</li>
                <li>Community features for sharing recipes and experiences</li>
                <li>Premium features for subscribers</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                We reserve the right to modify, suspend, or discontinue any part of the service at any time with or without notice.
              </p>
            </section>

            {/* User Accounts */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. User Accounts and Registration</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                To access certain features, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 space-y-2 mb-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Be at least 18 years old or have parental consent</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                We reserve the right to refuse service, terminate accounts, or remove content at our sole discretion.
              </p>
            </section>

            {/* Subscription Plans */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Subscription Plans and Billing</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                We offer both free and premium subscription plans:
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Free Plan</h3>
                <p className="text-gray-700 dark:text-gray-200 text-sm">
                  Limited access to features with monthly usage restrictions on meal plans, AI questions, and recipe generations.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Premium & Family Plans</h3>
                <p className="text-gray-700 dark:text-gray-200 text-sm mb-2">
                  Enhanced features with increased or unlimited usage. Premium plans are billed monthly or annually.
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 text-sm space-y-1">
                  <li>Subscriptions automatically renew unless cancelled</li>
                  <li>Cancellation takes effect at the end of the current billing period</li>
                  <li>No refunds for partial subscription periods</li>
                  <li>Prices may change with 30 days notice to subscribers</li>
                </ul>
              </div>
            </section>

            {/* User Content */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. User Content and Conduct</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                You may submit recipes, comments, and other content ("User Content"). You agree that:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 space-y-2 mb-4">
                <li>You own or have the right to share your User Content</li>
                <li>Your content will not infringe on others' rights or contain illegal material</li>
                <li>You grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content</li>
                <li>You will not post spam, malicious content, or engage in harassment</li>
                <li>We may remove content that violates these Terms without notice</li>
              </ul>
            </section>

            {/* AI-Generated Content */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. AI-Generated Content</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                Our platform uses artificial intelligence to generate meal plans, recipes, and nutritional advice. You acknowledge that:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 space-y-2 mb-4">
                <li>AI-generated content may not be perfect or suitable for all dietary needs</li>
                <li>You should verify nutritional information before following suggestions</li>
                <li>We are not responsible for any adverse effects from following AI recommendations</li>
                <li>AI content is based on general nutritional science and may not account for individual health conditions</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Intellectual Property Rights</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                The 5x5x5 Wellness Hub platform, including its design, features, text, graphics, and software, is owned by us 
                and protected by copyright, trademark, and other laws. You may not:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 space-y-2 mb-4">
                <li>Copy, modify, or distribute our content without permission</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Use our trademarks or branding without authorization</li>
                <li>Create derivative works based on our platform</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                TO THE FULLEST EXTENT PERMITTED BY LAW:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 space-y-2 mb-4">
                <li>The service is provided "AS IS" without warranties of any kind</li>
                <li>We are not liable for any health issues, injuries, or damages resulting from use of our platform</li>
                <li>We are not responsible for the accuracy or reliability of AI-generated content</li>
                <li>Our total liability shall not exceed the amount you paid for the service in the past 12 months</li>
                <li>We are not liable for indirect, incidental, or consequential damages</li>
              </ul>
            </section>

            {/* Privacy and Data */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Privacy and Data Protection</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                Your privacy is important to us. Our{' '}
                <Link href="/privacy" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold">
                  Privacy Policy
                </Link>{' '}
                explains how we collect, use, and protect your personal information. By using our service, you consent to our 
                data practices as described in the Privacy Policy.
              </p>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Termination</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                We may terminate or suspend your account and access to the service:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 space-y-2 mb-4">
                <li>For violation of these Terms</li>
                <li>For fraudulent or illegal activity</li>
                <li>For extended periods of inactivity</li>
                <li>At our sole discretion for any reason</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                You may terminate your account at any time through the settings page. Upon termination, your right to use 
                the service will cease immediately.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">12. Changes to Terms</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of material changes via:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 space-y-2 mb-4">
                <li>Email notification to registered users</li>
                <li>In-app notification</li>
                <li>Update to the "Last updated" date on this page</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                Continued use of the service after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            {/* Governing Law */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">13. Governing Law</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from 
                these Terms or your use of the service shall be resolved through binding arbitration, except where prohibited by law.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">14. Contact Information</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-200 font-medium">5x5x5 Wellness Hub</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Email: legal@5x5xwellnesshub.com</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Support: support@5x5xwellnesshub.com</p>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-green-900 dark:text-green-400 mb-4">15. Acknowledgment</h2>
              <p className="text-green-900 dark:text-green-300 leading-relaxed">
                BY CLICKING "I AGREE" OR BY ACCESSING OR USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, 
                AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.
              </p>
            </section>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-lg hover:from-green-600 hover:to-blue-600 transition-all shadow-lg"
          >
            I Accept - Continue to Sign Up
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

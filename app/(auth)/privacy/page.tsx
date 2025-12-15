import Link from 'next/link';
import { Heart, ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Globe } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                Welcome to 5x5x5 Wellness Hub's Privacy Policy. Your privacy is critically important to us. This policy 
                explains how we collect, use, store, and protect your personal information when you use our platform.
              </p>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                By using 5x5x5 Wellness Hub, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Database className="w-6 h-6 mr-2 text-green-600 dark:text-green-400" />
                2. Information We Collect
              </h2>
              
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                    <UserCheck className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Personal Information
                  </h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm mb-2">When you register for an account, we collect:</p>
                  <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 text-sm space-y-1">
                    <li>Name and email address</li>
                    <li>Password (encrypted)</li>
                    <li>Profile information (bio, profile picture)</li>
                    <li>Measurement system and language preferences</li>
                    <li>Terms and Privacy Policy acceptance records</li>
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Health and Wellness Data</h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm mb-2">To provide personalized recommendations, we collect:</p>
                  <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 text-sm space-y-1">
                    <li>Food preferences and dietary restrictions</li>
                    <li>Progress tracking data (defense systems engagement)</li>
                    <li>Meal plans and recipes you create or save</li>
                    <li>Shopping lists and pantry items</li>
                    <li>AI chat history and questions</li>
                  </ul>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Usage Information</h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm mb-2">We automatically collect:</p>
                  <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 text-sm space-y-1">
                    <li>Device information (browser, OS, device type)</li>
                    <li>IP address and location data</li>
                    <li>Pages visited and features used</li>
                    <li>Session duration and interaction patterns</li>
                    <li>Error logs and performance data</li>
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Payment Information</h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm mb-2">For premium subscriptions:</p>
                  <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 text-sm space-y-1">
                    <li>Billing information (processed securely through Stripe)</li>
                    <li>Subscription plan and status</li>
                    <li>Payment history</li>
                    <li>We do NOT store full credit card numbers</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 space-y-2 mb-4">
                <li><strong>Service Delivery:</strong> To provide, maintain, and improve our platform features</li>
                <li><strong>Personalization:</strong> To generate personalized meal plans, recipes, and recommendations</li>
                <li><strong>Communication:</strong> To send you updates, newsletters, and respond to inquiries</li>
                <li><strong>Analytics:</strong> To understand usage patterns and improve user experience</li>
                <li><strong>Security:</strong> To detect and prevent fraud, abuse, and security incidents</li>
                <li><strong>Compliance:</strong> To comply with legal obligations and enforce our Terms of Service</li>
                <li><strong>AI Improvement:</strong> To train and improve our AI models (anonymized data only)</li>
              </ul>
            </section>

            {/* AI and Data Processing */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. AI and Machine Learning</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                Our platform uses artificial intelligence to generate content and recommendations:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 space-y-2 mb-4">
                <li>We use third-party AI services (Anthropic Claude) to generate recipes, meal plans, and advice</li>
                <li>Your queries and preferences are sent to AI providers to generate personalized content</li>
                <li>AI providers may process data according to their own privacy policies</li>
                <li>We anonymize data before using it to improve AI models</li>
                <li>AI chat history is stored locally in your browser and on our servers for your convenience</li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Globe className="w-6 h-6 mr-2 text-green-600 dark:text-green-400" />
                5. How We Share Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                We do NOT sell your personal information. We may share your data only in these circumstances:
              </p>
              
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Service Providers</h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm">
                    Third-party services that help us operate (e.g., Stripe for payments, Anthropic for AI, 
                    hosting providers, analytics tools). These providers are bound by confidentiality agreements.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Legal Requirements</h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm">
                    When required by law, court order, or government request, or to protect our rights, 
                    property, or safety.
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Business Transfers</h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm">
                    In connection with a merger, acquisition, or sale of assets, your information may be 
                    transferred (you will be notified).
                  </p>
                </div>

                <div className="border-l-4 border-amber-500 pl-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">With Your Consent</h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm">
                    When you explicitly agree to share information (e.g., sharing recipes with the community).
                  </p>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-2 text-green-600 dark:text-green-400" />
                6. Data Security
              </h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 space-y-2 mb-4">
                <li>Passwords are encrypted using bcrypt hashing</li>
                <li>Data transmitted over HTTPS/TLS encryption</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Secure database storage with PostgreSQL</li>
                <li>Regular backups and disaster recovery procedures</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                However, no method of transmission over the Internet is 100% secure. While we strive to protect 
                your personal information, we cannot guarantee absolute security.
              </p>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Data Retention</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                We retain your information for as long as necessary to provide our services and comply with legal obligations:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 space-y-2 mb-4">
                <li>Account data: Until you delete your account</li>
                <li>Usage logs: 90 days</li>
                <li>Payment records: 7 years (for tax/legal compliance)</li>
                <li>Anonymized analytics data: Indefinitely</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                When you delete your account, we will remove your personal information within 30 days, except where 
                required by law to retain it.
              </p>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Eye className="w-6 h-6 mr-2 text-green-600 dark:text-green-400" />
                8. Your Privacy Rights
              </h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                Depending on your location, you may have the following rights:
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-3">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">✓ Access</h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm">Request a copy of your personal data</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">✓ Correction</h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm">Update or correct inaccurate information</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">✓ Deletion</h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm">Request deletion of your personal data</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">✓ Portability</h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm">Export your data in a machine-readable format</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">✓ Objection</h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm">Object to processing of your personal data</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">✓ Restriction</h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm">Request restriction of processing</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">✓ Withdraw Consent</h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm">Withdraw consent for data processing at any time</p>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mt-4">
                To exercise these rights, contact us at <strong>privacy@5x5xwellnesshub.com</strong>
              </p>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Cookies and Tracking</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to improve user experience:
              </p>
              
              <div className="space-y-3 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Essential Cookies</h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm">Required for authentication and core functionality (cannot be disabled)</p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 rounded p-3 border border-green-200 dark:border-green-800">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Preference Cookies</h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm">Remember your settings and preferences (measurement system, language)</p>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-3 border border-purple-200 dark:border-purple-800">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Analytics Cookies</h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm">Help us understand how users interact with our platform (can be disabled)</p>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                You can control cookies through your browser settings. However, disabling certain cookies may limit 
                functionality.
              </p>
            </section>

            {/* Third-Party Services */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Third-Party Services</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                Our platform integrates with third-party services that have their own privacy policies:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 space-y-2 mb-4">
                <li><strong>Stripe:</strong> Payment processing - <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">stripe.com/privacy</a></li>
                <li><strong>Anthropic:</strong> AI content generation - <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">anthropic.com/privacy</a></li>
                <li><strong>Vercel/Hosting:</strong> Platform hosting and infrastructure</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                We encourage you to review these third-party privacy policies.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Children's Privacy</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                Our service is not intended for children under 18 years of age. We do not knowingly collect personal 
                information from children. If you are a parent or guardian and believe your child has provided us with 
                personal information, please contact us immediately.
              </p>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                If we discover we have collected information from a child under 18, we will delete that information promptly.
              </p>
            </section>

            {/* International Users */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">12. International Data Transfers</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                Your information may be transferred to and maintained on servers located outside your country, where 
                data protection laws may differ. By using our service, you consent to such transfers.
              </p>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                We take steps to ensure your data receives adequate protection in accordance with applicable laws.
              </p>
            </section>

            {/* Changes to Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">13. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                We may update this Privacy Policy from time to time. We will notify you of material changes by:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 space-y-2 mb-4">
                <li>Posting the new Privacy Policy on this page</li>
                <li>Updating the "Last updated" date</li>
                <li>Sending an email notification for significant changes</li>
                <li>Displaying an in-app notification</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                We encourage you to review this Privacy Policy periodically. Your continued use of the service after 
                changes constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* GDPR Compliance */}
            <section className="mb-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">14. GDPR Compliance (EU Users)</h2>
              <p className="text-blue-900 leading-relaxed mb-4">
                If you are in the European Economic Area (EEA), you have additional rights under GDPR:
              </p>
              <ul className="list-disc pl-6 text-blue-900 space-y-2">
                <li>We process data based on consent, contract performance, or legitimate interests</li>
                <li>You can withdraw consent at any time</li>
                <li>You have the right to lodge a complaint with a supervisory authority</li>
                <li>We provide data portability in machine-readable formats</li>
                <li>We honor "right to be forgotten" requests within legal limits</li>
              </ul>
            </section>

            {/* CCPA Compliance */}
            <section className="mb-8 bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-purple-900 mb-4">15. CCPA Compliance (California Users)</h2>
              <p className="text-purple-900 leading-relaxed mb-4">
                California residents have specific rights under the California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc pl-6 text-purple-900 space-y-2">
                <li>Right to know what personal information is collected</li>
                <li>Right to know if personal information is sold or disclosed</li>
                <li>Right to say no to the sale of personal information (we don't sell)</li>
                <li>Right to access your personal information</li>
                <li>Right to equal service and price (no discrimination)</li>
              </ul>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">16. Contact Us</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or your personal data:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <p className="text-gray-700 font-medium mb-2">5x5x5 Wellness Hub</p>
                <p className="text-gray-600 dark:text-gray-200 text-sm mb-1"><strong>Email:</strong> privacy@5x5xwellnesshub.com</p>
                <p className="text-gray-600 dark:text-gray-200 text-sm mb-1"><strong>Support:</strong> support@5x5xwellnesshub.com</p>
                <p className="text-gray-600 dark:text-gray-200 text-sm mb-1"><strong>Data Protection Officer:</strong> dpo@5x5xwellnesshub.com</p>
                <p className="text-gray-600 dark:text-gray-200 text-sm mt-3">
                  <strong>Response Time:</strong> We will respond to your privacy requests within 30 days.
                </p>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-green-900 mb-4">17. Acknowledgment</h2>
              <p className="text-green-900 leading-relaxed">
                BY USING OUR SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ AND UNDERSTOOD THIS PRIVACY POLICY AND 
                CONSENT TO THE COLLECTION, USE, AND DISCLOSURE OF YOUR INFORMATION AS DESCRIBED HEREIN.
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
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

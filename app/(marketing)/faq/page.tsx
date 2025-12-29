import { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, ChevronDown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FAQ | 5x5x5 Wellness Hub',
  description: 'Frequently asked questions about the 5x5x5 Wellness Hub, meal plans, recipes, and the 5 defense systems.',
};

export default function FAQPage() {
  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: 'What is the 5x5x5 Wellness Hub?',
          a: 'The 5x5x5 Wellness Hub is a comprehensive platform based on Dr. William Li\'s research on how food can activate your body\'s five natural defense systems. We provide AI-powered meal plans, recipes, and health tracking tools to help you eat to beat disease.',
        },
        {
          q: 'What are the 5 defense systems?',
          a: 'The five defense systems are: Angiogenesis (controlling blood vessel growth), Regeneration (activating stem cells), Microbiome (supporting gut health), DNA Protection (preventing genetic damage), and Immunity (strengthening immune response). These systems work together to protect your health naturally.',
        },
        {
          q: 'Is this based on scientific research?',
          a: 'Yes! All our content is based on peer-reviewed research and Dr. William Li\'s extensive clinical studies documented in his book "Eat to Beat Disease." Every recipe and recommendation is grounded in evidence-based nutritional science.',
        },
        {
          q: 'Do I need any special equipment or ingredients?',
          a: 'No! Our recipes use common, accessible ingredients you can find at your local grocery store. We focus on making healthy eating practical and achievable for everyone.',
        },
      ],
    },
    {
      category: 'Accounts & Plans',
      questions: [
        {
          q: 'What\'s included in the FREE plan?',
          a: 'The FREE plan includes: 1 meal plan per month, 30 AI recipe generations per month, 10 saved recipes, 10 AI health questions per month, basic progress tracking, and access to our community features.',
        },
        {
          q: 'What additional features do PREMIUM users get?',
          a: 'PREMIUM users enjoy unlimited meal plans, unlimited AI recipe generations, unlimited saved recipes, unlimited AI health questions, 10 AI image generations per month, PDF exports, priority support, and advanced analytics.',
        },
        {
          q: 'What are FAMILY plan benefits?',
          a: 'FAMILY plans include all PREMIUM features plus: up to 6 family member accounts, shared meal plans and shopping lists, family health dashboard, custom dietary profiles for each member, and bulk recipe management.',
        },
        {
          q: 'Can I upgrade or downgrade my plan?',
          a: 'Yes! You can upgrade or downgrade your plan at any time from your profile settings. Changes take effect at the start of your next billing cycle.',
        },
        {
          q: 'How do the monthly limits reset?',
          a: 'All monthly limits (meal plans, AI generations, etc.) reset on the first day of each calendar month at midnight UTC.',
        },
      ],
    },
    {
      category: 'Meal Plans & Recipes',
      questions: [
        {
          q: 'How does AI meal plan generation work?',
          a: 'Our AI analyzes your preferences, dietary restrictions, and health goals to create personalized meal plans. You select which defense systems to focus on, meal duration (1-4 weeks), servings, and any dietary restrictions, and our AI generates a complete plan with recipes.',
        },
        {
          q: 'Can I customize my meal plans?',
          a: 'Absolutely! You can add, remove, or swap meals and snacks in your meal plan. You can also mark meals as primary or extra, and organize snacks by timing (morning, afternoon, evening).',
        },
        {
          q: 'What if I have dietary restrictions?',
          a: 'We support various dietary restrictions including vegetarian, vegan, gluten-free, dairy-free, nut-free, and more. You can select multiple restrictions when generating meal plans or recipes.',
        },
        {
          q: 'Can I create my own recipes?',
          a: 'Yes! In addition to AI-generated recipes, you can manually create your own recipes. Specify which defense systems and key foods each ingredient supports, add cooking instructions, and share with the community.',
        },
        {
          q: 'How do shopping lists work?',
          a: 'You can create shopping lists from individual recipes or entire meal plans. The system automatically consolidates ingredients, adjusts quantities, and organizes items by category. You can check off items, share the list, or export it.',
        },
      ],
    },
    {
      category: 'Progress & Tracking',
      questions: [
        {
          q: 'What can I track on the platform?',
          a: 'You can track meals consumed, recipes created, favorite recipes, defense system activation, weekly analytics, completion rates, and see which defense systems you\'re focusing on most.',
        },
        {
          q: 'How does defense system tracking work?',
          a: 'Each recipe is tagged with the defense systems it supports. As you consume meals and recipes, we track which systems you\'re activating and provide insights on your balance across all five systems.',
        },
        {
          q: 'Can I export my data?',
          a: 'PREMIUM and FAMILY users can export their meal plans, recipes, and progress data as PDF files for offline access or sharing with healthcare providers.',
        },
      ],
    },
    {
      category: 'AI Features',
      questions: [
        {
          q: 'What is the AI Health Advisor?',
          a: 'The AI Health Advisor is an intelligent assistant that can answer questions about nutrition, the 5 defense systems, specific foods, and meal planning. It provides personalized recommendations based on the latest research.',
        },
        {
          q: 'How accurate are the AI-generated recipes?',
          a: 'Our AI is trained on Dr. Li\'s research and thousands of validated recipes. Each generated recipe includes appropriate ingredients, cooking methods, and defense system benefits. However, we always recommend reviewing recipes and consulting healthcare professionals for medical advice.',
        },
        {
          q: 'Why did my AI generation fail?',
          a: 'AI generations can fail due to incomplete information, conflicting requirements, or technical issues. We provide real-time quality scoring and tips to help you create better inputs. Failed attempts don\'t count against your monthly limit.',
        },
        {
          q: 'What are AI image generations?',
          a: 'PREMIUM users can generate AI images for their recipes to make them more visually appealing. This feature uses advanced AI to create food photography based on your recipe.',
        },
      ],
    },
    {
      category: 'Community',
      questions: [
        {
          q: 'What community features are available?',
          a: 'Our community page allows you to connect with other users, share recipes, ask questions, participate in discussions, and learn from others on their wellness journey.',
        },
        {
          q: 'Can I share my recipes with others?',
          a: 'Yes! You can make your recipes public to share with the community, or keep them private for personal use. You can also rate and comment on other users\' recipes.',
        },
        {
          q: 'Are there any community guidelines?',
          a: 'Yes, we maintain a respectful, supportive community. Be kind, share evidence-based information, respect privacy, and avoid medical claims. See our Terms of Service for full guidelines.',
        },
      ],
    },
    {
      category: 'Technical',
      questions: [
        {
          q: 'Is my data secure?',
          a: 'Yes! We use industry-standard encryption, secure authentication, and follow best practices for data protection. We never share your personal information with third parties without consent.',
        },
        {
          q: 'Can I access the platform on mobile?',
          a: 'Yes! Our platform is fully responsive and works on all devices - desktop, tablet, and mobile. We\'re also working on native mobile apps for an even better experience.',
        },
        {
          q: 'What browsers are supported?',
          a: 'We support all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, we recommend keeping your browser up to date.',
        },
        {
          q: 'I found a bug. How do I report it?',
          a: 'We appreciate bug reports! Please use our contact form or email us with details about the issue, including what you were doing when it occurred and any error messages you saw.',
        },
      ],
    },
    {
      category: 'Billing & Subscriptions',
      questions: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit cards (Visa, MasterCard, American Express) and debit cards through our secure payment processor Stripe.',
        },
        {
          q: 'Can I cancel my subscription anytime?',
          a: 'Yes! You can cancel your subscription at any time from your account settings. You\'ll continue to have access until the end of your current billing period.',
        },
        {
          q: 'Do you offer refunds?',
          a: 'We offer a 14-day money-back guarantee for new subscriptions. If you\'re not satisfied within the first 14 days, contact us for a full refund.',
        },
        {
          q: 'Will my price change if I keep my subscription?',
          a: 'Existing subscribers are grandfathered into their current pricing. If we change our prices, you\'ll keep your current rate as long as you maintain your subscription.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm">
              <HelpCircle className="w-12 h-12" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl md:text-2xl text-green-50 max-w-3xl mx-auto">
              Find answers to common questions about the 5x5x5 Wellness Hub
            </p>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Jump to:</h2>
          <div className="flex flex-wrap gap-2">
            {faqs.map((category) => (
              <a
                key={category.category}
                href={`#${category.category.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm font-medium"
              >
                {category.category}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {faqs.map((category) => (
            <div key={category.category} id={category.category.toLowerCase().replace(/\s+/g, '-')}>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <span className="w-2 h-8 bg-gradient-to-b from-green-500 to-blue-500 rounded-full mr-4" />
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.questions.map((faq, index) => (
                  <details
                    key={index}
                    className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    <summary className="flex items-center justify-between cursor-pointer p-6 font-semibold text-gray-900 dark:text-white">
                      <span className="flex-1 pr-4">{faq.q}</span>
                      <ChevronDown className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0" />
                    </summary>
                    <div className="px-6 pb-6 text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 pt-4">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-xl text-green-50 mb-8 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center px-8 py-3 bg-green-700 text-white font-semibold rounded-lg hover:bg-green-800 transition-colors"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

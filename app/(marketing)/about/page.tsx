import { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Users, BookOpen, Target, Shield, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | 5x5x5 Wellness Hub',
  description: 'Learn about the 5x5x5 Wellness Hub and our mission to help you eat to beat disease based on Dr. William Li\'s groundbreaking research.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm">
              <Heart className="w-12 h-12" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About 5x5x5 Wellness Hub
            </h1>
            <p className="text-xl md:text-2xl text-green-50 max-w-3xl mx-auto">
              Empowering you to eat to beat disease through science-backed nutrition
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              5x5x5 Wellness Hub is built on the revolutionary research of Dr. William Li and his book 
              <em className="font-semibold"> "Eat to Beat Disease"</em>. Our mission is to make this 
              life-changing knowledge accessible and actionable for everyone.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              We believe that food is medicine, and by understanding how specific foods activate your 
              body's five defense systems, you can take control of your health and prevent disease naturally.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Our platform combines cutting-edge AI technology with evidence-based nutritional science to 
              create personalized meal plans, recipes, and health insights tailored to your unique needs.
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 p-8 rounded-2xl">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              The 5 Defense Systems
            </h3>
            <div className="space-y-4">
              {[
                { icon: '🩸', name: 'Angiogenesis', desc: 'Control blood vessel growth' },
                { icon: '🔄', name: 'Regeneration', desc: 'Activate stem cells for healing' },
                { icon: '🦠', name: 'Microbiome', desc: 'Support beneficial gut bacteria' },
                { icon: '🧬', name: 'DNA Protection', desc: 'Guard against genetic damage' },
                { icon: '🛡️', name: 'Immunity', desc: 'Strengthen immune response' },
              ].map((system) => (
                <div key={system.name} className="flex items-start space-x-3">
                  <span className="text-2xl">{system.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{system.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{system.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white dark:bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            What We Offer
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Evidence-Based Recipes',
                description: 'Every recipe is crafted based on scientific research, focusing on foods that activate your body\'s natural defense systems.',
              },
              {
                icon: Target,
                title: 'Personalized Meal Plans',
                description: 'AI-powered meal planning that adapts to your dietary preferences, restrictions, and health goals.',
              },
              {
                icon: Users,
                title: 'Vibrant Community',
                description: 'Connect with others on the same journey, share experiences, and support each other towards better health.',
              },
              {
                icon: Shield,
                title: 'Health Tracking',
                description: 'Monitor your progress, track your defense system activation, and visualize your journey to wellness.',
              },
              {
                icon: Zap,
                title: 'AI-Powered Insights',
                description: 'Get personalized recommendations and answers to your nutrition questions from our AI health advisor.',
              },
              {
                icon: Heart,
                title: 'Science-Backed',
                description: 'All our content is based on peer-reviewed research and Dr. William Li\'s extensive clinical studies.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
          <p className="text-xl text-green-50 max-w-3xl mx-auto mb-8">
            We envision a world where everyone has the knowledge and tools to prevent disease and 
            optimize their health through the power of food. By making Dr. Li's research accessible 
            through technology, we're democratizing health and wellness for all.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center px-8 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors"
          >
            Join Our Community
          </Link>
        </div>
      </section>

      {/* Team Section (Optional - can be customized) */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Built with Passion
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Our team is dedicated to combining the latest in nutritional science with innovative 
            technology to create a platform that truly makes a difference in people's lives. We're 
            constantly learning, improving, and evolving to serve you better.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/contact"
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Get in Touch
            </Link>
            <Link
              href="/faq"
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { DefenseSystem } from '@/types';
import { BookOpen, ChevronDown, ChevronUp, CheckCircle, Lightbulb, Heart } from 'lucide-react';

export default function LearnPage() {
  const [expandedSystem, setExpandedSystem] = useState<DefenseSystem | null>(null);

  const toggleSystem = (system: DefenseSystem) => {
    setExpandedSystem(expandedSystem === system ? null : system);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Learn the 5x5x5 System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover Dr. William Li's revolutionary framework for using food to prevent and fight disease
          </p>
        </div>

        {/* What is 5x5x5 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            What is the 5x5x5 System?
          </h2>
          
          <div className="space-y-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              The <strong>5x5x5 system</strong> is a simple yet powerful framework developed by Dr. William Li, 
              based on decades of scientific research into how food affects our health at a cellular level.
            </p>

            <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-6 text-white">
              <h3 className="text-2xl font-bold mb-4">The Framework</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-4xl font-bold mb-2">5</div>
                  <p className="text-sm">Defense Systems</p>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">5</div>
                  <p className="text-sm">Foods per System</p>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">5</div>
                  <p className="text-sm">Times per Day</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center space-x-2">
                <Lightbulb className="w-5 h-5" />
                <span>How It Works</span>
              </h4>
              <ol className="space-y-2 text-blue-900">
                <li className="flex items-start space-x-2">
                  <span className="font-bold">1.</span>
                  <span>Choose <strong>5 health-supporting foods</strong> you enjoy</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold">2.</span>
                  <span>Eat each food <strong>5 times throughout your day</strong></span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold">3.</span>
                  <span>Support all <strong>5 defense systems</strong> for optimal health</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Five Defense Systems */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            The Five Defense Systems
          </h2>
          
          <div className="space-y-4">
            {Object.values(DefenseSystem).map((system) => {
              const info = DEFENSE_SYSTEMS[system];
              const isExpanded = expandedSystem === system;

              return (
                <div
                  key={system}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all ${
                    isExpanded ? 'ring-2 ' + info.borderColor : ''
                  }`}
                >
                  {/* Header - Always Visible */}
                  <button
                    onClick={() => toggleSystem(system)}
                    className={`w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors ${info.bgColor}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{info.icon}</div>
                      <div className="text-left">
                        <h3 className="text-2xl font-bold text-gray-900">
                          {info.displayName}
                        </h3>
                        <p className="text-gray-700">{info.description}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-6 h-6 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-600" />
                    )}
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-6 border-t-2 border-gray-200 space-y-6">
                      {/* Key Foods */}
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span>Top Foods for {info.displayName}</span>
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {info.keyFoods.map((food) => (
                            <div
                              key={food}
                              className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-center font-medium text-gray-900 hover:border-green-500 transition-colors"
                            >
                              {food}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Key Nutrients */}
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3">
                          Important Nutrients
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {info.nutrients.map((nutrient) => (
                            <span
                              key={nutrient}
                              className="px-3 py-1 bg-blue-50 text-blue-900 rounded-full text-sm font-medium"
                            >
                              {nutrient}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Why It Matters */}
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                        <h4 className="font-bold text-green-900 mb-2">
                          Why This System Matters
                        </h4>
                        <p className="text-green-800 text-sm">
                          {getSystemBenefits(system)}
                        </p>
                      </div>

                      {/* Quick Tips */}
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                        <h4 className="font-bold text-yellow-900 mb-2 flex items-center space-x-2">
                          <Lightbulb className="w-5 h-5" />
                          <span>Quick Tips</span>
                        </h4>
                        <ul className="text-yellow-900 text-sm space-y-1">
                          {getSystemTips(system).map((tip, index) => (
                            <li key={index}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scientific Background */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            The Science Behind It
          </h2>
          
          <div className="space-y-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              Dr. William Li's research, detailed in his book <em>"Eat to Beat Disease,"</em> 
              demonstrates that our bodies have powerful defense systems that can be activated 
              and optimized through the foods we eat.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-blue-900 mb-3">Evidence-Based</h3>
                <p className="text-blue-800 text-sm">
                  Over 200 diseases can be prevented or fought through diet. 
                  This system is based on thousands of scientific studies.
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
                <h3 className="font-bold text-green-900 mb-3">Holistic Approach</h3>
                <p className="text-green-800 text-sm">
                  Rather than focusing on single nutrients, the 5x5x5 system 
                  looks at whole foods and their combined effects on health.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-6">
                <h3 className="font-bold text-purple-900 mb-3">Preventive Medicine</h3>
                <p className="text-purple-800 text-sm">
                  Food as medicine isn't just about treating disease - it's about 
                  preventing it before it starts.
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg p-6">
                <h3 className="font-bold text-orange-900 mb-3">Personalized Health</h3>
                <p className="text-orange-800 text-sm">
                  You choose foods you enjoy. The system is flexible and 
                  adaptable to your preferences and lifestyle.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center space-x-3 mb-6">
            <Heart className="w-8 h-8" />
            <h2 className="text-3xl font-bold">Start Your Journey</h2>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h3 className="font-bold mb-2">Step 1: Learn Your Systems</h3>
              <p className="text-sm opacity-90">
                Understand what each defense system does and why it matters
              </p>
            </div>

            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h3 className="font-bold mb-2">Step 2: Choose Your Foods</h3>
              <p className="text-sm opacity-90">
                Pick 5 foods you enjoy from each system - variety is key!
              </p>
            </div>

            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h3 className="font-bold mb-2">Step 3: Track Your Progress</h3>
              <p className="text-sm opacity-90">
                Use our progress tracker to monitor your daily intake and see results
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/progress"
              className="flex-1 px-6 py-3 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition-colors font-bold text-center"
            >
              Start Tracking
            </a>
            <a
              href="/recipes"
              className="flex-1 px-6 py-3 bg-white bg-opacity-20 border-2 border-white text-white rounded-lg hover:bg-opacity-30 transition-colors font-bold text-center"
            >
              Browse Recipes
            </a>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Learn More
          </h2>
          
          <div className="space-y-4">
            <a
              href="https://drwilliamli.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 transition-colors"
            >
              <h3 className="font-bold text-gray-900 mb-1">
                Dr. William Li's Website →
              </h3>
              <p className="text-sm text-gray-600">
                Official website with research, articles, and more information
              </p>
            </a>

            <a
              href="https://www.eattobeat.org"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 transition-colors"
            >
              <h3 className="font-bold text-gray-900 mb-1">
                Eat to Beat Foundation →
              </h3>
              <p className="text-sm text-gray-600">
                Non-profit organization advancing food as medicine
              </p>
            </a>

            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-1">
                📚 Recommended Reading
              </h3>
              <p className="text-sm text-blue-800">
                <strong>"Eat to Beat Disease"</strong> by Dr. William Li - 
                The comprehensive guide to the science of healing foods
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for system-specific content
function getSystemBenefits(system: DefenseSystem): string {
  const benefits: Record<DefenseSystem, string> = {
    [DefenseSystem.ANGIOGENESIS]: 
      "Healthy blood vessel formation is crucial for starving cancer cells while feeding healthy tissue. This system helps prevent tumor growth and supports cardiovascular health.",
    [DefenseSystem.REGENERATION]: 
      "Your body's stem cells can regenerate damaged organs and tissues. Supporting this system helps maintain youthful function and speeds recovery from injury.",
    [DefenseSystem.MICROBIOME]: 
      "A healthy gut microbiome strengthens immunity, improves digestion, and even affects mental health. 70% of your immune system lives in your gut!",
    [DefenseSystem.DNA_PROTECTION]: 
      "DNA damage leads to aging and disease. Foods rich in protective compounds help repair DNA and prevent mutations that can lead to cancer.",
    [DefenseSystem.IMMUNITY]: 
      "A strong immune system protects against infections, cancer, and autoimmune diseases. The right foods can supercharge your body's natural defenses.",
  };
  return benefits[system];
}

function getSystemTips(system: DefenseSystem): string[] {
  const tips: Record<DefenseSystem, string[]> = {
    [DefenseSystem.ANGIOGENESIS]: [
      "Eat tomatoes with olive oil for better lycopene absorption",
      "Drink green tea daily for powerful EGCG",
      "Include berries in your breakfast",
      "Dark chocolate (70%+) is a healthy treat",
    ],
    [DefenseSystem.REGENERATION]: [
      "Choose wild-caught salmon for omega-3s",
      "Add turmeric to rice, soups, and smoothies",
      "Drink coffee or tea daily",
      "Include nuts for healthy fats",
    ],
    [DefenseSystem.MICROBIOME]: [
      "Eat fermented foods like kimchi or yogurt daily",
      "Include prebiotic fiber (onions, garlic, bananas)",
      "Variety is key - rotate your probiotic sources",
      "Avoid excessive antibiotics when possible",
    ],
    [DefenseSystem.DNA_PROTECTION]: [
      "Eat cruciferous vegetables 3-4 times per week",
      "Choose organic when possible for leafy greens",
      "Lightly steam broccoli to preserve nutrients",
      "Add fresh herbs like parsley and cilantro",
    ],
    [DefenseSystem.IMMUNITY]: [
      "Include mushrooms in soups and stir-fries",
      "Use garlic and ginger liberally in cooking",
      "Eat citrus fruits for vitamin C",
      "Stay hydrated to support immune function",
    ],
  };
  return tips[system];
}
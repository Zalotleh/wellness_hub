'use client';

import Link from 'next/link';
import { Heart, Github, Twitter, Linkedin, Mail, ChevronRight, Sparkles, Shield, Leaf, Zap, Droplets, Brain } from 'lucide-react';

const DEFENSE_SYSTEMS = [
  { icon: Shield, label: 'Angiogenesis', color: 'text-red-500 dark:text-red-400' },
  { icon: Leaf, label: 'Stem Cells', color: 'text-green-600 dark:text-green-400' },
  { icon: Brain, label: 'Microbiome', color: 'text-yellow-600 dark:text-yellow-400' },
  { icon: Zap, label: 'DNA Protection', color: 'text-blue-500 dark:text-blue-400' },
  { icon: Droplets, label: 'Immunity', color: 'text-teal-600 dark:text-teal-400' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Recipes', href: '/recipes' },
      { label: 'AI Generator', href: '/recipes/ai-generate' },
      { label: 'Meal Planner', href: '/meal-planner' },
      { label: 'Progress Tracker', href: '/progress' },
      { label: 'Learn 5x5x5', href: '/learn' },
    ],
    resources: [
      { label: 'About', href: '/about' },
      { label: 'Community', href: '/community' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact', href: '/contact' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  };

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 mt-5 border-t border-gray-200 dark:border-gray-800">
      {/* Gradient accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-green-500 via-teal-400 to-emerald-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 flex-shrink-0">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900 dark:text-white leading-none">5x5x5 Wellness Hub</span>
                <span className="block text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">Eat to Beat Disease</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
              A platform built on Dr. William Li&apos;s research — nourish all five of your body&apos;s natural health defense systems through the right foods.
            </p>

            {/* Defense systems mini pills */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">5 Defense Systems</p>
              <div className="flex flex-wrap gap-2">
                {DEFENSE_SYSTEMS.map(({ icon: Icon, label, color }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/60 shadow-sm">
                    <Icon className={`w-3 h-3 ${color}`} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Social icons */}
            <div className="flex gap-2">
              {[
                { href: 'https://github.com', icon: Github, label: 'GitHub' },
                { href: 'https://twitter.com', icon: Twitter, label: 'Twitter' },
                { href: 'https://linkedin.com', icon: Linkedin, label: 'LinkedIn' },
                { href: 'mailto:hello@5x5xwellness.com', icon: Mail, label: 'Email' },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  aria-label={label}
                  className="w-9 h-9 bg-white dark:bg-gray-800 hover:bg-green-500 dark:hover:bg-green-600 border border-gray-200 dark:border-gray-700/60 hover:border-green-400 dark:hover:border-green-500 rounded-lg flex items-center justify-center transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-white group shadow-sm"
                >
                  <Icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-sm uppercase tracking-wider mb-5">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-150"
                  >
                    <ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-150 text-green-600 dark:text-green-400 flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-sm uppercase tracking-wider mb-5">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-150"
                  >
                    <ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-150 text-green-600 dark:text-green-400 flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-sm uppercase tracking-wider mb-5">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-150"
                  >
                    <ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-150 text-green-600 dark:text-green-400 flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* AI badge */}
            <div className="mt-8 inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/40 dark:to-teal-900/40 border border-green-200 dark:border-green-700/40 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-xs text-green-700 dark:text-green-300 font-medium">AI-Powered Nutrition</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              © {currentYear} 5x5x5 Wellness Hub. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              Built with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for better health — inspired by
              <span className="text-green-600 dark:text-green-400 font-medium">Dr. William Li</span>
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Meal Planner | 5x5x5 Wellness Hub',
  description: 'Create personalized weekly meal plans using AI based on Dr. William Li\'s 5x5x5 system. Balance nutrition across five defense systems for optimal health.',
  keywords: [
    'meal planner',
    'AI nutrition',
    '5x5x5 system',
    'defense systems',
    'healthy eating',
    'meal planning',
    'nutrition planner',
    'diet planning',
    'wellness',
    'Dr. William Li',
    'angiogenesis',
    'regeneration',
    'microbiome',
    'DNA protection',
    'immunity'
  ],
  authors: [{ name: '5x5x5 Wellness Hub' }],
  creator: '5x5x5 Wellness Hub',
  publisher: '5x5x5 Wellness Hub',
  openGraph: {
    title: 'AI-Powered Meal Planner | 5x5x5 Wellness Hub',
    description: 'Plan your weekly meals with AI-powered recommendations based on the 5x5x5 defense system approach to nutrition.',
    type: 'website',
    url: '/meal-planner',
    siteName: '5x5x5 Wellness Hub',
    images: [
      {
        url: '/og-meal-planner.jpg',
        width: 1200,
        height: 630,
        alt: '5x5x5 Meal Planner Interface showing weekly meal planning with defense systems',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Meal Planner | 5x5x5 Wellness Hub',
    description: 'Create balanced weekly meal plans using AI and the 5x5x5 defense system approach.',
    images: ['/twitter-meal-planner.jpg'],
    creator: '@5x5x5wellness',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: '/meal-planner',
  },
  category: 'health',
  classification: 'Health & Nutrition',
  other: {
    'application-name': '5x5x5 Wellness Hub',
    'theme-color': '#10b981',
    'color-scheme': 'light',
    'viewport': 'width=device-width, initial-scale=1',
  },
};
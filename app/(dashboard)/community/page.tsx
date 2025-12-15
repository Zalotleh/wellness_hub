'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Trophy, TrendingUp, MessageSquare, Heart, Award, Star, ChefHat } from 'lucide-react';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { DefenseSystem } from '@/types';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'contributors' | 'discussions' | 'leaderboard'>('contributors');

  // Mock data - would come from API in production
  const topContributors = [
    { name: 'Sarah Martinez', recipes: 15, rating: 4.8, avatar: 'S', joined: 'Jan 2024' },
    { name: 'John Davis', recipes: 12, rating: 4.9, avatar: 'J', joined: 'Feb 2024' },
    { name: 'Emma Lee', recipes: 10, rating: 4.7, avatar: 'E', joined: 'Jan 2024' },
    { name: 'Michael Chen', recipes: 8, rating: 4.6, avatar: 'M', joined: 'Mar 2024' },
    { name: 'Lisa Johnson', recipes: 7, rating: 4.8, avatar: 'L', joined: 'Feb 2024' },
  ];

  const recentDiscussions = [
    {
      id: 1,
      title: 'Best foods for immunity during winter?',
      author: 'Sarah Martinez',
      replies: 12,
      views: 245,
      time: '2 hours ago',
      category: 'Immunity',
    },
    {
      id: 2,
      title: 'My 30-day angiogenesis journey - Results!',
      author: 'John Davis',
      replies: 8,
      views: 189,
      time: '5 hours ago',
      category: 'Angiogenesis',
    },
    {
      id: 3,
      title: 'Microbiome-friendly breakfast ideas',
      author: 'Emma Lee',
      replies: 15,
      views: 332,
      time: '1 day ago',
      category: 'Microbiome',
    },
    {
      id: 4,
      title: 'How to incorporate more DNA-protective foods?',
      author: 'Michael Chen',
      replies: 6,
      views: 156,
      time: '1 day ago',
      category: 'DNA Protection',
    },
  ];

  const systemLeaderboard = [
    { system: DefenseSystem.ANGIOGENESIS, leader: 'Sarah M.', score: 95, streak: 45 },
    { system: DefenseSystem.MICROBIOME, leader: 'John D.', score: 92, streak: 38 },
    { system: DefenseSystem.DNA_PROTECTION, leader: 'Emma L.', score: 88, streak: 30 },
    { system: DefenseSystem.IMMUNITY, leader: 'Michael C.', score: 85, streak: 28 },
    { system: DefenseSystem.REGENERATION, leader: 'Lisa J.', score: 82, streak: 25 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Community Hub</h1>
              <p className="text-gray-600 dark:text-gray-300">Connect with others on their health journey</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex items-center space-x-2 mb-1">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Members</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">10,234</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex items-center space-x-2 mb-1">
                <ChefHat className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Recipes</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1,456</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex items-center space-x-2 mb-1">
                <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Discussions</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">3,892</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex items-center space-x-2 mb-1">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Today</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">847</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="flex border-b dark:border-gray-700">
            <button
              onClick={() => setActiveTab('contributors')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'contributors'
                  ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Top Contributors</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('discussions')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'discussions'
                  ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Discussions</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'leaderboard'
                  ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Award className="w-5 h-5" />
                <span>Leaderboard</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'contributors' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Top Contributors This Month
                </h2>
                <div className="space-y-4">
                  {topContributors.map((contributor, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {contributor.avatar}
                          </div>
                          {index < 3 && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                {index + 1}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {contributor.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Joined {contributor.joined}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {contributor.recipes}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Recipes</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-5 h-5 text-yellow-500 fill-current" />
                          <span className="font-bold text-gray-900 dark:text-white">
                            {contributor.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'discussions' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Recent Discussions
                  </h2>
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-colors font-medium">
                    New Topic
                  </button>
                </div>

                <div className="space-y-4">
                  {recentDiscussions.map((discussion) => (
                    <div
                      key={discussion.id}
                      className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg flex-1">
                          {discussion.title}
                        </h3>
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                          {discussion.category}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-4">
                          <span>by {discussion.author}</span>
                          <span>•</span>
                          <span>{discussion.time}</span>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{discussion.replies}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{discussion.views}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Defense System Champions
                </h2>

                <div className="space-y-4">
                  {systemLeaderboard.map((entry) => {
                    const info = DEFENSE_SYSTEMS[entry.system];
                    return (
                      <div
                        key={entry.system}
                        className={`p-4 border-2 rounded-lg ${info.bgColor} ${info.borderColor}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-3xl">{info.icon}</span>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">
                                {info.displayName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Champion: {entry.leader}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {entry.score}%
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {entry.streak} day streak 🔥
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Featured Recipe */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                🌟 Featured Recipe
              </h3>
              <div className="space-y-3">
                <div className="h-32 bg-gradient-to-br from-green-400 to-blue-400 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-16 h-16 text-white opacity-50" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white">
                  Mediterranean Power Bowl
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  A nutrient-packed bowl supporting all 5 defense systems
                </p>
                <Link
                  href="/recipes/1"
                  className="block w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-colors text-center font-medium"
                >
                  View Recipe
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/recipes/create"
                  className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-gray-100 font-medium"
                >
                  Share a Recipe
                </Link>
                <Link
                  href="/progress"
                  className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-gray-100 font-medium"
                >
                  Track Progress
                </Link>
                <Link
                  href="/learn"
                  className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-gray-100 font-medium"
                >
                  Learn 5x5x5
                </Link>
              </div>
            </div>

            {/* Community Guidelines */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3">
                💙 Community Guidelines
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <li>• Be respectful and supportive</li>
                <li>• Share evidence-based information</li>
                <li>• Celebrate others' successes</li>
                <li>• Ask questions and learn together</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
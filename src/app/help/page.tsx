"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Play,
  FileText,
  MessageCircle,
  HelpCircle,
  Star,
  Trophy,
  Users,
  DollarSign,
  Shuffle,
  Calendar,
  Settings,
  Target,
  Award,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  readTime: number;
  lastUpdated: string;
  helpful: number;
  views: number;
}

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  popularity: number;
}

export default function HelpCenterPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  // Mock help articles
  const mockArticles: HelpArticle[] = [
    {
      id: "1",
      title: "Getting Started with Fantasy Football",
      category: "basics",
      description:
        "Learn the fundamentals of fantasy football and how to set up your first team.",
      content: "Fantasy football is a game where you act as a team owner...",
      difficulty: "beginner",
      readTime: 5,
      lastUpdated: "2024-08-15",
      helpful: 89,
      views: 1247,
    },
    {
      id: "2",
      title: "Understanding PPR Scoring",
      category: "scoring",
      description:
        "Comprehensive guide to Point Per Reception (PPR) scoring system.",
      content: "PPR stands for Point Per Reception, which means...",
      difficulty: "beginner",
      readTime: 8,
      lastUpdated: "2024-08-20",
      helpful: 156,
      views: 892,
    },
    {
      id: "3",
      title: "Advanced Draft Strategy",
      category: "draft",
      description:
        "Master advanced drafting techniques including value-based drafting and positional scarcity.",
      content: "Value-based drafting (VBD) is a strategy that...",
      difficulty: "advanced",
      readTime: 12,
      lastUpdated: "2024-08-10",
      helpful: 234,
      views: 2156,
    },
    {
      id: "4",
      title: "How to Make Trades",
      category: "trading",
      description:
        "Step-by-step guide to proposing, negotiating, and completing trades.",
      content:
        "Trading is one of the most exciting aspects of fantasy football...",
      difficulty: "intermediate",
      readTime: 7,
      lastUpdated: "2024-08-25",
      helpful: 78,
      views: 634,
    },
    {
      id: "5",
      title: "FAAB Bidding Strategy",
      category: "waivers",
      description:
        "Learn how to maximize your Free Agent Acquisition Budget for waiver wire success.",
      content: "FAAB (Free Agent Acquisition Budget) is a waiver system...",
      difficulty: "intermediate",
      readTime: 10,
      lastUpdated: "2024-08-18",
      helpful: 112,
      views: 1034,
    },
  ];

  // Mock video tutorials
  const mockVideos: VideoTutorial[] = [
    {
      id: "1",
      title: "Fantasy Football 101: Complete Beginner's Guide",
      description:
        "Everything you need to know to start playing fantasy football",
      duration: "15:42",
      thumbnail: "/videos/thumbnails/ff101.jpg",
      category: "basics",
      difficulty: "beginner",
    },
    {
      id: "2",
      title: "Draft Day Masterclass",
      description: "Advanced strategies for dominating your fantasy draft",
      duration: "23:18",
      thumbnail: "/videos/thumbnails/draft.jpg",
      category: "draft",
      difficulty: "advanced",
    },
    {
      id: "3",
      title: "Waiver Wire Mastery",
      description: "How to find gold on the waiver wire every week",
      duration: "12:35",
      thumbnail: "/videos/thumbnails/waivers.jpg",
      category: "waivers",
      difficulty: "intermediate",
    },
  ];

  // Mock FAQ data
  const mockFAQs: FAQ[] = [
    {
      id: "1",
      question: "How do I join a fantasy football league?",
      answer:
        "You can join a league by receiving an invitation from a commissioner, or by creating your own league and inviting friends. Look for the 'Join League' or 'Create League' buttons on your dashboard.",
      category: "basics",
      popularity: 95,
    },
    {
      id: "2",
      question: "When do waivers process?",
      answer:
        "Waivers typically process on Wednesday mornings at 10:00 AM ET. The exact time may vary by league settings. Check your league's waiver settings for specific timing.",
      category: "waivers",
      popularity: 87,
    },
    {
      id: "3",
      question: "Can I change my starting lineup after games have started?",
      answer:
        "No, you cannot change players in your starting lineup once their game has begun. Make sure to set your lineup before the first NFL game of the week (usually Thursday night).",
      category: "lineup",
      popularity: 82,
    },
    {
      id: "4",
      question: "How does the playoff format work?",
      answer:
        "Playoff format varies by league. Most leagues have 6 teams make the playoffs (weeks 15-17), with the top 2 seeds getting first-round byes. Check your league settings for specific playoff structure.",
      category: "playoffs",
      popularity: 76,
    },
    {
      id: "5",
      question: "What happens if a player gets injured during a game?",
      answer:
        "If a player gets injured during their game, they keep the points they earned up to that point. You cannot substitute them out once the game has started. This is why having good bench depth is important.",
      category: "scoring",
      popularity: 71,
    },
  ];

  const helpCategories = [
    {
      id: "all",
      label: "All Topics",
      icon: BookOpen,
      count: mockArticles.length,
    },
    { id: "basics", label: "Getting Started", icon: Star, count: 8 },
    { id: "draft", label: "Draft Strategy", icon: Trophy, count: 12 },
    { id: "scoring", label: "Scoring & Rules", icon: Target, count: 6 },
    { id: "trading", label: "Trading", icon: Shuffle, count: 5 },
    { id: "waivers", label: "Waivers & FAAB", icon: DollarSign, count: 7 },
    { id: "lineup", label: "Lineup Management", icon: Users, count: 4 },
    { id: "playoffs", label: "Playoffs", icon: Award, count: 3 },
  ];

  const filteredArticles = mockArticles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredFAQs = mockFAQs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Help Center
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Everything you need to master fantasy football
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto relative">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search help articles, FAQs, and tutorials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-500 rounded-full p-2">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                New to Fantasy?
              </h3>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
              Start with our beginner's guide and learn the basics of fantasy
              football.
            </p>
            <Link
              href="#basics"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Get Started →
            </Link>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-500 rounded-full p-2">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Draft Prep
              </h3>
            </div>
            <p className="text-sm text-green-800 dark:text-green-200 mb-4">
              Master your draft with advanced strategies and ranking systems.
            </p>
            <Link
              href="#draft"
              className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
            >
              Draft Better →
            </Link>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-500 rounded-full p-2">
                <Play className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                Video Tutorials
              </h3>
            </div>
            <p className="text-sm text-purple-800 dark:text-purple-200 mb-4">
              Watch expert tutorials to improve your fantasy skills.
            </p>
            <Link
              href="#videos"
              className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
            >
              Watch Now →
            </Link>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-orange-500 rounded-full p-2">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                Need Help?
              </h3>
            </div>
            <p className="text-sm text-orange-800 dark:text-orange-200 mb-4">
              Contact our support team or browse frequently asked questions.
            </p>
            <Link
              href="#contact"
              className="text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline"
            >
              Get Support →
            </Link>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4 border-b dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Browse by Topic
                </h2>
              </div>
              <div className="p-2">
                <div className="space-y-1">
                  {helpCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === category.id
                            ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4" />
                          <span>{category.label}</span>
                        </div>
                        <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                          {category.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div
              id="contact"
              className="bg-white dark:bg-gray-800 rounded-lg shadow mt-6"
            >
              <div className="p-4 border-b dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Contact Support
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Email Support
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      help@astralfield.com
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Response Time
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Usually within 4 hours
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-12">
            {/* Video Tutorials */}
            <section id="videos">
              <div className="flex items-center space-x-2 mb-6">
                <Play className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Video Tutorials
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockVideos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="relative">
                      <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${getDifficultyColor(video.difficulty)}`}
                        >
                          {video.difficulty}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {video.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {video.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Help Articles */}
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Help Articles
                </h2>
              </div>
              <div className="space-y-4">
                {filteredArticles.length > 0 ? (
                  filteredArticles.map((article) => (
                    <div
                      key={article.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {article.title}
                              </h3>
                              <span
                                className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${getDifficultyColor(article.difficulty)}`}
                              >
                                {article.difficulty}
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                              {article.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{article.readTime} min read</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="w-4 h-4" />
                                <span>{article.helpful} found helpful</span>
                              </div>
                              <span>
                                Updated{" "}
                                {new Date(
                                  article.lastUpdated,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No articles found matching your search</p>
                  </div>
                )}
              </div>
            </section>

            {/* FAQ Section */}
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <HelpCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="space-y-2">
                {filteredFAQs.length > 0 ? (
                  filteredFAQs.map((faq) => (
                    <div
                      key={faq.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow"
                    >
                      <button
                        onClick={() =>
                          setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)
                        }
                        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <h3 className="font-medium text-gray-900 dark:text-white pr-4">
                          {faq.question}
                        </h3>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedFAQ === faq.id ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {expandedFAQ === faq.id && (
                        <div className="px-6 pb-6">
                          <div className="pt-4 border-t dark:border-gray-700">
                            <p className="text-gray-600 dark:text-gray-400">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No FAQs found matching your search</p>
                  </div>
                )}
              </div>
            </section>

            {/* Still Need Help */}
            <section className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-8 text-center">
              <MessageCircle className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Still Need Help?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                Can't find what you're looking for? Our support team is here to
                help you with any questions about fantasy football or the
                platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </button>
                <button className="inline-flex items-center px-6 py-3 border border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg font-medium transition-colors">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Community Forum
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

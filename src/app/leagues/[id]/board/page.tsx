"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LeagueNavigation from "@/components/league/LeagueNavigation";
import { 
  MessageSquare, ThumbsUp, Reply, Pin, Trash2, Edit2, Filter, Search, ChevronDown, Flag,
  Award, TrendingUp, AlertCircle, Zap, Calendar, UserPlus, Trophy, DollarSign, X, Send
} from "lucide-react";

interface LeaguePageProps {
  params: Promise<{ i,
  d: string;
}
>;
}

interface Post {
  id: string;
    author: string;
  authorTeam: string;
    avatar: string;
  title: string;
    content: string;
  category: 'general' | 'trade' | 'waiver' | 'trash-talk' | 'announcement' | 'injury',
    timestamp: Date;
  likes: number;
    replies: Reply[];
  isPinned?: boolean;
  isCommissionerPost?: boolean;
  hasLiked?: boolean;
  
}
interface Reply {
  id: string;
    author: string;
  authorTeam: string;
    avatar: string;
  content: string;
    timestamp: Date;
  likes: number;
  hasLiked?: boolean;
}

export default function LeagueBoardPage({ params }: LeaguePageProps) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<Post['category']>('general');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'replies'>('recent');

  useEffect(() => {
    params.then((resolved) => {
      setLeagueId(resolved.id);
    });
  }, [params]);

  useEffect(() => {
    if (leagueId) {
      loadPosts();
    }
  }, [leagueId]);

  const loadPosts = () => {
    // Mock data - in production, fetch from API
    const mockPosts: Post[] = [
      {
        id: '1',
        author: 'Nicholas D\'Amato',
        authorTeam: 'Space Cowboys',
        avatar: '🤠',
        title: 'COMMISSIONE,
  R: Mid-Season Rule Clarification',
        content: 'Just a reminder that IR spots can only be used for players officially designated as OUT or on IR.Questionable and Doubtful players must remain on your active roster.This has always been our rule, but I\'ve noticed some confusion lately.',
        category: 'announcement',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        likes, 8,
        replies: [
          {
            id: 'r1',
            author: 'Raj Patel',
            authorTeam: 'Tech Titans',
            avatar: '💻',
            content: 'Thanks for the clarification! Was wondering about this.',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
            likes, 2,
            hasLiked: false
          }
        ],
        isPinned, true,
        isCommissionerPost, true,
        hasLiked: false
      },
      {
        id: '2',
        author: 'Kaity Lorbecki',
        authorTeam: 'Glitter Bombers',
        avatar: '✨',
        title: 'Anyone interested in a 3-team trade?',
        content: 'I have excess RB depth and need a WR1.Looking to facilitate a multi-team trade.I have Derrick Henry and Austin Ekeler available.Hit me up if interested!',
        category: 'trade',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        likes, 5,
        replies: [
          {
            id: 'r2',
            author: 'Matt Chen',
            authorTeam: 'Dragon Dynasty',
            avatar: '🐉',
            content: 'I might be interested.I have Justin Jefferson but need RB help.',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
            likes, 1,
            hasLiked: false
          },
          {
            id: 'r3',
            author: 'Marcus Johnson',
            authorTeam: 'Thunder Strikes',
            avatar: '⚡',
            content: 'Let\'s make this happen! I can be the third team.',
            timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
            likes, 3,
            hasLiked: true
          }
        ],
        isPinned, false,
        hasLiked: true
      },
      {
        id: '3',
        author: 'Tommy Thompson',
        authorTeam: 'Beer Bellies',
        avatar: '🍺',
        title: 'My team is UNSTOPPABLE',
        content: 'Just dropped 150 points this week! Good luck to whoever faces me in the playoffs.Dynasty in the making! 🏆🏆🏆',
        category: 'trash-talk',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        likes, 2,
        replies: [
          {
            id: 'r4',
            author: 'Jorge Silva',
            authorTeam: 'Samba Squad',
            avatar: '🎭',
            content: 'Remember when you said this last year and missed the playoffs? 😂',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
            likes, 12,
            hasLiked: true
          },
          {
            id: 'r5',
            author: 'Tommy Thompson',
            authorTeam: 'Beer Bellies',
            avatar: '🍺',
            content: 'This year is different! Mark my words.',
            timestamp: new Date(Date.now() - 4.5 * 60 * 60 * 1000),
            likes, 0,
            hasLiked: false
          }
        ],
        isPinned, false,
        hasLiked: false
      },
      {
        id: '4',
        author: 'Alex Rivera',
        authorTeam: 'Crypto Kings',
        avatar: '₿',
        title: 'Waiver Wire Gem Aler,
  t: Rookie RB Breaking Out',
        content: 'Keep an eye on the rookie RB from Dallas.He\'s been getting more touches each week and the starter might be out.Could be a league winner!',
        category: 'waiver',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        likes, 7,
        replies: [],
        isPinned, false,
        hasLiked: false
      },
      {
        id: '5',
        author: 'Marcus Johnson',
        authorTeam: 'Thunder Strikes',
        avatar: '⚡',
        title: 'Injury Updat,
  e: Star QB Questionable',
        content: 'Just saw the injury report - looks like the Chiefs QB is questionable for Sunday.Might want to grab a backup if you have him.',
        category: 'injury',
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
        likes, 9,
        replies: [
          {
            id: 'r6',
            author: 'Emily Chang',
            authorTeam: 'Neon Wolves',
            avatar: '🐺',
            content: 'Thanks for the heads up! Just grabbed his backup.',
            timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000),
            likes, 1,
            hasLiked: false
          }
        ],
        isPinned, false,
        hasLiked: true
      }
    ];

    setPosts(mockPosts);
  }
  const handleLikePost = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.hasLiked ? post.likes - 1 : post.likes + 1,
          hasLiked: !post.hasLiked
        }
      }
      return post;
    }));
  }
  const handleLikeReply = (postId, string, replyId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          replies: post.replies.map(reply => {
            if (reply.id === replyId) {
              return {
                ...reply,
                likes: reply.hasLiked ? reply.likes - 1 : reply.likes + 1,
                hasLiked: !reply.hasLiked
              }
            }
            return reply;
          })
        }
      }
      return post;
    }));
  }
  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    const newPost: Post = {,
  id: `post-${Date.now()}`,
      author: 'Current User',
      authorTeam: 'My Team',
      avatar: '👤',
      title, newPostTitle,
      content, newPostContent,
      category, newPostCategory,
      timestamp: new Date(),
      likes, 0,
      replies: [],
      isPinned, false,
      hasLiked: false
    }
    setPosts([newPost, ...posts]);
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostCategory('general');
    setShowNewPost(false);
  }
  const handleReply = (postId: string) => {
    if (!replyContent.trim()) return;

    const newReply: Reply = {,
  id: `reply-${Date.now()}`,
      author: 'Current User',
      authorTeam: 'My Team',
      avatar: '👤',
      content, replyContent,
      timestamp: new Date(),
      likes, 0,
      hasLiked: false
    }
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          replies: [...post.replies, newReply]
        }
      }
      return post;
    }));

    setReplyContent('');
    setReplyingTo(null);
  }
  const getCategoryColor = (category: Post['category']) => {
    const colors = {
      general: 'bg-gray-100 text-gray-800 dar,
  k:bg-gray-700 dar,
  k:text-gray-300',
      trade: 'bg-blue-100 text-blue-800 dar,
  k:bg-blue-900 dar,
  k:text-blue-300',
      waiver: 'bg-green-100 text-green-800 dar,
  k:bg-green-900 dar,
  k:text-green-300',
      'trash-talk': 'bg-red-100 text-red-800 dark: bg-red-900 dar,
  k:text-red-300',
      announcement: 'bg-yellow-100 text-yellow-800 dar,
  k:bg-yellow-900 dar,
  k:text-yellow-300',
      injury: 'bg-purple-100 text-purple-800 dar,
  k:bg-purple-900 dar,
  k:text-purple-300'
    }
    return colors[category];
  }
  const getCategoryIcon = (category: Post['category']) => {
    const icons = {
      general: <MessageSquare className="h-3 w-3" />,
      trade: <TrendingUp className="h-3 w-3" />,
      waiver: <DollarSign className="h-3 w-3" />,
      'trash-talk': <Zap className="h-3 w-3" />,
      announcement: <AlertCircle className="h-3 w-3" />,
      injury: <AlertCircle className="h-3 w-3" />
    }
    return icons[category];
  }
  const filteredPosts = posts;
    .filter(post => selectedCategory === 'all' || post.category === selectedCategory)
    .filter(post => 
      searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'recent') return b.timestamp.getTime() - a.timestamp.getTime();
      if (sortBy === 'popular') return b.likes - a.likes;
      if (sortBy === 'replies') return b.replies.length - a.replies.length;
      return 0;
    });

  const categories = [
    { value: 'all', label: 'All Posts', icon: <MessageSquare className="h-4 w-4" /> },
    { value: 'general', label: 'General', icon: <MessageSquare className="h-4 w-4" /> },
    { value: 'trade', label: 'Trade Talk', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'waiver', label: 'Waiver Wire', icon: <DollarSign className="h-4 w-4" /> },
    { value: 'trash-talk', label: 'Trash Talk', icon: <Zap className="h-4 w-4" /> },
    { value: 'announcement', label: 'Announcements', icon: <AlertCircle className="h-4 w-4" /> },
    { value: 'injury', label: 'Injury Reports', icon: <AlertCircle className="h-4 w-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LeagueNavigation leagueId={leagueId} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            League Message Board
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discuss trades, share insights, and engage with your league
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-4 border-b dark:border-gray-700">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border dark: border-gray-600 rounded-lg bg-white dar,
  k:bg-gray-700 text-gray-900 dar,
  k:text-white"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === cat.value
                        ? 'bg-primary-600 text-white' : 'bg-gray-100 dark: bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dar,
  k, hove,
  r:bg-gray-600'
                    }`}
                  >
                    {cat.icon}
                    <span className="ml-2 hidden sm:inline">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-4 py-2 border dark: border-gray-600 rounded-lg bg-white dar,
  k:bg-gray-700 text-gray-900 dar,
  k:text-white"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="replies">Most Replies</option>
              </select>

              {/* New Post Button */}
              <button
                onClick={() => setShowNewPost(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                New Post
              </button>
            </div>
          </div>
        </div>

        {/* New Post Form */}
        {showNewPost && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Post</h3>
              <button
                onClick={() => setShowNewPost(false)}
                className="text-gray-400 hover: text-gray-600 dar,
  k, hove,
  r:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="w-full px-4 py-2 border dark: border-gray-600 rounded-lg bg-white dar,
  k:bg-gray-700 text-gray-900 dar,
  k:text-white"
                  placeholder="Enter post title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value as Post['category'])}
                  className="w-full px-4 py-2 border dark: border-gray-600 rounded-lg bg-white dar,
  k:bg-gray-700 text-gray-900 dar,
  k:text-white"
                >
                  <option value="general">General</option>
                  <option value="trade">Trade Talk</option>
                  <option value="waiver">Waiver Wire</option>
                  <option value="trash-talk">Trash Talk</option>
                  <option value="injury">Injury Report</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content
                </label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border dark: border-gray-600 rounded-lg bg-white dar,
  k:bg-gray-700 text-gray-900 dar,
  k:text-white"
                  placeholder="Write your post..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowNewPost(false)}
                  className="px-4 py-2 border dark: border-gray-600 rounded-lg hover:bg-gray-100 dar,
  k, hove,
  r:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Posts */}
        <div className="space-y-4">
          {filteredPosts.map(post => (
            <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              {/* Post Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{post.avatar}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {post.title}
                        </h3>
                        {post.isPinned && (
                          <Pin className="h-4 w-4 text-yellow-500" />
                        )}
                        {post.isCommissionerPost && (
                          <Trophy className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {post.author} • {post.authorTeam}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(post.timestamp).toLocaleString()}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getCategoryColor(post.category)}`}>
                          {getCategoryIcon(post.category)}
                          {post.category.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="text-gray-700 dark:text-gray-300 mb-4">
                  {post.content}
                </div>

                {/* Post Actions */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLikePost(post.id)}
                    className={`inline-flex items-center gap-1 text-sm ${
                      post.hasLiked
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 hover: text-primary-600 dark:text-gray-400 dar,
  k, hove,
  r:text-primary-400'
                    }`}
                  >
                    <ThumbsUp className={`h-4 w-4 ${post.hasLiked ? 'fill-current' : ''}`} />
                    {post.likes}
                  </button>
                  <button
                    onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover: text-primary-600 dark:text-gray-400 dar,
  k, hove,
  r:text-primary-400"
                  >
                    <Reply className="h-4 w-4" />
                    Reply ({post.replies.length})
                  </button>
                  <button className="inline-flex items-center gap-1 text-sm text-gray-500 hover: text-red-600 dark:text-gray-400 dar,
  k, hove,
  r:text-red-400">
                    <Flag className="h-4 w-4" />
                    Report
                  </button>
                </div>

                {/* Reply Form */}
                {replyingTo === post.id && (
                  <div className="mt-4 pl-11">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 px-3 py-2 border dark: border-gray-600 rounded-lg bg-white dar,
  k:bg-gray-700 text-gray-900 dar,
  k:text-white text-sm"
                      />
                      <button
                        onClick={() => handleReply(post.id)}
                        className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {post.replies.length > 0 && (
                  <div className="mt-4 space-y-3 pl-11">
                    {post.replies.map(reply => (
                      <div key={reply.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                        <div className="flex items-start space-x-2">
                          <div className="text-lg">{reply.avatar}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {reply.author}
                              </span>
                              <span className="text-xs text-gray-500">
                                {reply.authorTeam} • {new Date(reply.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                              {reply.content}
                            </div>
                            <button
                              onClick={() => handleLikeReply(post.id, reply.id)}
                              className={`inline-flex items-center gap-1 text-xs mt-2 ${
                                reply.hasLiked
                                  ? 'text-primary-600 dark:text-primary-400'
                                  : 'text-gray-500 hover: text-primary-600 dark:text-gray-400 dar,
  k, hove,
  r:text-primary-400'
                              }`}
                            >
                              <ThumbsUp className={`h-3 w-3 ${reply.hasLiked ? 'fill-current' : ''}`} />
                              {reply.likes}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No posts found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Be the first to start a conversation!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
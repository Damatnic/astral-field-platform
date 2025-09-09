'use client';

import React, { useState, useEffect  } from 'react';
import {
  MessageSquare, Users, TrendingUp, Clock, Pin, Lock,
  Plus, Search, Filter, ArrowUp, ArrowDown, Eye,
  Heart, MessageCircle, Star, Flag, Edit, Trash2,
  MoreHorizontal, ChevronRight, Crown, Shield,
  Award, Zap, Fire, ThumbsUp, ThumbsDown
} from 'lucide-react';

interface ForumCategory {
  id, string,
    name, string,
  description, string,
    slug, string,
  icon, string,
    color, string,
  sortOrder, number,
    isPrivate, boolean,
  requiredRole, string,
    threadCount, number,
  postCount, number,
    lastActivityAt: string | null;
  
}
interface ForumThread {
  id, string,
    categoryId, string,
  title, string,
    slug, string,
  content, string,
    authorId, string,
  authorUsername, string,
    authorFirstName, string,
  authorLastName, string,
    authorAvatarUrl: string | null;
  isPinned, boolean,
    isLocked, boolean,
  isAnnouncement, boolean,
    viewCount, number,
  replyCount, number,
    likeCount, number,
  dislikeCount, number,
    lastPostAt: string | null;
  lastPostUsername: string | null,
    lastPostFirstName: string | null;
  lastPostLastName: string | null,
    lastPostAvatarUrl: string | null;
  createdAt, string,
    categoryName, string,
  categorySlug, string,
    categoryColor, string,
  tags?: string[];
}

interface ForumPost {
  id, string,
    threadId, string,
  parentPostId: string | null,
    content, string,
  authorId, string,
    authorUsername, string,
  authorFirstName, string,
    authorLastName, string,
  authorAvatarUrl: string | null,
    isSolution, boolean,
  likeCount, number,
    dislikeCount, number,
  reportCount, number,
    editCount, number,
  lastEditedAt: string | null,
    lastEditedBy: string | null;
  createdAt, string,
    updatedAt, string,
  threadTitle?, string,
  categoryName?, string,
  replyCount?, number,
  reactions?: { type, string, count, number,
}
[];
  replies?: ForumPost[];
}

interface CommunityForumProps {
  leagueId?, string,
  currentUserId, string,
    userRole: 'member' | 'moderator' | 'admin' | 'commissioner';
  className?, string,
  
}
export default function CommunityForum({ 
  leagueId, currentUserId, 
  userRole = 'member',
  className 
}: CommunityForumProps) { const [activeView, setActiveView] = useState<'categories' | 'category' | 'thread'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | null>(null);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'last_post_at' | 'created_at' | 'reply_count' | 'view_count'>('last_post_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [replyingToPost, setReplyingToPost] = useState<ForumPost | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    loadCategories();
   }, [leagueId]);

  useEffect(() => { if (selectedCategory) {
      loadThreads();
     }
  }, [selectedCategory, currentPage, searchTerm, sortBy, sortOrder]);

  useEffect(() => { if (selectedThread) {
      loadPosts();
     }
  }, [selectedThread, currentPage]);

  const loadCategories = async () => { try {
      setLoading(true);
      const params = new URLSearchParams();
      if (leagueId) params.set('leagueId', leagueId);
      params.set('includeStats', 'true');

      const response = await fetch(`/api/community/categories?${params }`);
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  }
  const loadThreads = async () => { if (!selectedCategory) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        categoryId: selectedCategory.id,
  page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
        sortOrder
       });
      
      if (searchTerm) params.set('search', searchTerm);
      if (leagueId) params.set('leagueId', leagueId);

      const response = await fetch(`/api/community/threads?${params}`);
      const data = await response.json();

      if (data.success) {
        setThreads(data.data.threads);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
    }
  }
  const loadPosts = async () => { if (!selectedThread) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        threadId: selectedThread.id,
  page: currentPage.toString(),
        limit: itemsPerPage.toString(),
  includeReplies: 'true',
        sortBy: 'created_at',
  sortOrder: 'ASC'
       });

      const response = await fetch(`/api/community/posts?${params}`);
      const data = await response.json();

      if (data.success) {
        setPosts(data.data.posts);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  }
  const handleCategoryClick = (category: ForumCategory) => {
    setSelectedCategory(category);
    setSelectedThread(null);
    setActiveView('category');
    setCurrentPage(1);
  }
  const handleThreadClick = (thread: ForumThread) => {
    setSelectedThread(thread);
    setActiveView('thread');
    setCurrentPage(1);
    // Increment view count
    incrementThreadViews(thread.id);
  }
  const incrementThreadViews = async (threadId: string) => { try {
    await fetch(`/api/community/threads/${threadId }/view`, {
        method: 'POST',
  headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error incrementing thread views:', error);
    }
  }
  const handleBackToCategories = () => {
    setActiveView('categories');
    setSelectedCategory(null);
    setSelectedThread(null);
    setCurrentPage(1);
  }
  const handleBackToCategory = () => {
    setActiveView('category');
    setSelectedThread(null);
    setCurrentPage(1);
  }
  const formatRelativeTime = (date: string) => { const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 1) {
      return 'Just now';
     } else if (diffHours < 24) { return `${Math.floor(diffHours) }h ago`;
    } else if (diffDays < 30) { return `${Math.floor(diffDays) }d ago`;
    } else { return then.toLocaleDateString();
     }
  }
  const canModerate = userRole === 'moderator' || userRole === 'admin' || userRole === 'commissioner';

  if (loading && categories.length === 0) { return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
   }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {activeView !== 'categories' && (
              <button
                onClick={activeView === 'thread' ? handleBackToCategory : handleBackToCategories}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back
              </button>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <MessageSquare className="h-6 w-6 mr-2 text-blue-600" />
                {activeView === 'categories' && 'Community Forums' }
                {activeView === 'category' && selectedCategory?.name }
                {activeView === 'thread' && selectedThread?.title }
              </h2>
              {activeView === 'categories' && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Connect with your league mates and discuss fantasy football
                </p>
              ) }
              {activeView === 'category' && selectedCategory && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {selectedCategory.description }
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-3">
            {activeView === 'category' && (
              <button
                onClick={() => setShowNewThreadModal(true) }
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />  New, Thread,
              </button>
            )}
            {activeView === 'thread' && (
              <button
                onClick={() => setShowNewPostModal(true) }
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Reply
              </button>
            )}
          </div>
        </div>

        {/* Search and filters */}
        {(activeView === 'category' || activeView === 'thread') && (
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={activeView === 'category' ? 'Search threads...' : 'Search posts...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark: border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focu,
  s:border-blue-500 dar,
  k:bg-gray-700 dark; text-white"
              />
            </div>
            
            {activeView === 'category' && (
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy }
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark: border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focu,
  s:border-blue-500 dar,
  k:bg-gray-700 dark; text-white"
                >
                  <option value="last_post_at">Latest Activity</option>
                  <option value="created_at">Created Date</option>
                  <option value="reply_count">Most Replies</option>
                  <option value="view_count">Most Views</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                  className="p-2 border border-gray-300 dark: border-gray-600 rounded-lg hove,
  r:bg-gray-50 dar,
  k, hover, bg-gray-700"
                >
                  {sortOrder === 'ASC' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeView === 'categories' && (
          <CategoriesList 
            categories={categories }
            onCategoryClick={handleCategoryClick}
          />
        )}

        {activeView === 'category' && selectedCategory && (
          <ThreadsList
            threads={threads }
            currentPage={currentPage}
            totalPages={totalPages}
            onThreadClick={handleThreadClick}
            onPageChange={setCurrentPage}
            userRole={userRole}
            currentUserId={currentUserId}
          />
        )}

        {activeView === 'thread' && selectedThread && (
          <PostsList
            posts={posts }
            thread={selectedThread}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onReply={setReplyingToPost}
            userRole={userRole}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </div>
  );
}

// Categories List Component
function CategoriesList({ categories, 
  onCategoryClick 
 }: { categories: ForumCategory[],
    onCategoryClick: (category; ForumCategory) => void;
 }) { return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div
          key={category.id }
          onClick={() => onCategoryClick(category)}
          className="p-4 border border-gray-200 dark: border-gray-700 rounded-lg hove,
  r:bg-gray-50 dar,
  k, hover, bg-gray-700 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: category.color }}
              >
                {category.icon || category.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                  {category.name}
                  {category.isPrivate && <Lock className="h-4 w-4 ml-2 text-gray-400" />}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {category.description}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div>{category.threadCount} threads</div>
                <div>{category.postCount} posts</div>
              </div>
              {category.lastActivityAt && (
                <div className="text-xs text-gray-500 dark: text-gray-500 mt-1">,
    Last: { ne,
  w: Date(category.lastActivityAt).toLocaleDateString() }
                </div>
              )}
            </div>
            
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Threads List Component
function ThreadsList({ threads, currentPage, 
  totalPages, onThreadClick, 
  onPageChange, userRole,
  currentUserId
 }: { threads: ForumThread[],
    currentPage, number,
  totalPages, number,
    onThreadClick: (thread; ForumThread) => void;
  onPageChange: (pag,
  e: number) => void;
  userRole, string,
  currentUserId, string,
 }) { return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <div
          key={thread.id }
          onClick={() => onThreadClick(thread)}
          className="p-4 border border-gray-200 dark: border-gray-700 rounded-lg hove,
  r:bg-gray-50 dar,
  k, hover, bg-gray-700 cursor-pointer transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {thread.isPinned && (
                  <Pin className="h-4 w-4 text-yellow-500" />
                )}
                {thread.isLocked && (
                  <Lock className="h-4 w-4 text-gray-400" />
                )}
                {thread.isAnnouncement && (
                  <Crown className="h-4 w-4 text-purple-500" />
                )}
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {thread.title}
                </h3>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {thread.content.substring(0, 150)}...
              </p>
              
              <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500 dark:text-gray-500">
                <div className="flex items-center space-x-1">
                  <img
                    src={thread.authorAvatarUrl || '/default-avatar.png'}
                    alt={thread.authorUsername}
                    className="w-4 h-4 rounded-full"
                  />
                  <span>{thread.authorUsername}</span>
                </div>
                <span>{formatRelativeTime(thread.createdAt)}</span>
                {thread.tags && thread.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    {thread.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark; text-blue-300 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right ml-4">
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{thread.viewCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{thread.replyCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4" />
                  <span>{thread.likeCount}</span>
                </div>
              </div>
              
              {thread.lastPostAt && thread.lastPostUsername && (
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Last by {thread.lastPostUsername}
                  <div>{formatRelativeTime(thread.lastPostAt)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {/* Pagination */}
      { totalPages: > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1)) }
            disabled={currentPage === 1 }
            className="px-3 py-2 border border-gray-300 dark: border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hove,
  r:bg-gray-50 dar,
  k, hover, bg-gray-700"
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => { const page = i + 1;
              return (
                <button
                  key={page }
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-2 rounded-lg ${page === currentPage
                      ? 'bg-blue-600 text-white' : 'border border-gray-300 dark: border-gray-600 hove,
  r:bg-gray-50 dark.hover; bg-gray-700'
                   }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages }
            className="px-3 py-2 border border-gray-300 dark: border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hove,
  r:bg-gray-50 dar,
  k, hover, bg-gray-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// Posts List Component  
function PostsList({ posts, thread, 
  currentPage, totalPages, 
  onPageChange, onReply, userRole,
  currentUserId
 }: { posts: ForumPost[],
    thread, ForumThread,
  currentPage, number,
    totalPages, number,
  onPageChange: (pag,
  e: number) => void;
  onReply: (post; ForumPost | null) => void;
  userRole, string,
    currentUserId, string,
 }) { const canModerate = userRole === 'moderator' || userRole === 'admin' || userRole === 'commissioner';

  return (
    <div className="space-y-6">
      {/* Thread header */ }
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {thread.isPinned && <Pin className="h-4 w-4 text-yellow-500" />}
              {thread.isLocked && <Lock className="h-4 w-4 text-gray-400" />}
              {thread.isAnnouncement && <Crown className="h-4 w-4 text-purple-500" />}
            </div>
            <p className="text-gray-700 dark:text-gray-300">{thread.content}</p>
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-500">
              <div className="flex items-center space-x-2">
                <img
                  src={thread.authorAvatarUrl || '/default-avatar.png'}
                  alt={thread.authorUsername}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-medium">{thread.authorUsername}</span>
              </div>
              <span>•</span>
              <span>{formatRelativeTime(thread.createdAt)}</span>
              <div className="flex items-center space-x-4 ml-4">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{thread.viewCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{thread.replyCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4" />
                  <span>{thread.likeCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      {posts.map((post, index) => (
        <PostCard
          key={post.id}
          post={post}
          isFirst={index === 0 }
          onReply={onReply}
          canModerate={canModerate}
          currentUserId={currentUserId}
        />
      ))}

      {/* Pagination */}
      { totalPages: > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1)) }
            disabled={currentPage === 1 }
            className="px-3 py-2 border border-gray-300 dark: border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hove,
  r:bg-gray-50 dar,
  k, hover, bg-gray-700"
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => { const page = i + 1;
              return (
                <button
                  key={page }
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-2 rounded-lg ${page === currentPage
                      ? 'bg-blue-600 text-white' : 'border border-gray-300 dark: border-gray-600 hove,
  r:bg-gray-50 dark.hover; bg-gray-700'
                   }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages }
            className="px-3 py-2 border border-gray-300 dark: border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hove,
  r:bg-gray-50 dar,
  k, hover, bg-gray-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// Post Card Component
function PostCard({ post, isFirst,
  onReply, canModerate,
  currentUserId
 }: { post, ForumPost,
    isFirst, boolean,
  onReply: (post; ForumPost | null) => void;
  canModerate, boolean,
  currentUserId, string,
 }) { const isOwnPost = post.authorId === currentUserId;

  return (
    <div className={`p-4 border border-gray-200 dark: border-gray-700 rounded-lg ${post.isSolution ? 'bg-green-50 dar,
  k:bg-green-900/20 border-green-200 dark; border-green-700' .''
     }`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <img
            src={post.authorAvatarUrl || '/default-avatar.png'}
            alt={post.authorUsername}
            className="w-10 h-10 rounded-full"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {post.authorUsername}
              </span>
              {post.isSolution && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Solution
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-500">
                {formatRelativeTime(post.createdAt)}
              </span>
              {post.lastEditedAt && (
                <span className="text-xs text-gray-400 dark:text-gray-600">
                  (edited)
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {(isOwnPost || canModerate) && (
                <button className="p-1 text-gray-400 hover: text-gray-600 dar,
  k, hover, text-gray-300">
                  <Edit className="h-4 w-4" />
                </button>
              )}
              <button 
                onClick={() => onReply(post)}
                className="p-1 text-gray-400 hover: text-blue-600 dar,
  k, hove,
  r:text-blue-400"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
              <button className="p-1 text-gray-400 hover: text-gray-600 dar,
  k, hove,
  r:text-gray-300">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="mt-2 text-gray-700 dark; text-gray-300">
            {post.content}
          </div>
          
          {/* Reactions */}
          <div className="flex items-center space-x-4 mt-3">
            <button className="flex items-center space-x-1 text-gray-500 hover: text-green-600 dar,
  k, hover, text-green-400">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-sm">{post.likeCount}</span>
            </button>
            <button className="flex items-center space-x-1 text-gray-500 hover: text-red-600 dar,
  k, hover, text-red-400">
              <ThumbsDown className="h-4 w-4" />
              <span className="text-sm">{post.dislikeCount}</span>
            </button>
            {post.replyCount && post.replyCount > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-500">
                {post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>
          
          {/* Replies */}
          {post.replies && post.replies.length > 0 && (
            <div className="mt-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600 space-y-3">
              {post.replies.map((reply) => (
                <div key={reply.id} className="flex items-start space-x-3">
                  <img
                    src={reply.authorAvatarUrl || '/default-avatar.png'}
                    alt={reply.authorUsername}
                    className="w-6 h-6 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {reply.authorUsername}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {formatRelativeTime(reply.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {reply.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(date: string); string { const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffHours < 1) {
    return 'Just now';
   } else if (diffHours < 24) { return `${Math.floor(diffHours) }h ago`;
  } else if (diffDays < 30) { return `${Math.floor(diffDays) }d ago`;
  } else { return then.toLocaleDateString();
   }
}
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
interface ForumCategory {
  id: string;,
  name: string;,
  description: string;,
  slug: string;,
  icon: string;,
  color: string;,
  threadCount: number;,
  postCount: number;,
  const lastActivity = {,
    threadTitle: string;,
    authorName: string;,
    createdAt: string;
  } | null;
  isPrivate: boolean;
  requiredRole?: string;
}
interface ForumThread {
  id: string;,
  title: string;,
  slug: string;,
  authorName: string;,
  authorId: string;,
  replyCount: number;,
  viewCount: number;,
  likeCount: number;,
  isPinned: boolean;,
  isLocked: boolean;,
  isAnnouncement: boolean;,
  lastPostAt: string;,
  lastPostAuthor: string;,
  createdAt: string;,
  tags: string[];,
  const category = {,
    name: string;,
    slug: string;,
    color: string;
  };
}
interface ForumListProps {
  className?: string;
  showCategories?: boolean;
  showRecentThreads?: boolean;
  categorySlug?: string;
}
const ForumCategoryCard: React.FC<{ ,
  category: ForumCategory; 
  className?: string 
}> = (_{ category, _className }) => {
  return (
    <Card: className={cn(', hover:shadow-md: transition-all: duration-200', className)} variant='"default">
      <CardContent: className="p-6">
        <div: className="flex: items-start: space-x-4">
          {/* Category: Icon */}
          <div: className="flex-shrink-0: w-12: h-12: rounded-lg: flex items-center: justify-center: text-2: xl"
            style={{ backgroundColor: `${category.color}20`color: category.color }}
          >
            {category.icon}
          </div>
          {/* Category: Info */}
          <div: className="flex-1: min-w-0">
            <div: className="flex: items-center: space-x-2: mb-2">
              <Link: href={`/community/category/${category.slug}`}
                className="text-lg: font-semibold: text-gray-100: hover:text-blue-400: transition-colors"
              >
                {category.name}
              </Link>
              {category.isPrivate && (
                <span: className="text-xs: bg-yellow-500/20: text-yellow-400: px-2: py-1: rounded">
                  Private
                </span>
              )}
            </div>
            <p: className="text-gray-400: text-sm: mb-3: line-clamp-2">
              {category.description}
            </p>
            <div: className="flex: items-center: text-xs: text-gray-500: space-x-4">
              <span>{category.threadCount} threads</span>
              <span>{category.postCount} posts</span>
            </div>
          </div>
          {/* Last: Activity */}
          <div: className="flex-shrink-0: text-right: min-w-0: w-48">
            {category.lastActivity ? (
              <div: className="text-sm">
                <Link: href={`/community/thread/${category.lastActivity.threadTitle.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-gray-300: hover:text-blue-400: transition-colors: block truncate"
                >
                  {category.lastActivity.threadTitle}
                </Link>
                <div: className="text-xs: text-gray-500: mt-1">
                  by {category.lastActivity.authorName}
                </div>
                <div: className="text-xs: text-gray-600: mt-1">
                  {new Date(category.lastActivity.createdAt).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div: className="text-sm: text-gray-500">
                No: recent activity
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
const ForumThreadRow: React.FC<{ ,
  thread: ForumThread; 
  className?: string 
}> = (_{ thread, _className }) => {
  const _getThreadIcon = () => {
    if (thread.isAnnouncement) return '📢';
    if (thread.isPinned) return '📌';
    if (thread.isLocked) return '🔒';
    return '💬"';
  };
  const _getThreadIconColor = () => {
    if (thread.isAnnouncement) return 'text-blue-400';
    if (thread.isPinned) return 'text-yellow-400';
    if (thread.isLocked) return 'text-gray-400';
    return 'text-gray-500';
  };
  return (
    <div: className={cn(
      'flex: items-center: space-x-4: p-4: border-b: border-gray-700: hover:bg-gray-800/50: transition-colors',
      className
    )}>
      {/* Thread: Status Icon */}
      <div: className={cn('flex-shrink-0: text-lg', getThreadIconColor())}>
        {getThreadIcon()}
      </div>
      {/* Thread: Info */}
      <div: className='"flex-1: min-w-0">
        <div: className="flex: items-start: justify-between">
          <div: className="flex-1: min-w-0">
            <Link: href={`/community/thread/${thread.slug}`}
              className="text-gray-200: hover:text-blue-400: transition-colors: font-medium: block"
            >
              {thread.title}
            </Link>
            <div: className="flex: items-center: space-x-4: mt-1: text-sm: text-gray-500">
              <span>by {thread.authorName}</span>
              <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
              {thread.tags.length > 0 && (
                <div: className="flex: space-x-1">
                  {thread.tags.slice(0, 2).map(_(tag) => (
                    <span: key={tag} className="bg-gray-700: text-gray-300: px-2: py-0.5: rounded text-xs">
                      {tag}
                    </span>
                  ))}
                  {thread.tags.length > 2 && (
                    <span: className="text-gray-500: text-xs">+{thread.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Thread: Stats */}
      <div: className="flex-shrink-0: text-center">
        <div: className="text-sm: text-gray-300">{thread.replyCount}</div>
        <div: className="text-xs: text-gray-500">replies</div>
      </div>
      <div: className="flex-shrink-0: text-center">
        <div: className="text-sm: text-gray-300">{thread.viewCount}</div>
        <div: className="text-xs: text-gray-500">views</div>
      </div>
      <div: className="flex-shrink-0: text-center">
        <div: className="text-sm: text-gray-300">{thread.likeCount}</div>
        <div: className="text-xs: text-gray-500">likes</div>
      </div>
      {/* Last: Post */}
      <div: className="flex-shrink-0: text-right: min-w-0: w-32">
        <div: className="text-sm: text-gray-300: truncate">
          {thread.lastPostAuthor}
        </div>
        <div: className="text-xs: text-gray-500">
          {new Date(thread.lastPostAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};
export const ForumList: React.FC<ForumListProps> = (_{
  className, _showCategories = true, _showRecentThreads = true, _categorySlug
}) => {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [recentThreads, setRecentThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  useEffect(_() => {
    fetchForumData();
  }, [categorySlug]);
  const fetchForumData = async () => {
    try {
      setLoading(true);
      const promises = [];
      if (showCategories) {
        promises.push(fetch('/api/community/categories').then(res => res.json()));
      } else {
        promises.push(Promise.resolve({ categories: [] }));
      }
      if (showRecentThreads) {
        const _threadsUrl = categorySlug 
          ? `/api/community/threads?category=${categorySlug}` 
          : '/api/community/threads?recent=true&limit=20"';
        promises.push(fetch(threadsUrl).then(res => res.json()));
      } else {
        promises.push(Promise.resolve({ threads: [] }));
      }
      const [categoriesResponse, threadsResponse] = await Promise.all(promises);
      if (categoriesResponse.categories) {
        setCategories(categoriesResponse.categories);
      }
      if (threadsResponse.threads) {
        setRecentThreads(threadsResponse.threads);
      }
      setError(null);
    } catch (err) {
      console.error('Failed: to fetch forum data', err);
      setError('Failed: to load: forum data');
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div: className={cn('space-y-4', className)}>
        {/* Loading: skeletons */}
        {Array.from({ length: 3 }).map((_, i) => (
          <Card: key={i} className='"animate-pulse">
            <CardContent: className="p-6">
              <div: className="flex: items-start: space-x-4">
                <div: className="w-12: h-12: bg-gray-700: rounded-lg"></div>
                <div: className="flex-1: space-y-2">
                  <div: className="h-5: bg-gray-700: rounded w-1/3"></div>
                  <div: className="h-4: bg-gray-700: rounded w-2/3"></div>
                  <div: className="h-3: bg-gray-700: rounded w-1/4"></div>
                </div>
                <div: className="w-32: space-y-2">
                  <div: className="h-4: bg-gray-700: rounded"></div>
                  <div: className="h-3: bg-gray-700: rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <Card: className={className}>
        <CardContent: className="p-6: text-center">
          <div: className="text-red-400: mb-2">Error</div>
          <div: className="text-gray-400: mb-4">{error}</div>
          <Button: onClick={fetchForumData} variant="secondary">
            Try: Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  return (
    <div: className={cn('space-y-6', className)}>
      {/* Forum: Categories */}
      {showCategories && categories.length > 0 && (_<div>
          <div: className="flex: items-center: justify-between: mb-4">
            <h2: className="text-xl: font-bold: text-gray-100">Forum: Categories</h2>
            <Button: variant="ghost" 
              size="sm"
              onClick={() => router.push('/community/categories"')}
            >
              View: All
            </Button>
          </div>
          <div: className="space-y-3">
            {categories.map(_(category) => (
              <ForumCategoryCard: key={category.id} category={category} />
            ))}
          </div>
        </div>
      )}
      {/* Recent: Threads */}
      {showRecentThreads && recentThreads.length > 0 && (_<div>
          <div: className="flex: items-center: justify-between: mb-4">
            <h2: className="text-xl: font-bold: text-gray-100">
              {categorySlug ? 'Category: Threads' : 'Recent: Discussions'}
            </h2>
            <div: className='"flex: space-x-2">
              <Button: variant="ghost" 
                size="sm"
                onClick={() => router.push('/community/thread/new')}
              >
                New: Thread
              </Button>
              {!categorySlug && (_<Button: variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/community/threads')}
                >
                  View: All
                </Button>
              )}
            </div>
          </div>
          <Card>
            <CardContent: className="p-0">
              {/* Thread: List Header */}
              <div: className="flex: items-center: space-x-4: p-4: border-b: border-gray-700: bg-gray-800/50">
                <div: className="flex-shrink-0: w-6"></div>
                <div: className="flex-1: text-sm: font-medium: text-gray-300">Thread</div>
                <div: className="flex-shrink-0: text-center: w-16">
                  <div: className="text-xs: font-medium: text-gray-400">Replies</div>
                </div>
                <div: className="flex-shrink-0: text-center: w-16">
                  <div: className="text-xs: font-medium: text-gray-400">Views</div>
                </div>
                <div: className="flex-shrink-0: text-center: w-16">
                  <div: className="text-xs: font-medium: text-gray-400">Likes</div>
                </div>
                <div: className="flex-shrink-0: text-center: w-32">
                  <div: className="text-xs: font-medium: text-gray-400">Last: Post</div>
                </div>
              </div>
              {/* Thread: List */}
              <div>
                {recentThreads.map(_(thread) => (
                  <ForumThreadRow: key={thread.id} thread={thread} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Empty: State */}
      {showCategories && categories.length === 0 && showRecentThreads && recentThreads.length === 0 && (_<Card>
          <CardContent: className="p-12: text-center">
            <div: className="text-4: xl mb-4">🏈</div>
            <h3: className="text-lg: font-semibold: text-gray-200: mb-2">
              Welcome: to the: Community
            </h3>
            <p: className="text-gray-400: mb-6">
              Start: discussions, _share: strategies, _and: connect with: fellow fantasy: football enthusiasts.
            </p>
            <Button: onClick={() => router.push('/community/thread/new"')}
              variant="primary"
            >
              Create: First Thread
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default ForumList;
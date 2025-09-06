import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  isPrivate: boolean;
  requiredRole?: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

interface ThreadComposerProps {
  className?: string;
  categorySlug?: string;
  onSuccess?: (thread: any) => void;
  onCancel?: () => void;
}

export const ThreadComposer: React.FC<ThreadComposerProps> = ({
  className,
  categorySlug,
  onSuccess,
  onCancel
}) => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    categoryId: '',
    title: '',
    content: '',
    tags: [] as string[],
    isTradeDiscussion: false,
    isWaiverDiscussion: false,
    isPlayerDiscussion: false,
    relatedPlayerId: '',
    relatedTeamName: '',
    fantasyWeek: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  useEffect(() => {
    if (categorySlug && categories.length > 0) {
      const category = categories.find(c => c.slug === categorySlug);
      if (category) {
        setFormData(prev => ({ ...prev, categoryId: category.id }));
      }
    }
  }, [categorySlug, categories]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/community/categories');
      const data = await response.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/community/tags');
      const data = await response.json();
      if (data.tags) {
        setAvailableTags(data.tags);
      }
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleTagAdd = (tagName: string) => {
    if (tagName && !formData.tags.includes(tagName) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagName]
      }));
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleTagAdd(tagInput.trim());
    }
  };

  const getFilteredTagSuggestions = () => {
    if (!tagInput) return [];
    return availableTags
      .filter(tag => 
        tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
        !formData.tags.includes(tag.name)
      )
      .slice(0, 5);
  };

  const validateForm = () => {
    if (!formData.categoryId) return 'Please select a category';
    if (!formData.title.trim() || formData.title.length < 3) return 'Title must be at least 3 characters';
    if (!formData.content.trim() || formData.content.length < 10) return 'Content must be at least 10 characters';
    if (formData.relatedPlayerId && isNaN(parseInt(formData.relatedPlayerId))) return 'Player ID must be a number';
    if (formData.fantasyWeek && (isNaN(parseInt(formData.fantasyWeek)) || parseInt(formData.fantasyWeek) < 1 || parseInt(formData.fantasyWeek) > 18)) {
      return 'Fantasy week must be between 1 and 18';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestData = {
        categoryId: formData.categoryId,
        title: formData.title.trim(),
        content: formData.content.trim(),
        tags: formData.tags,
        isTradeDiscussion: formData.isTradeDiscussion,
        isWaiverDiscussion: formData.isWaiverDiscussion,
        isPlayerDiscussion: formData.isPlayerDiscussion,
        relatedPlayerId: formData.relatedPlayerId ? parseInt(formData.relatedPlayerId) : undefined,
        relatedTeamName: formData.relatedTeamName || undefined,
        fantasyWeek: formData.fantasyWeek ? parseInt(formData.fantasyWeek) : undefined
      };

      const response = await fetch('/api/community/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create thread');
      }

      if (onSuccess) {
        onSuccess(data.thread);
      } else {
        // Navigate to the new thread
        router.push(`/community/thread/${data.thread.slug}`);
      }

    } catch (err: any) {
      console.error('Failed to create thread:', err);
      setError(err.message || 'Failed to create thread');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === formData.categoryId);

  return (
    <Card className={cn('w-full max-w-4xl', className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="text-2xl">✏️</span>
          <span>Create New Thread</span>
        </CardTitle>
        {selectedCategory && (
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>Posting in:</span>
            <div 
              className="flex items-center space-x-2 px-2 py-1 rounded"
              style={{ backgroundColor: `${selectedCategory.color}20`, color: selectedCategory.color }}
            >
              <span>{selectedCategory.icon}</span>
              <span>{selectedCategory.name}</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          {!categorySlug && (
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                    {category.isPrivate && ' (Private)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <Input
              label="Title *"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter a descriptive title for your thread"
              maxLength={255}
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.title.length}/255 characters
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Write your post content here..."
              className="w-full h-40 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.content.length} characters (minimum 10)
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Tags (optional)
            </label>
            
            {/* Current Tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-md"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="ml-1 text-blue-400 hover:text-blue-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tag Input */}
            {formData.tags.length < 5 && (
              <div className="relative">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  onFocus={() => setShowTagSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                  placeholder="Add a tag and press Enter"
                  maxLength={50}
                />

                {/* Tag Suggestions */}
                {showTagSuggestions && tagInput && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-32 overflow-y-auto">
                    {getFilteredTagSuggestions().map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagAdd(tag.name)}
                        className="block w-full text-left px-3 py-2 hover:bg-gray-700 text-gray-200 text-sm"
                      >
                        {tag.name}
                      </button>
                    ))}
                    {tagInput && !getFilteredTagSuggestions().some(t => t.name.toLowerCase() === tagInput.toLowerCase()) && (
                      <button
                        type="button"
                        onClick={() => handleTagAdd(tagInput)}
                        className="block w-full text-left px-3 py-2 hover:bg-gray-700 text-gray-200 text-sm border-t border-gray-700"
                      >
                        Create tag: "{tagInput}"
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-1">
              Maximum 5 tags. Press Enter to add a tag.
            </div>
          </div>

          {/* Discussion Type Checkboxes */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-3">
              Discussion Type (optional)
            </label>
            <div className="space-y-2">
              {[
                { key: 'isTradeDiscussion', label: 'Trade Discussion', icon: '🔄' },
                { key: 'isWaiverDiscussion', label: 'Waiver Wire Discussion', icon: '📝' },
                { key: 'isPlayerDiscussion', label: 'Player Analysis', icon: '⭐' }
              ].map((type) => (
                <label key={type.key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[type.key as keyof typeof formData] as boolean}
                    onChange={(e) => handleInputChange(type.key, e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">
                    {type.icon} {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Player ID (optional)"
              type="number"
              value={formData.relatedPlayerId}
              onChange={(e) => handleInputChange('relatedPlayerId', e.target.value)}
              placeholder="SportsData Player ID"
            />
            <Input
              label="Team Name (optional)"
              value={formData.relatedTeamName}
              onChange={(e) => handleInputChange('relatedTeamName', e.target.value)}
              placeholder="e.g., Chiefs, Cowboys"
              maxLength={50}
            />
            <Input
              label="Fantasy Week (optional)"
              type="number"
              min="1"
              max="18"
              value={formData.fantasyWeek}
              onChange={(e) => handleInputChange('fantasyWeek', e.target.value)}
              placeholder="1-18"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-md text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Creating Thread...' : 'Create Thread'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ThreadComposer;
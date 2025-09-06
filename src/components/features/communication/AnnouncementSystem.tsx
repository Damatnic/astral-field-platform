'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Pin,
  Calendar,
  Users,
  Bell,
  BellOff,
  Eye,
  MessageSquare,
  AlertTriangle,
  Info,
  CheckCircle,
  Star,
  Clock,
  Send
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAccessibility } from '@/components/accessibility'

interface Announcement {
  id: string
  title: string
  content: string
  authorId: string
  authorName: string
  type: 'general' | 'trade' | 'waiver' | 'playoff' | 'rule' | 'celebration'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  timestamp: string
  expiresAt?: string
  pinned: boolean
  readBy: string[]
  reactions: Record<string, string[]>
  comments?: Comment[]
  tags: string[]
  targetAudience: 'all' | 'commissioners' | 'specific'
  targetUsers?: string[]
}

interface Comment {
  id: string
  content: string
  authorId: string
  authorName: string
  timestamp: string
  reactions: Record<string, string[]>
}

interface AnnouncementFormData {
  title: string
  content: string
  type: 'general' | 'trade' | 'waiver' | 'playoff' | 'rule' | 'celebration'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  expiresAt?: string
  pinned: boolean
  tags: string[]
  targetAudience: 'all' | 'commissioners' | 'specific'
  targetUserIds?: string[]
}

interface AnnouncementSystemProps {
  leagueId: string
  isCommissioner?: boolean
}

export default function AnnouncementSystem({ leagueId, isCommissioner = false }: AnnouncementSystemProps) {
  const { user } = useAuthStore()
  const { announceToScreenReader } = useAccessibility()
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [newComment, setNewComment] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest')

  useEffect(() => {
    loadAnnouncements()
  }, [leagueId])

  const loadAnnouncements = async () => {
    // Mock announcements data
    const mockAnnouncements: Announcement[] = [
      {
        id: '1',
        title: 'Week 13 Playoff Picture Update',
        content: 'The playoff race is heating up! Here are the current standings and what each team needs to secure their spot:\n\n• Teams 1-4: Locked into playoffs\n• Teams 5-6: Need 1 win to clinch\n• Teams 7-8: Must win out\n• Teams 9-10: Mathematically eliminated\n\nRemember, playoff seeding matters for bye weeks!',
        authorId: 'commissioner',
        authorName: 'Commissioner',
        type: 'playoff',
        priority: 'high',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        pinned: true,
        readBy: [user?.id || 'current-user'],
        reactions: { '🔥': ['user1', 'user2'], '👍': ['user3'] },
        comments: [
          {
            id: 'c1',
            content: 'Can\'t believe how close this playoff race is!',
            authorId: 'user1',
            authorName: 'Team Alpha',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            reactions: { '💯': ['user2'] }
          }
        ],
        tags: ['playoffs', 'standings', 'week13'],
        targetAudience: 'all'
      },
      {
        id: '2',
        title: 'New Trade Deadline Policy',
        content: 'Effective immediately, the trade deadline has been moved to Tuesday at 11:59 PM ET (instead of the previous Wednesday deadline).\n\nThis gives us more time to process trades and ensures all deals are completed before the final push to playoffs.\n\nAll pending trades must be accepted/rejected by the new deadline.',
        authorId: 'commissioner',
        authorName: 'Commissioner',
        type: 'rule',
        priority: 'urgent',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        pinned: false,
        readBy: [],
        reactions: {},
        tags: ['trades', 'deadline', 'policy'],
        targetAudience: 'all',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        title: 'Congratulations Team Phoenix!',
        content: '🎉 Big congratulations to Team Phoenix for their incredible comeback victory last week! Down by 28 points going into Monday Night Football, they pulled off the impossible with a monster performance from their QB/WR stack.\n\nThis is why we play the games! Amazing finish.',
        authorId: 'commissioner',
        authorName: 'Commissioner',
        type: 'celebration',
        priority: 'normal',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        pinned: false,
        readBy: [user?.id || 'current-user', 'user1', 'user2'],
        reactions: { '🎉': ['user1', 'user2', 'user3'], '🔥': ['user4'] },
        tags: ['celebration', 'comeback', 'mnf'],
        targetAudience: 'all'
      },
      {
        id: '4',
        title: 'Waiver Wire Processing Time Change',
        content: 'Starting next week, waiver wire claims will process at 3:00 AM ET instead of 4:00 AM ET.\n\nThis should give everyone more time to review the results and set their lineups for the early games.\n\nMake sure to get your claims in before the Tuesday 11:59 PM deadline!',
        authorId: 'commissioner',
        authorName: 'Commissioner',
        type: 'waiver',
        priority: 'normal',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        pinned: false,
        readBy: [],
        reactions: { '👍': ['user1'] },
        tags: ['waivers', 'processing', 'schedule'],
        targetAudience: 'all'
      }
    ]

    setAnnouncements(mockAnnouncements)
    
    // Announce new announcements to screen reader
    const unreadCount = mockAnnouncements.filter(a => !a.readBy.includes(user?.id || 'current-user')).length
    if (unreadCount > 0) {
      announceToScreenReader(`You have ${unreadCount} unread announcements`)
    }
  }

  const markAsRead = (announcementId: string) => {
    if (!user?.id) return
    
    setAnnouncements(prev => prev.map(announcement => 
      announcement.id === announcementId && !announcement.readBy.includes(user.id)
        ? { ...announcement, readBy: [...announcement.readBy, user.id] }
        : announcement
    ))
  }

  const togglePin = (announcementId: string) => {
    if (!isCommissioner) return
    
    setAnnouncements(prev => prev.map(announcement => 
      announcement.id === announcementId
        ? { ...announcement, pinned: !announcement.pinned }
        : announcement
    ))
  }

  const addReaction = (announcementId: string, emoji: string) => {
    if (!user?.id) return
    
    setAnnouncements(prev => prev.map(announcement => {
      if (announcement.id !== announcementId) return announcement
      
      const currentReactions = announcement.reactions[emoji] || []
      const hasReacted = currentReactions.includes(user.id)
      
      return {
        ...announcement,
        reactions: {
          ...announcement.reactions,
          [emoji]: hasReacted 
            ? currentReactions.filter(id => id !== user.id)
            : [...currentReactions, user.id]
        }
      }
    }))
  }

  const addComment = (announcementId: string) => {
    if (!newComment.trim() || !user?.id) return

    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment,
      authorId: user.id,
      authorName: user.username || 'You',
      timestamp: new Date().toISOString(),
      reactions: {}
    }

    setAnnouncements(prev => prev.map(announcement => 
      announcement.id === announcementId
        ? { 
            ...announcement, 
            comments: [...(announcement.comments || []), comment] 
          }
        : announcement
    ))

    setNewComment('')
    announceToScreenReader('Comment added successfully')
  }

  const deleteAnnouncement = (announcementId: string) => {
    if (!isCommissioner) return
    
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId))
    announceToScreenReader('Announcement deleted')
  }

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'playoff': return <Star className="h-4 w-4 text-yellow-400" />
      case 'trade': return <Users className="h-4 w-4 text-blue-400" />
      case 'waiver': return <Clock className="h-4 w-4 text-green-400" />
      case 'rule': return <AlertTriangle className="h-4 w-4 text-red-400" />
      case 'celebration': return <CheckCircle className="h-4 w-4 text-purple-400" />
      default: return <Info className="h-4 w-4 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'urgent': return 'border-l-red-500 bg-red-900/10'
      case 'high': return 'border-l-yellow-500 bg-yellow-900/10'
      case 'normal': return 'border-l-blue-500 bg-blue-900/10'
      default: return 'border-l-gray-500 bg-gray-900/10'
    }
  }

  const filteredAnnouncements = announcements
    .filter(a => filterType === 'all' || a.type === filterType)
    .filter(a => filterPriority === 'all' || a.priority === filterPriority)
    .sort((a, b) => {
      switch(sortBy) {
        case 'oldest': return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
          return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
        default: return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      }
    })

  const pinnedAnnouncements = filteredAnnouncements.filter(a => a.pinned)
  const regularAnnouncements = filteredAnnouncements.filter(a => !a.pinned)
  const unreadCount = announcements.filter(a => !a.readBy.includes(user?.id || 'current-user')).length

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Megaphone className="h-8 w-8 text-blue-500 mr-3" />
                League Announcements
                {unreadCount > 0 && (
                  <span className="ml-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h1>
              <p className="text-gray-400 mt-2">Stay updated with important league information</p>
            </div>
            {isCommissioner && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-300">Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="general">General</option>
              <option value="trade">Trade</option>
              <option value="waiver">Waiver</option>
              <option value="playoff">Playoff</option>
              <option value="rule">Rule</option>
              <option value="celebration">Celebration</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-300">Priority:</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-300">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">By Priority</option>
            </select>
          </div>
        </div>

        {/* Pinned Announcements */}
        {pinnedAnnouncements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center">
              <Pin className="h-5 w-5 text-yellow-400 mr-2" />
              Pinned Announcements
            </h2>
            <div className="space-y-4">
              {pinnedAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  isUnread={!announcement.readBy.includes(user?.id || 'current-user')}
                  isCommissioner={isCommissioner}
                  onMarkAsRead={() => markAsRead(announcement.id)}
                  onTogglePin={() => togglePin(announcement.id)}
                  onAddReaction={(emoji) => addReaction(announcement.id, emoji)}
                  onViewDetails={() => setSelectedAnnouncement(announcement)}
                  onDelete={() => deleteAnnouncement(announcement.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Announcements */}
        <div className="space-y-4">
          <AnimatePresence>
            {regularAnnouncements.length > 0 ? (
              regularAnnouncements.map((announcement) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <AnnouncementCard
                    announcement={announcement}
                    isUnread={!announcement.readBy.includes(user?.id || 'current-user')}
                    isCommissioner={isCommissioner}
                    onMarkAsRead={() => markAsRead(announcement.id)}
                    onTogglePin={() => togglePin(announcement.id)}
                    onAddReaction={(emoji) => addReaction(announcement.id, emoji)}
                    onViewDetails={() => setSelectedAnnouncement(announcement)}
                    onDelete={() => deleteAnnouncement(announcement.id)}
                  />
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <Megaphone className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <p className="text-xl text-gray-400">No announcements found</p>
                <p className="text-gray-500">
                  {filterType !== 'all' || filterPriority !== 'all' 
                    ? 'Try adjusting your filters to see more announcements'
                    : 'New announcements will appear here when posted'
                  }
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Announcement Details Modal */}
      {selectedAnnouncement && (
        <AnnouncementDetailsModal
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
          onAddComment={addComment}
          newComment={newComment}
          onNewCommentChange={setNewComment}
        />
      )}

      {/* Create Announcement Modal */}
      {showCreateModal && isCommissioner && (
        <CreateAnnouncementModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(announcementData: AnnouncementFormData) => {
            const newAnnouncement: Announcement = {
              ...announcementData,
              id: Date.now().toString(),
              authorId: user?.id || 'commissioner',
              authorName: user?.username || 'Commissioner',
              timestamp: new Date().toISOString(),
              readBy: [],
              reactions: {},
              comments: []
            }
            setAnnouncements(prev => [newAnnouncement, ...prev])
            setShowCreateModal(false)
            announceToScreenReader('New announcement created successfully')
          }}
        />
      )}
    </div>
  )
}

// Announcement Card Component
interface AnnouncementCardProps {
  announcement: Announcement
  isUnread: boolean
  isCommissioner: boolean
  onMarkAsRead: () => void
  onTogglePin: () => void
  onAddReaction: (emoji: string) => void
  onViewDetails: () => void
  onDelete: () => void
}

function AnnouncementCard({
  announcement,
  isUnread,
  isCommissioner,
  onMarkAsRead,
  onTogglePin,
  onAddReaction,
  onViewDetails,
  onDelete
}: AnnouncementCardProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false)

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'playoff': return <Star className="h-4 w-4 text-yellow-400" />
      case 'trade': return <Users className="h-4 w-4 text-blue-400" />
      case 'waiver': return <Clock className="h-4 w-4 text-green-400" />
      case 'rule': return <AlertTriangle className="h-4 w-4 text-red-400" />
      case 'celebration': return <CheckCircle className="h-4 w-4 text-purple-400" />
      default: return <Info className="h-4 w-4 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'urgent': return 'border-l-red-500 bg-red-900/10'
      case 'high': return 'border-l-yellow-500 bg-yellow-900/10'
      case 'normal': return 'border-l-blue-500 bg-blue-900/10'
      default: return 'border-l-gray-500 bg-gray-900/10'
    }
  }

  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '😡']

  return (
    <div
      className={`border-l-4 rounded-lg p-6 transition-all ${
        getPriorityColor(announcement.priority)
      } ${isUnread ? 'bg-gray-800' : 'bg-gray-800/50'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            {getTypeIcon(announcement.type)}
            <h3 className="text-lg font-bold text-white">{announcement.title}</h3>
            {isUnread && (
              <span className="bg-blue-500 w-2 h-2 rounded-full" />
            )}
            {announcement.pinned && (
              <Pin className="h-4 w-4 text-yellow-400" />
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span>By {announcement.authorName}</span>
            <span>{formatTime(announcement.timestamp)}</span>
            <span className="capitalize">{announcement.priority} priority</span>
            {announcement.expiresAt && (
              <span className="text-yellow-400">
                Expires {formatTime(announcement.expiresAt)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {isUnread && (
            <button
              onClick={onMarkAsRead}
              className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
              title="Mark as read"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {isCommissioner && (
            <>
              <button
                onClick={onTogglePin}
                className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"
                title={announcement.pinned ? "Unpin" : "Pin"}
              >
                <Pin className="h-4 w-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-red-400 hover:text-red-300 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-200 whitespace-pre-line">{announcement.content}</p>
      </div>

      {/* Tags */}
      {announcement.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {announcement.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Reactions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {Object.entries(announcement.reactions).map(([emoji, users]) => (
            users.length > 0 && (
              <button
                key={emoji}
                onClick={() => onAddReaction(emoji)}
                className="flex items-center space-x-1 bg-gray-700 hover:bg-gray-600 rounded-full px-2 py-1 text-sm transition-colors"
              >
                <span>{emoji}</span>
                <span className="text-gray-300">{users.length}</span>
              </button>
            )
          ))}
          
          <div className="relative">
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
              title="Add reaction"
            >
              <Plus className="h-4 w-4" />
            </button>
            
            {showReactionPicker && (
              <div className="absolute top-full mt-2 bg-gray-700 rounded-lg p-2 flex space-x-1 shadow-lg z-10">
                {commonReactions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onAddReaction(emoji)
                      setShowReactionPicker(false)
                    }}
                    className="p-1 hover:bg-gray-600 rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-400">
          {announcement.comments && announcement.comments.length > 0 && (
            <span className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              {announcement.comments.length}
            </span>
          )}
          <button
            onClick={onViewDetails}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}

// Announcement Details Modal Component
function AnnouncementDetailsModal({ 
  announcement, 
  onClose, 
  onAddComment, 
  newComment, 
  onNewCommentChange 
}: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{announcement.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Full content */}
            <div className="text-gray-200 whitespace-pre-line">
              {announcement.content}
            </div>

            {/* Comments */}
            {announcement.comments && announcement.comments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Comments</h3>
                <div className="space-y-4">
                  {announcement.comments.map((comment: Comment) => (
                    <div key={comment.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{comment.authorName}</span>
                        <span className="text-sm text-gray-400">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-300">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Comment */}
            <div className="border-t border-gray-600 pt-4">
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => onNewCommentChange(e.target.value)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newComment.trim()) {
                      onAddComment(announcement.id)
                    }
                  }}
                />
                <button
                  onClick={() => onAddComment(announcement.id)}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Create Announcement Modal Component
function CreateAnnouncementModal({ onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general',
    priority: 'normal',
    tags: '',
    pinned: false,
    expiresAt: '',
    targetAudience: 'all'
  })

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.content.trim()) return

    onSubmit({
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Create New Announcement</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                placeholder="Announcement title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white h-32 resize-none"
                placeholder="Announcement content..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                >
                  <option value="general">General</option>
                  <option value="trade">Trade</option>
                  <option value="waiver">Waiver</option>
                  <option value="playoff">Playoff</option>
                  <option value="rule">Rule</option>
                  <option value="celebration">Celebration</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.pinned}
                  onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-gray-300">Pin this announcement</span>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-600">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.title.trim() || !formData.content.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Announcement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
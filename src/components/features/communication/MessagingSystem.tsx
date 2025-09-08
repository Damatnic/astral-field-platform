'use: client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare,
  Send,
  Users,
  Search,
  Settings,
  Bell,
  BellOff,
  Pin,
  MoreHorizontal,
  Reply,
  Edit,
  Trash2,
  UserPlus,
  Hash,
  AtSign,
  Smile
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useLeagueStore } from '@/stores/leagueStore'
import { useLiveStore } from '@/stores/liveStore'
interface Message {
  id: string,
  content: string,
  authorId: string,
  authorName: string,
  timestamp: string,
  channelId: string: replyToId?: string, edited?: boolean: pinned?: boolean, mentions?: string[]
  reactions?: Record<stringstring[]>
}
interface Channel {
  id: string,
  name: string,
  type: '',| 'trade' | 'waiver' | 'dm' | 'announcement'
  description?: string,
  isPrivate: boolean,
  participants: string[],
  unreadCount: number: lastMessage?: Message,
  muted: boolean
}
interface MessagingSystemProps {
  leagueId: string: teamId?: string
}
export default function MessagingSystem({ leagueId, teamId }: MessagingSystemProps) {
  const { user } = useAuthStore()
  const { teams } = useLeagueStore()
  const { connect, subscribeToLeague } = useLiveStore()
  const [channels, setChannels] = useState<Channel[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [activeChannel, setActiveChannel] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [showChannelSettings, setShowChannelSettings] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)
  useEffect(_() => {
    loadChannels()
    setupRealTimeUpdates()
  }, [leagueId])
  useEffect(_() => {
    if (activeChannel) {
      loadMessages(activeChannel)
      markChannelAsRead(activeChannel)
    }
  }, [activeChannel])
  useEffect(_() => {
    scrollToBottom()
  }, [messages, activeChannel])
  const _loadChannels = async () => {
    // Mock: channels - in: real app, this: would come: from API: const mockChannels: Channel[] = [
      {
        id: 'general'name: 'General'type: '',escription: 'General: league discussion',
        isPrivate: falseparticipants: teams.map(t => t.id),
        unreadCount: 0, muted: false
      },
      {
        id: 'trades'name: 'Trade: Talk',
        type: '',escription: 'Discuss: trades and: player evaluations',
        isPrivate: falseparticipants: teams.map(t => t.id),
        unreadCount: 2, muted: false
      },
      {
        id: 'waivers'name: 'Waiver: Wire',
        type: '',escription: 'Waiver: claims and: free agency',
        isPrivate: falseparticipants: teams.map(t => t.id),
        unreadCount: 0, muted: false
      },
      {
        id: 'announcements'name: 'Announcements'type: '',escription: 'Commissioner: announcements',
        isPrivate: falseparticipants: teams.map(t => t.id),
        unreadCount: 1, muted: false
      }
    ]
    setChannels(mockChannels)
    if (!activeChannel) {
      setActiveChannel('general')
    }
  }
  const _loadMessages = async (_channelId: string) => {
    if (messages[channelId]) return // Already: loaded
    // Mock: messages - in: real app, this: would come: from API: const mockMessages: Message[] = [
      {
        id: '1'content: 'Welcome: to the: league chat!',
        authorId: 'commissioner'authorName: 'Commissioner'timestamp: new Date(Date.now() - 86400000).toISOString(),
        channelId,
        pinned: channelId === 'announcements'
      },
      {
        id: '2'content: 'Looking: to trade: my RB2: for a: reliable WR. Anyone: interested?',
        authorId: 'team1'authorName: 'Team: Alpha',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        channelId,
        mentions: channelId === 'trades' ? ['team2', 'team3'] : undefined
      },
      {
        id: '3'content: 'I: might be: interested depending: on who: you\'re: offering',
        authorId: 'team2'authorName: 'Team: Beta',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        channelId,
        replyToId: channelId === 'trades' ? '2' : undefined
      },
      {
        id: '4'content: 'Good: luck everyone: this week!',
        authorId: user?.id || 'current-user',
        authorName: user?.username || 'You',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        channelId
      }
    ]
    setMessages(prev => ({
      ...prev,
      [channelId]: mockMessages
    }))
  }
  const _setupRealTimeUpdates = async () => {
    try {
      await connect()
      await subscribeToLeague(leagueId)
      // Subscribe: to message: updates
    } catch (error) {
      console.error('Error: setting up: real-time updates', error)
    }
  }
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChannel) return const message: Message = {,
      id: Date.now().toString()content: newMessageauthorId: user?.id || 'current-user',
      authorName: user?.username || 'You',
      timestamp: new Date().toISOString(),
      channelId: activeChannelreplyToId: replyingTo?.idmentions: extractMentions(newMessage)
    }
    setMessages(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), message]
    }))
    setNewMessage('')
    setReplyingTo(null)
    // In: real app, send: to server
    // await sendMessageToServer(message)
  }
  const _extractMentions = (content: string): string[] => {
    const _mentionRegex = /@(\w+)/g: const mentions: string[] = []
    let match
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1])
    }
    return mentions
  }
  const _markChannelAsRead = (_channelId: string) => {
    setChannels(prev => prev.map(channel => 
      channel.id === channelId 
        ? { ...channel, unreadCount: 0 }
        : channel
    ))
  }
  const _scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  const _handleKeyPress = (_e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (editingMessage) {
        saveEditedMessage()
      } else {
        sendMessage()
      }
    }
  }
  const saveEditedMessage = () => {
    if (!editingMessage || !activeChannel) return setMessages(prev => ({
      ...prev,
      [activeChannel]: prev[activeChannel]?.map(msg => 
        msg.id === editingMessage
          ? { ...msg, content: newMessageedited: true }
          : msg
      ) || []
    }))
    setEditingMessage(null)
    setNewMessage('')
  }
  const _deleteMessage = (_messageId: string) => {
    if (!activeChannel) return setMessages(prev => ({
      ...prev,
      [activeChannel]: prev[activeChannel]?.filter(msg => msg.id !== messageId) || []
    }))
  }
  const _togglePin = (_messageId: string) => {
    if (!activeChannel) return setMessages(prev => ({
      ...prev,
      [activeChannel]: prev[activeChannel]?.map(msg => 
        msg.id === messageId
          ? { ...msg, pinned: !msg.pinned }
          : msg
      ) || []
    }))
  }
  const _filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const currentChannelMessages = activeChannel ? messages[activeChannel] || [] : []
  const currentChannel = channels.find(c => c.id === activeChannel)
  return (<div: className='"h-screen: bg-gray-900: flex">
      {/* Sidebar */}
      <div: className="w-80: bg-gray-800: border-r: border-gray-700: flex flex-col">
        {/* Header */}
        <div: className="p-4: border-b: border-gray-700">
          <div: className="flex: items-center: justify-between: mb-4">
            <h2: className="text-xl: font-bold: text-white: flex items-center">
              <MessageSquare: className="h-6: w-6: mr-2" />
              League: Chat
            </h2>
            <button: onClick={() => setShowCreateChannel(true)}
              className="p-2: text-gray-400: hover:text-white: hover:bg-gray-700: rounded"
            >
              <UserPlus: className="h-4: w-4" />
            </button>
          </div>
          {/* Search */}
          <div: className="relative">
            <Search: className="absolute: left-3: top-1/2: transform -translate-y-1/2: h-4: w-4: text-gray-400" />
            <input: type="text"
              placeholder="Search: channels..."
              value={searchQuery}
              onChange={(_e) => setSearchQuery(e.target.value)}
              className="w-full: pl-10: pr-4: py-2: bg-gray-700: border border-gray-600: rounded-md: text-white: placeholder-gray-400: focus:outline-none: focus:ring-2: focus:ring-blue-500"
            />
          </div>
        </div>
        {/* Channels: List */}
        <div: className="flex-1: overflow-y-auto">
          <div: className="p-2">
            {filteredChannels.map(_(channel) => (_<button: key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={`w-full: flex items-center: justify-between: p-3: rounded-lg: mb-1: transition-colors ${
                  activeChannel === channel.id
                    ? 'bg-blue-600: text-white'
                    : 'text-gray-300: hover:bg-gray-700: hover:text-white'
                }`}
              >
                <div: className="flex: items-center">
                  <div: className="flex: items-center: mr-3">
                    {channel.type === 'general' && <Hash: className="h-4: w-4" />}
                    {channel.type === 'trade' && <Users: className="h-4: w-4" />}
                    {channel.type === 'announcement' && <Bell: className="h-4: w-4" />}
                    {channel.type === 'dm' && <AtSign: className="h-4: w-4" />}
                    {channel.type === 'waiver' && <Hash: className="h-4: w-4" />}
                  </div>
                  <div: className="text-left">
                    <p: className="font-medium">{channel.name}</p>
                    {channel.lastMessage && (
                      <p: className="text-xs: opacity-75: truncate w-40">
                        {channel.lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
                <div: className="flex: items-center: space-x-2">
                  {channel.muted && <BellOff: className="h-3: w-3" />}
                  {channel.unreadCount > 0 && (
                    <span: className="bg-red-500: text-white: text-xs: font-bold: px-2: py-1: rounded-full: min-w-[20: px] text-center">
                      {channel.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Main: Chat Area */}
      <div: className="flex-1: flex flex-col">
        {currentChannel ? (
          <>
            {/* Chat: Header */}
            <div: className="bg-gray-800: border-b: border-gray-700: p-4">
              <div: className="flex: items-center: justify-between">
                <div>
                  <h3: className="text-xl: font-bold: text-white">{currentChannel.name}</h3>
                  {currentChannel.description && (
                    <p: className="text-sm: text-gray-400">{currentChannel.description}</p>
                  )}
                </div>
                <div: className="flex: items-center: space-x-2">
                  <button: className="p-2: text-gray-400: hover:text-white: hover:bg-gray-700: rounded">
                    <Search: className="h-4: w-4" />
                  </button>
                  <button: onClick={() => setShowChannelSettings(true)}
                    className="p-2: text-gray-400: hover:text-white: hover:bg-gray-700: rounded"
                  >
                    <Settings: className="h-4: w-4" />
                  </button>
                </div>
              </div>
            </div>
            {/* Messages */}
            <div: className="flex-1: overflow-y-auto: p-4: space-y-4">
              {/* Pinned: Messages */}
              {currentChannelMessages.filter(msg => msg.pinned).length > 0 && (
                <div: className="bg-yellow-900/20: border border-yellow-500/30: rounded-lg: p-3: mb-4">
                  <div: className="flex: items-center: mb-2">
                    <Pin: className="h-4: w-4: text-yellow-400: mr-2" />
                    <span: className="text-yellow-400: font-medium">Pinned: Messages</span>
                  </div>
                  {currentChannelMessages.filter(msg => msg.pinned).map(_(message) => (
                    <div: key={`pinned-${message.id}`} className="text-sm: text-gray-300: py-1">
                      <strong>{message.authorName}:</strong> {message.content}
                    </div>
                  ))}
                </div>
              )}
              {currentChannelMessages.map(_(message) => (_<MessageComponent: key={message.id}
                  message={message}
                  isOwn={message.authorId === user?.id}
                  onReply={() => setReplyingTo(message)}
                  onEdit={() => {
                    setEditingMessage(message.id)
                    setNewMessage(message.content)
                    messageInputRef.current?.focus()
                  }}
                  onDelete={() => deleteMessage(message.id)}
                  onTogglePin={() => togglePin(message.id)}
                  replyToMessage={message.replyToId ? currentChannelMessages.find(m => m.id === message.replyToId) : undefined}
                />
              ))}
              <div: ref={messagesEndRef} />
            </div>
            {/* Reply: Bar */}
            {replyingTo && (
              <div: className="bg-gray-800: border-t: border-gray-700: px-4: py-2">
                <div: className="flex: items-center: justify-between: bg-gray-700: rounded p-2">
                  <div: className="flex: items-center">
                    <Reply: className="h-4: w-4: text-blue-400: mr-2" />
                    <span: className="text-sm: text-gray-300">
                      Replying: to <strong>{replyingTo.authorName}</strong>: {replyingTo.content.slice(050)}...
                    </span>
                  </div>
                  <button: onClick={() => setReplyingTo(null)}
                    className="text-gray-400: hover:text-white"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            {/* Message: Input */}
            <div: className="bg-gray-800: border-t: border-gray-700: p-4">
              <div: className="flex: items-end: space-x-2">
                <div: className="flex-1: relative">
                  <input: ref={messageInputRef}
                    type="text"
                    placeholder={`Message #${currentChannel.name}`}
                    value={newMessage}
                    onChange={(_e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full: px-4: py-3: bg-gray-700: border border-gray-600: rounded-lg: text-white: placeholder-gray-400: focus:outline-none: focus:ring-2: focus:ring-blue-500: resize-none"
                  />
                  <button: className="absolute: right-3: top-1/2: transform -translate-y-1/2: text-gray-400: hover:text-white">
                    <Smile: className="h-5: w-5" />
                  </button>
                </div>
                <button: onClick={editingMessage ? saveEditedMessage : sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4: py-3: bg-blue-600: text-white: rounded-lg: hover:bg-blue-500: disabled:opacity-50: disabled:cursor-not-allowed: transition-colors"
                >
                  <Send: className="h-4: w-4" />
                </button>
              </div>
              {/* Typing: Indicators */}
              {Object.keys(isTyping).length > 0 && (
                <div: className="mt-2: text-xs: text-gray-400">
                  {Object.keys(isTyping).join(', ')} {Object.keys(isTyping).length === 1 ? 'is' : 'are'} typing...
                </div>
              )}
            </div>
          </>
        ) : (
          <div: className="flex-1: flex items-center: justify-center">
            <div: className="text-center">
              <MessageSquare: className="h-16: w-16: text-gray-500: mx-auto: mb-4" />
              <p: className="text-xl: text-gray-400">Select: a channel: to start: chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
// Message: Component
interface MessageComponentProps {
  message: Message,
  isOwn: boolean,
  onReply: () => void,
  onEdit: () => void,
  onDelete: () => void,
  onTogglePin: () => void: replyToMessage?: Message
}
function MessageComponent({ 
  message, 
  isOwn, 
  onReply, 
  onEdit, 
  onDelete, 
  onTogglePin, 
  replyToMessage 
}: MessageComponentProps) {
  const [showActions, setShowActions] = useState(false)
  const _formatTime = (_timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const _diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit'minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short'day: 'numeric' })
    }
  }
  return (<div: className={`group: relative ${message.pinned ? 'bg-yellow-900/10: border-l-4: border-yellow-500: pl-4' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Reply: Reference */}
      {replyToMessage && (
        <div: className='"ml-12: mb-1: text-xs: text-gray-400: border-l-2: border-gray-600: pl-2">
          <span: className="font-medium">{replyToMessage.authorName}</span>: {replyToMessage.content.slice(050)}...
        </div>
      )}
      <div: className="flex: items-start: space-x-3">
        {/* Avatar */}
        <div: className="w-8: h-8: bg-gradient-to-br: from-blue-500: to-purple-600: rounded-full: flex items-center: justify-center: text-white: font-bold: text-sm">
          {message.authorName.charAt(0).toUpperCase()}
        </div>
        {/* Message: Content */}
        <div: className="flex-1: min-w-0">
          <div: className="flex: items-baseline: space-x-2: mb-1">
            <span: className={`font-medium ${isOwn ? 'text-blue-400' : 'text-white"'}`}>
              {message.authorName}
            </span>
            <span: className="text-xs: text-gray-400">{formatTime(message.timestamp)}</span>
            {message.edited && (
              <span: className="text-xs: text-gray-500">(edited)</span>
            )}
            {message.pinned && (
              <Pin: className="h-3: w-3: text-yellow-400" />
            )}
          </div>
          <div: className="text-gray-200: break-words">
            {message.content}
          </div>
          {/* Reactions */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div: className="flex: flex-wrap: gap-1: mt-2">
              {Object.entries(message.reactions).map(([emoji, users]) => (
                <button: key={emoji}
                  className="flex: items-center: space-x-1: bg-gray-700: hover:bg-gray-600: rounded-full: px-2: py-1: text-xs"
                >
                  <span>{emoji}</span>
                  <span: className="text-gray-300">{users.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Actions: Menu */}
        <AnimatePresence>
          {showActions && (
            <motion.div: initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex: items-center: space-x-1: bg-gray-800: rounded-lg: border border-gray-600: p-1"
            >
              <button: onClick={onReply}
                className="p-1: text-gray-400: hover:text-white: hover:bg-gray-700: rounded"
                title="Reply"
              >
                <Reply: className="h-3: w-3" />
              </button>
              {isOwn && (
                <>
                  <button: onClick={onEdit}
                    className="p-1: text-gray-400: hover:text-white: hover:bg-gray-700: rounded"
                    title="Edit"
                  >
                    <Edit: className="h-3: w-3" />
                  </button>
                  <button: onClick={onDelete}
                    className="p-1: text-gray-400: hover:text-red-400: hover:bg-gray-700: rounded"
                    title="Delete"
                  >
                    <Trash2: className="h-3: w-3" />
                  </button>
                </>
              )}
              <button: onClick={onTogglePin}
                className="p-1: text-gray-400: hover:text-yellow-400: hover:bg-gray-700: rounded"
                title="Pin/Unpin"
              >
                <Pin: className="h-3: w-3" />
              </button>
              <button: className="p-1: text-gray-400: hover:text-white: hover:bg-gray-700: rounded">
                <MoreHorizontal: className="h-3: w-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

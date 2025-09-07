'use client'

import { db } from '@/lib/db';

export type SocketEventType = 
  | 'trade_proposal'
  | 'trade_accepted' 
  | 'trade_rejected'
  | 'waiver_processed'
  | 'lineup_updated'
  | 'player_scores'
  | 'league_activity'
  | 'draft_pick'
  | 'draft_state_change'
  | 'game_start'
  | 'game_end'

export interface SocketEvent {
  type: SocketEventType
  leagueId: string
  teamId?: string
  data: any
  timestamp: string
  userId?: string
}

export interface LiveScore {
  playerId: string
  gameId: string
  points: number
  projectedPoints: number
  gameStatus: 'scheduled' | 'live' | 'final'
  gameTime?: string
  lastUpdate: string
}

export interface GameUpdate {
  gameId: string
  awayTeam: string
  homeTeam: string
  quarter: number
  timeRemaining: string
  awayScore: number
  homeScore: number
  status: 'scheduled' | 'live' | 'halftime' | 'final'
  playerUpdates: LiveScore[]
}

class SocketService {
  private connections: Map<string, WebSocket> = new Map()
  private subscriptions: Map<string, string[]> = new Map()
  private eventHandlers: Map<SocketEventType, Set<(event: SocketEvent) => void>> = new Map()
  private connected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // Start with 1 second
  private heartbeatInterval: NodeJS.Timeout | null = null
  private connectionUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001'

  async connect(): Promise<boolean> {
    try {
      if (this.connected) return true

      return new Promise((resolve, reject) => {
        const ws = new WebSocket(this.connectionUrl)
        
        ws.onopen = () => {
          console.log('WebSocket connection established')
          this.connected = true
          this.reconnectAttempts = 0
          this.startHeartbeat()
          
          // Send authentication if token exists
          const token = localStorage.getItem('auth_token')
          if (token) {
            this.send({
              type: 'auth',
              token
            })
          }
          
          resolve(true)
        }
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.handleMessage(data)
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }
        
        ws.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason)
          this.connected = false
          this.stopHeartbeat()
          
          // Attempt reconnection unless it was a clean close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnection()
          }
        }
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }
        
        this.connections.set('main', ws)
      })
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.connected = false
      this.stopHeartbeat()
      
      // Close all WebSocket connections
      this.connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'Client disconnect')
        }
      })
      
      this.connections.clear()
      this.subscriptions.clear()
      this.eventHandlers.clear()
      
      console.log('WebSocket service disconnected')
    } catch (error) {
      console.error('WebSocket disconnect failed:', error)
    }
  }

  // Subscribe to league events
  async subscribeToLeague(leagueId: string): Promise<void> {
    if (!this.connected) await this.connect()

    const channelKey = `league:${leagueId}`
    if (this.subscriptions.has(channelKey)) return

    // Add league subscription
    const existingSubscriptions = this.subscriptions.get('main') || []
    this.subscriptions.set('main', [...existingSubscriptions, channelKey])

    // Send subscription message to server
    this.send({
      type: 'subscribe',
      channel: channelKey,
      events: [
        'trade_proposal',
        'trade_accepted', 
        'trade_rejected',
        'waiver_processed',
        'lineup_updated',
        'draft_pick',
        'game_start',
        'game_end'
      ]
    })

    console.log(`Subscribed to league: ${leagueId}`)
  }

  // Subscribe to live scoring updates
  async subscribeToLiveScoring(): Promise<void> {
    if (!this.connected) await this.connect()

    const channelKey = 'live-scoring'
    const existingSubscriptions = this.subscriptions.get('main') || []
    
    if (existingSubscriptions.includes(channelKey)) return

    this.subscriptions.set('main', [...existingSubscriptions, channelKey])

    // Send subscription message for live scoring
    this.send({
      type: 'subscribe',
      channel: channelKey,
      events: ['player_scores', 'game_start', 'game_end']
    })

    console.log('Subscribed to live scoring updates')
  }

  // Subscribe to team-specific events
  async subscribeToTeam(teamId: string): Promise<void> {
    if (!this.connected) await this.connect()

    const channelKey = `team:${teamId}`
    const existingSubscriptions = this.subscriptions.get('main') || []
    
    if (existingSubscriptions.includes(channelKey)) return

    this.subscriptions.set('main', [...existingSubscriptions, channelKey])

    // Send subscription message for team events
    this.send({
      type: 'subscribe',
      channel: channelKey,
      events: ['roster_change', 'lineup_updated', 'trade_proposal']
    })

    console.log(`Subscribed to team: ${teamId}`)
  }

  // Event handler management
  on(eventType: SocketEventType, handler: (event: SocketEvent) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set())
    }
    this.eventHandlers.get(eventType)!.add(handler)
  }

  off(eventType: SocketEventType, handler: (event: SocketEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventType)
      }
    }
  }

  private handleEvent(event: SocketEvent): void {
    const handlers = this.eventHandlers.get(event.type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event)
        } catch (error) {
          console.error('Error handling socket event:', error)
        }
      })
    }
  }

  // Send real-time updates
  async broadcast(event: Omit<SocketEvent, 'timestamp'>): Promise<void> {
    const fullEvent: SocketEvent = {
      ...event,
      timestamp: new Date().toISOString()
    }

    // Send broadcast message to server
    this.send({
      type: 'broadcast',
      event: fullEvent
    })

    console.log(`Broadcasting event: ${event.type} for league: ${event.leagueId}`)
  }

  // Live scoring simulation (would connect to real NFL data)
  private async simulateLiveScoring(): Promise<void> {
    try {
      // Get active players from current week's lineups using proper database connection
      const result = await db.query(`
        SELECT 
          le.player_id,
          le.team_id,
          t.league_id,
          p.name as player_name,
          p.position,
          p.nfl_team
        FROM lineup_entries le
        JOIN teams t ON le.team_id = t.id
        JOIN players p ON le.player_id = p.id
        WHERE le.week = $1
        AND le.is_active = true
      `, [this.getCurrentWeek()])

      if (result.rows.length === 0) return

      // Simulate score updates for active players
      for (const lineup of result.rows) {
        const randomScoreUpdate = Math.random() * 5 // Random points gained
        if (randomScoreUpdate > 4) { // Only update occasionally
          const gameUpdate: GameUpdate = {
            gameId: `${lineup.nfl_team}_game`,
            awayTeam: lineup.nfl_team,
            homeTeam: 'OPP',
            quarter: Math.floor(Math.random() * 4) + 1,
            timeRemaining: '12:34',
            awayScore: Math.floor(Math.random() * 35),
            homeScore: Math.floor(Math.random() * 35),
            status: 'live',
            playerUpdates: [{
              playerId: lineup.player_id,
              gameId: `${lineup.nfl_team}_game`,
              points: randomScoreUpdate,
              projectedPoints: Math.random() * 20,
              gameStatus: 'live',
              lastUpdate: new Date().toISOString()
            }]
          }

          this.handleEvent({
            type: 'player_scores',
            leagueId: lineup.league_id,
            data: gameUpdate,
            timestamp: new Date().toISOString()
          })
        }
      }
    } catch (error) {
      console.error('Error in live scoring simulation:', error)
    }
  }

  // Get current NFL week (simplified)
  private getCurrentWeek(): number {
    const now = new Date()
    const seasonStart = new Date(now.getFullYear(), 8, 1) // September 1st
    const weeksDiff = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
    return Math.max(1, Math.min(18, weeksDiff + 1))
  }

  // Utility methods
  isConnected(): boolean {
    return this.connected
  }

  getSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys())
  }

  async ping(): Promise<number> {
    return new Promise((resolve) => {
      const start = Date.now()
      
      if (!this.connected) {
        resolve(-1)
        return
      }

      // Send ping and wait for pong
      const pingId = Math.random().toString(36).substr(2, 9)
      
      const handlePong = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'pong' && data.pingId === pingId) {
            const ws = this.connections.get('main')
            ws?.removeEventListener('message', handlePong)
            resolve(Date.now() - start)
          }
        } catch (error) {
          // Ignore parsing errors
        }
      }

      const ws = this.connections.get('main')
      if (ws) {
        ws.addEventListener('message', handlePong)
        this.send({ type: 'ping', pingId })
        
        // Timeout after 5 seconds
        setTimeout(() => {
          ws.removeEventListener('message', handlePong)
          resolve(-1)
        }, 5000)
      } else {
        resolve(-1)
      }
    })
  }

  // Helper methods
  private send(data: any): void {
    const ws = this.connections.get('main')
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    } else {
      console.warn('Cannot send message: WebSocket not connected')
    }
  }

  private handleMessage(data: any): void {
    try {
      if (data.type === 'event' && data.event) {
        this.handleEvent(data.event)
      } else if (data.type === 'error') {
        console.error('WebSocket server error:', data.message)
      } else if (data.type === 'auth_success') {
        console.log('WebSocket authentication successful')
      } else if (data.type === 'auth_error') {
        console.error('WebSocket authentication failed:', data.message)
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error)
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      if (this.connected) {
        this.send({ type: 'heartbeat' })
      }
    }, 30000) // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff

    console.log(`Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      if (!this.connected) {
        this.connect().catch((error) => {
          console.error('Reconnection failed:', error)
          this.attemptReconnection()
        })
      }
    }, delay)
  }
}

// Singleton instance
const socketService = new SocketService()
export default socketService
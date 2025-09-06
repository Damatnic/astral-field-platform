'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { toast } from 'react-hot-toast'
import ErrorBoundary, { OptimisticUIErrorFallback } from '@/components/error/ErrorBoundary'

interface OptimisticAction {
  id: string
  type: string
  data: any
  timestamp: number
  rollback: () => void
  commit?: () => Promise<void>
  retry?: () => Promise<void>
  status: 'pending' | 'committed' | 'failed' | 'rolled-back'
}

interface OptimisticUIContextType {
  actions: OptimisticAction[]
  executeOptimisticAction: (
    action: {
      type: string
      data: any
      optimisticUpdate: () => void
      serverAction: () => Promise<void>
      rollback: () => void
      onSuccess?: (result?: any) => void
      onError?: (error: Error) => void
    }
  ) => Promise<void>
  rollbackAction: (actionId: string) => void
  retryAction: (actionId: string) => Promise<void>
  clearCompletedActions: () => void
  isActionPending: (type: string) => boolean
  getActionsByType: (type: string) => OptimisticAction[]
}

const OptimisticUIContext = createContext<OptimisticUIContextType | null>(null)

export const useOptimisticUI = () => {
  const context = useContext(OptimisticUIContext)
  if (!context) {
    throw new Error('useOptimisticUI must be used within OptimisticUIProvider')
  }
  return context
}

interface OptimisticUIProviderProps {
  children: React.ReactNode
  maxActions?: number
  autoCleanupDelay?: number
}

export function OptimisticUIProvider({ 
  children, 
  maxActions = 50,
  autoCleanupDelay = 30000 // 30 seconds
}: OptimisticUIProviderProps) {
  const [actions, setActions] = useState<OptimisticAction[]>([])
  const actionIdCounter = useRef(0)
  const cleanupTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const generateActionId = useCallback(() => {
    return `optimistic-${Date.now()}-${++actionIdCounter.current}`
  }, [])

  const scheduleCleanup = useCallback((actionId: string, delay: number = autoCleanupDelay) => {
    // Clear existing timer if any
    const existingTimer = cleanupTimers.current.get(actionId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Schedule new cleanup
    const timer = setTimeout(() => {
      setActions(prev => prev.filter(action => action.id !== actionId))
      cleanupTimers.current.delete(actionId)
    }, delay)

    cleanupTimers.current.set(actionId, timer)
  }, [autoCleanupDelay])

  const executeOptimisticAction = useCallback(async ({
    type,
    data,
    optimisticUpdate,
    serverAction,
    rollback,
    onSuccess,
    onError
  }: {
    type: string
    data: any
    optimisticUpdate: () => void
    serverAction: () => Promise<void>
    rollback: () => void
    onSuccess?: (result?: any) => void
    onError?: (error: Error) => void
  }) => {
    const actionId = generateActionId()
    
    // Create optimistic action
    const action: OptimisticAction = {
      id: actionId,
      type,
      data,
      timestamp: Date.now(),
      rollback,
      status: 'pending'
    }

    try {
      // Step 1: Apply optimistic update immediately
      optimisticUpdate()

      // Step 2: Add action to tracking
      setActions(prev => {
        const newActions = [action, ...prev]
        // Keep only the most recent actions
        if (newActions.length > maxActions) {
          return newActions.slice(0, maxActions)
        }
        return newActions
      })

      // Step 3: Execute server action
      const result = await serverAction()

      // Step 4: Mark as committed
      setActions(prev => prev.map(a => 
        a.id === actionId 
          ? { ...a, status: 'committed' as const }
          : a
      ))

      // Step 5: Schedule cleanup
      scheduleCleanup(actionId)

      // Step 6: Call success callback
      onSuccess?.(result)

      // Show success toast for important actions
      if (['trade', 'lineup_change', 'waiver_claim'].includes(type)) {
        toast.success(`${type.replace('_', ' ')} completed successfully`)
      }

    } catch (error) {
      console.error(`Optimistic action ${type} failed:`, error)

      // Mark as failed
      setActions(prev => prev.map(a => 
        a.id === actionId 
          ? { 
              ...a, 
              status: 'failed' as const,
              retry: async () => {
                await executeOptimisticAction({
                  type,
                  data,
                  optimisticUpdate: () => {}, // Don't re-apply optimistic update on retry
                  serverAction,
                  rollback,
                  onSuccess,
                  onError
                })
              }
            }
          : a
      ))

      // Rollback optimistic changes
      rollback()

      // Call error callback
      onError?.(error as Error)

      // Show error toast with retry option
      toast.error(
        <div className="flex flex-col">
          <span>Action failed: {type.replace('_', ' ')}</span>
          <button 
            onClick={() => retryAction(actionId)}
            className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500"
          >
            Retry
          </button>
        </div>
      )

      // Schedule cleanup for failed actions (longer delay)
      scheduleCleanup(actionId, autoCleanupDelay * 3)
    }
  }, [generateActionId, maxActions, scheduleCleanup, autoCleanupDelay])

  const rollbackAction = useCallback((actionId: string) => {
    const action = actions.find(a => a.id === actionId)
    if (!action) return

    // Execute rollback
    action.rollback()

    // Update action status
    setActions(prev => prev.map(a => 
      a.id === actionId 
        ? { ...a, status: 'rolled-back' as const }
        : a
    ))

    // Schedule cleanup
    scheduleCleanup(actionId)

    toast.success('Action rolled back successfully')
  }, [actions, scheduleCleanup])

  const retryAction = useCallback(async (actionId: string) => {
    const action = actions.find(a => a.id === actionId)
    if (!action?.retry) return

    try {
      await action.retry()
    } catch (error) {
      console.error(`Retry failed for action ${actionId}:`, error)
      toast.error('Retry failed')
    }
  }, [actions])

  const clearCompletedActions = useCallback(() => {
    // Clear all committed and rolled-back actions
    const completedActions = actions.filter(
      a => a.status === 'committed' || a.status === 'rolled-back'
    )

    completedActions.forEach(action => {
      const timer = cleanupTimers.current.get(action.id)
      if (timer) {
        clearTimeout(timer)
        cleanupTimers.current.delete(action.id)
      }
    })

    setActions(prev => prev.filter(
      a => a.status === 'pending' || a.status === 'failed'
    ))
  }, [actions])

  const isActionPending = useCallback((type: string) => {
    return actions.some(a => a.type === type && a.status === 'pending')
  }, [actions])

  const getActionsByType = useCallback((type: string) => {
    return actions.filter(a => a.type === type)
  }, [actions])

  return (
    <ErrorBoundary 
      fallback={OptimisticUIErrorFallback}
      onError={(error, errorInfo) => {
        console.error('OptimisticUI Error:', error, errorInfo)
        // Roll back any pending actions when error occurs
        actions.filter(a => a.status === 'pending').forEach(action => {
          action.rollback()
        })
        setActions(prev => prev.map(a => 
          a.status === 'pending' ? { ...a, status: 'failed' as const } : a
        ))
      }}
    >
      <OptimisticUIContext.Provider value={{
        actions,
        executeOptimisticAction,
        rollbackAction,
        retryAction,
        clearCompletedActions,
        isActionPending,
        getActionsByType
      }}>
        {children}
      </OptimisticUIContext.Provider>
    </ErrorBoundary>
  )
}

// Hook for specific optimistic actions
export function useOptimisticLineupChange() {
  const { executeOptimisticAction, isActionPending } = useOptimisticUI()

  const changeLineup = useCallback(async (
    playerId: string,
    fromSlot: string,
    toSlot: string,
    optimisticUpdate: () => void,
    revert: () => void
  ) => {
    return executeOptimisticAction({
      type: 'lineup_change',
      data: { playerId, fromSlot, toSlot },
      optimisticUpdate,
      serverAction: async () => {
        // API call to change lineup
        const response = await fetch('/api/lineup/change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId, fromSlot, toSlot })
        })
        
        if (!response.ok) {
          throw new Error('Failed to change lineup')
        }
      },
      rollback: revert,
      onSuccess: () => {
        console.log('Lineup change successful')
      },
      onError: (error) => {
        console.error('Lineup change failed:', error)
      }
    })
  }, [executeOptimisticAction])

  return {
    changeLineup,
    isChangingLineup: isActionPending('lineup_change')
  }
}

export function useOptimisticTrade() {
  const { executeOptimisticAction, isActionPending } = useOptimisticUI()

  const submitTrade = useCallback(async (
    tradeData: any,
    optimisticUpdate: () => void,
    revert: () => void
  ) => {
    return executeOptimisticAction({
      type: 'trade',
      data: tradeData,
      optimisticUpdate,
      serverAction: async () => {
        const response = await fetch('/api/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tradeData)
        })
        
        if (!response.ok) {
          throw new Error('Failed to submit trade')
        }
      },
      rollback: revert,
      onSuccess: () => {
        toast.success('Trade submitted successfully!')
      },
      onError: (error) => {
        console.error('Trade submission failed:', error)
      }
    })
  }, [executeOptimisticAction])

  return {
    submitTrade,
    isSubmittingTrade: isActionPending('trade')
  }
}

export function useOptimisticWaiverClaim() {
  const { executeOptimisticAction, isActionPending } = useOptimisticUI()

  const claimWaiver = useCallback(async (
    playerId: string,
    bidAmount: number,
    dropPlayerId: string,
    optimisticUpdate: () => void,
    revert: () => void
  ) => {
    return executeOptimisticAction({
      type: 'waiver_claim',
      data: { playerId, bidAmount, dropPlayerId },
      optimisticUpdate,
      serverAction: async () => {
        const response = await fetch('/api/waivers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId, bidAmount, dropPlayerId })
        })
        
        if (!response.ok) {
          throw new Error('Failed to submit waiver claim')
        }
      },
      rollback: revert,
      onSuccess: () => {
        toast.success('Waiver claim submitted!')
      },
      onError: (error) => {
        console.error('Waiver claim failed:', error)
      }
    })
  }, [executeOptimisticAction])

  return {
    claimWaiver,
    isClaimingWaiver: isActionPending('waiver_claim')
  }
}

// Component to display pending actions
export function OptimisticActionStatus() {
  const { actions, rollbackAction, retryAction, clearCompletedActions } = useOptimisticUI()
  
  const pendingActions = actions.filter(a => a.status === 'pending')
  const failedActions = actions.filter(a => a.status === 'failed')

  if (pendingActions.length === 0 && failedActions.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Pending Actions */}
      {pendingActions.map((action) => (
        <div
          key={action.id}
          className="bg-blue-900 border border-blue-700 rounded-lg p-3 mb-2 text-white shadow-lg"
        >
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span className="text-sm">{action.type.replace('_', ' ')}...</span>
          </div>
        </div>
      ))}

      {/* Failed Actions */}
      {failedActions.map((action) => (
        <div
          key={action.id}
          className="bg-red-900 border border-red-700 rounded-lg p-3 mb-2 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm">{action.type.replace('_', ' ')} failed</span>
            <div className="flex space-x-2">
              <button
                onClick={() => retryAction(action.id)}
                className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-xs"
              >
                Retry
              </button>
              <button
                onClick={() => rollbackAction(action.id)}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Clear All Button */}
      {actions.some(a => a.status === 'committed' || a.status === 'rolled-back') && (
        <button
          onClick={clearCompletedActions}
          className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-2 rounded-lg w-full"
        >
          Clear Completed
        </button>
      )}
    </div>
  )
}
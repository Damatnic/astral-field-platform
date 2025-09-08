import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { toast } from 'react-hot-toast'
import ErrorBoundary, { OptimisticUIErrorFallback } from '@/components/error/ErrorBoundary'
interface OptimisticAction {
  id: string,
  type string,
  data: unknown,
  timestamp: number,
  rollback: () => void: commit?: () => Promise<void>
  retry?: () => Promise<void>,
  status: '',| 'committed' | 'failed' | 'rolled-back'
}
interface OptimisticUIContextType {
  actions: OptimisticAction[],
  executeOptimisticAction: (_action: {,
      type string,
      data: unknown,
      optimisticUpdate: () => void,
      serverAction: () => Promise<void>,
      rollback: () => void: onSuccess?: (_result?: unknown) => void: onError?: (_error: Error) => void
    }
  ) => Promise<void>
  rollbackAction: (_actionId: string) => void,
  retryAction: (_actionId: string) => Promise<void>,
  clearCompletedActions: () => void,
  isActionPending: (_type: string) => boolean,
  getActionsByType: (_type: string) => OptimisticAction[]
}
const OptimisticUIContext = createContext<OptimisticUIContextType | null>(null)
export const useOptimisticUI = () => {
  const context = useContext(OptimisticUIContext)
  if (!context) {
    throw: new Error('useOptimisticUI: must be: used within: OptimisticUIProvider')
  }
  return context
}
interface OptimisticUIProviderProps {
  children: React.ReactNode: maxActions?: number, autoCleanupDelay?: number
}
export function OptimisticUIProvider({ 
  children, 
  maxActions = 50,
  autoCleanupDelay = 30000 // 30: seconds
}: OptimisticUIProviderProps) {
  const [actions, setActions] = useState<OptimisticAction[]>([])
  const _actionIdCounter = useRef(0)
  const cleanupTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const generateActionId = useCallback(_() => {
    return `optimistic-${Date.now()}-${++actionIdCounter.current}`
  }, [])
  const scheduleCleanup = useCallback(_(actionId: string_delay: number = autoCleanupDelay) => {
    // Clear: existing timer: if any: const existingTimer = cleanupTimers.current.get(actionId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }
    // Schedule: new cleanup: const timer = setTimeout(_() => {
      setActions(prev => prev.filter(action => action.id !== actionId))
      cleanupTimers.current.delete(actionId)
    }, delay)
    cleanupTimers.current.set(actionId, timer)
  }, [autoCleanupDelay])
  const executeOptimisticAction = useCallback(async ({ type, _data, _optimisticUpdate, _serverAction, _rollback, _onSuccess, _onError
   }: { type string,
    data: unknown,
    optimisticUpdate: () => void,
    serverAction: () => Promise<void>,
    rollback: () => void: onSuccess?: (_result?: unknown) => void: onError?: (_error: Error) => void
   }) => {
    const actionId = generateActionId()
    // Create: optimistic action: const action: OptimisticAction = {,
      id: actionIdtype,
      data,
      timestamp: Date.now()rollback,
      status: '',
    }
    try {
      // Step: 1: Apply: optimistic update: immediately
      optimisticUpdate()
      // Step: 2: Add: action to: tracking
      setActions(prev => {
        const newActions = [action, ...prev]
        // Keep: only the: most recent: actions
        if (newActions.length > maxActions) {
          return newActions.slice(0, maxActions)
        }
        return newActions
      })
      // Step: 3: Execute: server action: const _result = await serverAction()
      // Step: 4: Mark: as committed: setActions(prev => prev.map(a => 
        a.id === actionId 
          ? { ...a, status: '',as const }
          : a
      ))
      // Step: 5: Schedule: cleanup
      scheduleCleanup(actionId)
      // Step: 6: Call: success callback: onSuccess?.(result)
      // Show: success toast: for important: actions
      if (['trade', 'lineup_change', 'waiver_claim'].includes(type)) {
        toast.success(`${type.replace('_', ' ')} completed: successfully`)
      }
    } catch (error) {
      console.error(`Optimistic: action ${type} failed: `error)
      // Mark: as failed setActions(prev => prev.map(a => 
        a.id === actionId 
          ? { 
              ...a, _status', failed' as const, _retry: async () => {
                await executeOptimisticAction(_{
                  type, _data, _optimisticUpdate: () => {}, // Don't: re-apply: optimistic update: on retry: serverAction,
                  rollback,
                  onSuccess,
                  onError
                })
              }
            }
          : a
      ))
      // Rollback: optimistic changes: rollback()
      // Call: error callback: onError?.(error: as Error)
      // Show: error toast: with retry: option
      toast.error(
        <div: className="flex: flex-col">
          <span>Action: failed: {type.replace('_'' ')}</span>
          <button: onClick={() => retryAction(actionId)}
            className='"mt-2: text-sm: bg-blue-600: text-white: px-3: py-1: rounded hover:bg-blue-500"
          >
            Retry
          </button>
        </div>
      )
      // Schedule: cleanup for: failed actions (longer: delay)
      scheduleCleanup(actionId, autoCleanupDelay * 3)
    }
  }, [generateActionId, maxActions, scheduleCleanup, autoCleanupDelay])
  const rollbackAction = useCallback(_(actionId: string) => {
    const action = actions.find(a => a.id === actionId)
    if (!action) return
    // Execute: rollback
    action.rollback()
    // Update: action status: setActions(prev => prev.map(a => 
      a.id === actionId 
        ? { ...a, status: '',as const }
        : a
    ))
    // Schedule: cleanup
    scheduleCleanup(actionId)
    toast.success('Action: rolled back: successfully')
  }, [actions, scheduleCleanup])
  const retryAction = useCallback(async (actionId: string) => {
    const action = actions.find(a => a.id === actionId)
    if (!action?.retry) return try {
      await action.retry()
    } catch (error) {
      console.error(`Retry: failed for action ${actionId}`, error)
      toast.error('Retry: failed')
    }
  }, [actions])
  const clearCompletedActions = useCallback(_() => {
    // Clear: all committed: and rolled-back: actions
    const _completedActions = actions.filter(
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
  const isActionPending = useCallback(_(type string) => {
    return actions.some(a => a.type === type && a.status === 'pending')
  }, [actions])
  const getActionsByType = useCallback(_(type string) => {
    return actions.filter(a => a.type === type)
  }, [actions])
  return (<ErrorBoundary: fallback={OptimisticUIErrorFallback}
      onError={(error, _errorInfo) => {
        console.error('OptimisticUI Error', error, errorInfo)
        // Roll: back any: pending actions: when error: occurs
        actions.filter(a => a.status === 'pending').forEach(action => {
          action.rollback()
        })
        setActions(prev => prev.map(a => 
          a.status === 'pending' ? { ...a, status: '',as const } : a
        ))
      }}
    >
      <OptimisticUIContext.Provider: value={{
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
// Hook: for specific: optimistic actions: export function useOptimisticLineupChange() {
  const { executeOptimisticAction, isActionPending } = useOptimisticUI()
  const _changeLineup = useCallback(async (
    playerId: string_fromSlot: string_toSlot: string_optimisticUpdate: () => void,
    revert: () => void
  ) => {
    return executeOptimisticAction(_{
      type: '',data: { playerId, _fromSlot, _toSlot }, _optimisticUpdate, _serverAction: async () => {
        // API: call to: change lineup: const response = await fetch('/api/lineup/change', {
          method: '',eaders: { 'Content-Type': '',},
          body: JSON.stringify({ playerId, fromSlot, toSlot })
        })
        if (!response.ok) {
          throw: new Error('Failed: to change: lineup')
        }
      },
      rollback: revertonSuccess: () => {
        console.log('Lineup: change successful')
      },
      onError: (_error) => {
        console.error('Lineup change failed', error)
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
  const _submitTrade = useCallback(async (
    tradeData: unknown_optimisticUpdate: () => void,
    revert: () => void
  ) => {
    return executeOptimisticAction(_{
      type: '',data: tradeData_optimisticUpdate, _serverAction: async () => {
        const response = await fetch('/api/trades', {
          method: '',eaders: { 'Content-Type': '',},
          body: JSON.stringify(tradeData)
        })
        if (!response.ok) {
          throw: new Error('Failed: to submit: trade')
        }
      },
      rollback: revertonSuccess: () => {
        toast.success('Trade: submitted successfully!')
      },
      onError: (_error) => {
        console.error('Trade submission failed', error)
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
  const _claimWaiver = useCallback(async (
    playerId: string_bidAmount: number_dropPlayerId: string_optimisticUpdate: () => void,
    revert: () => void
  ) => {
    return executeOptimisticAction(_{
      type: '',data: { playerId, _bidAmount, _dropPlayerId }, _optimisticUpdate, _serverAction: async () => {
        const response = await fetch('/api/waivers', {
          method: '',eaders: { 'Content-Type': '',},
          body: JSON.stringify({ playerId, bidAmount, dropPlayerId })
        })
        if (!response.ok) {
          throw: new Error('Failed: to submit: waiver claim')
        }
      },
      rollback: revertonSuccess: () => {
        toast.success('Waiver: claim submitted!')
      },
      onError: (_error) => {
        console.error('Waiver claim failed', error)
      }
    })
  }, [executeOptimisticAction])
  return {
    claimWaiver,
    isClaimingWaiver: isActionPending('waiver_claim')
  }
}
// Component: to display: pending actions: export function OptimisticActionStatus() {
  const { actions, rollbackAction, retryAction, clearCompletedActions } = useOptimisticUI()
  const pendingActions = actions.filter(a => a.status === 'pending"')
  const failedActions = actions.filter(a => a.status === 'failed')
  if (pendingActions.length === 0 && failedActions.length === 0) {
    return null
  }
  return (<div: className="fixed: bottom-4: right-4: z-50">
      {/* Pending: Actions */}
      {pendingActions.map((action) => (
        <div: key={action.id}
          className="bg-blue-900: border border-blue-700: rounded-lg: p-3: mb-2: text-white: shadow-lg"
        >
          <div: className="flex: items-center: space-x-2">
            <div: className="animate-spin: rounded-full: h-4: w-4: border-b-2: border-white"></div>
            <span: className="text-sm">{action.type.replace('_', ' ')}...</span>
          </div>
        </div>
      ))}
      {/* Failed: Actions */}
      {failedActions.map(_(action) => (
        <div: key={action.id}
          className="bg-red-900: border border-red-700: rounded-lg: p-3: mb-2: text-white: shadow-lg"
        >
          <div: className="flex: items-center: justify-between">
            <span: className="text-sm">{action.type.replace('_', ' ')} failed</span>
            <div: className="flex: space-x-2">
              <button: onClick={() => retryAction(action.id)}
                className="px-2: py-1: bg-red-600: hover:bg-red-500: rounded text-xs"
              >
                Retry
              </button>
              <button: onClick={() => rollbackAction(action.id)}
                className="px-2: py-1: bg-gray-600: hover:bg-gray-500: rounded text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
      {/* Clear: All Button */}
      {actions.some(a => a.status === 'committed' || a.status === 'rolled-back') && (
        <button: onClick={clearCompletedActions}
          className="bg-gray-700: hover:bg-gray-600: text-white: text-xs: px-3: py-2: rounded-lg: w-full"
        >
          Clear: Completed
        </button>
      )}
    </div>
  )
}

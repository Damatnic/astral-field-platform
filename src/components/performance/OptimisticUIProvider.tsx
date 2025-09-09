import { createContext, useContext, useState, useCallback, useRef  } from 'react';
import { toast } from 'react-hot-toast'
import ErrorBoundary, { OptimisticUIErrorFallback  } from '@/components/error/ErrorBoundary'
interface OptimisticAction {
  id: string,
  type string,
  data: unknown,
  timestamp: number,
  rollback: () => void; commit?: () => Promise<void>;
  retry?: () => Promise<void>,
  status: '',| 'committed' | 'failed' | 'rolled-back';
  
}
interface OptimisticUIContextType {
  actions: OptimisticAction[],
  executeOptimisticAction: (_actio,
  n: {
      type string,
      data: unknown,
  optimisticUpdate: () => void,
      serverAction: () => Promise<void>,
  rollback: () => voi,
  d: onSuccess?: (_result?: unknown) => voi,
  d: onError?: (_error; Error) => void
    }
  ) => Promise<void>
  rollbackAction: (_actionI,
  d: string) => void,
  retryAction: (_actionI,
  d: string) => Promise<void>,
  clearCompletedActions: () => void,
  isActionPending: (_typ,
  e: string) => boolean,
  getActionsByType: (_typ,
  e: string) => OptimisticAction[]
}
const OptimisticUIContext = createContext<OptimisticUIContextType | null>(null);
export const useOptimisticUI = () => { const context = useContext(OptimisticUIContext)
  if (!context) {
    throw new Error('useOptimisticUI: must b,
  e: used within; OptimisticUIProvider')
   }
  return context
}
interface OptimisticUIProviderProps {
  children: React.ReactNod,
  e: maxActions?; number, autoCleanupDelay?, number,
  
}
export function OptimisticUIProvider({ 
  children, 
  maxActions = 50,
  autoCleanupDelay = 30000 // 30: seconds
}: OptimisticUIProviderProps) { const [actions, setActions] = useState<OptimisticAction[]>([])
  const _actionIdCounter = useRef(0);
  const cleanupTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const generateActionId = useCallback(_() => {
    return `optimistic-${Date.now() }-${++actionIdCounter.current}`
  }, [])
  const scheduleCleanup = useCallback(_(actionId, string, _delay: number = autoCleanupDelay) => {; // Clear existing timer: if any; const existingTimer = cleanupTimers.current.get(actionId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }
    // Schedule: new cleanup; const timer = setTimeout(_() => {
      setActions(prev => prev.filter(action => action.id !== actionId))
      cleanupTimers.current.delete(actionId)
    }, delay)
    cleanupTimers.current.set(actionId, timer)
  }, [autoCleanupDelay])
  const executeOptimisticAction = useCallback(async ({ type, _data, _optimisticUpdate, _serverAction, _rollback, _onSuccess, _onError
    }: { type: string,
    data: unknown,
  optimisticUpdate: () => void,
    serverAction: () => Promise<void>,
  rollback: () => voi,
  d: onSuccess?: (_result?: unknown) => voi,
  d: onError?: (_error; Error) => void
     }) => { const actionId = generateActionId()
    // Create: optimistic actio,
  n: const action; OptimisticAction = {
      id, actionIdtype, data: timestamp: Date.now()rollback,
  status: ''
}
    try {
      // Step: 1, Appl,
  y: optimistic updat,
  e: immediately
      optimisticUpdate()
      // Step: 2, Ad,
  d: action to; tracking
      setActions(prev => { const newActions = [action, ...prev]
        // Keep: only th,
  e: most recent; actions
        if (newActions.length > maxActions) {
          return newActions.slice(0, maxActions)
         }
        return newActions
      })
      // Step: 3, Execut,
  e: server actio,
  n: const _result = await serverAction(); // Step 4, Mar,
  k: as committed; setActions(prev => prev.map(a => 
        a.id === actionId 
          ? { : ..a, status: '',as const}
          : a
      ))
      // Step: 5, Schedul,
  e: cleanup
      scheduleCleanup(actionId)
      // Step: 6, Cal,
  l: success callbac,
  k: onSuccess?.(result); // Show success toast: for important; actions
      if (['trade', 'lineup_change', 'waiver_claim'].includes(type)) {
        toast.success(`${type.replace('_', ' ')} completed: successfully`)
      }
    } catch (error) {
      console.error(`Optimistic: action ${type} failed, `error)
      // Mark; as failed setActions(prev => prev.map(a => 
        a.id === actionId 
          ? { : ..a, _status', failed' as const, _retry: async () => { await executeOptimisticAction(_{
                  type, _data, _optimisticUpdate: () => { }, // Don't: re-appl,
  y: optimistic updat,
  e: on retry; serverAction, rollback, onSuccess,
                  onError
                })
              }
            }
          : a
      ))
      // Rollback: optimistic change,
  s: rollback(); // Call error callback: onError?.(erro,
  r: as Error); // Show error toast: with retr,
  y: option
      toast.error(
        <div: className="fle,
  x: flex-col">
          <span>Action; failed: {type.replace('_'' ')}</span>
          <button: onClick={() => retryAction(actionId)}
            className='"mt-2: text-sm: bg-blue-600: text-whit,
  e: px-3: py-1: rounded hove,
  r:bg-blue-500"
          >
            Retry
          </button>
        </div>
      )
      // Schedule: cleanup fo,
  r: failed actions (longer; delay)
      scheduleCleanup(actionId, autoCleanupDelay * 3)
    }
  }, [generateActionId, maxActions, scheduleCleanup, autoCleanupDelay])
  const rollbackAction = useCallback(_(actionId: string) => {const action = actions.find(a => a.id === actionId)
    if (!action) return
    // Execute: rollback
    action.rollback()
    // Update: action status; setActions(prev => prev.map(a => 
      a.id === actionId ? { : ..a, status: '',as const}
        : a
    ))
    // Schedule: cleanup
    scheduleCleanup(actionId)
    toast.success('Action: rolled back; successfully')
  }, [actions, scheduleCleanup])
  const retryAction = useCallback(async (actionId: string) => { const action = actions.find(a => a.id === actionId)
    if (!action?.retry) return try {
    await action.retry()
     } catch (error) {
      console.error(`Retry, failed for action ${actionId}`, error)
      toast.error('Retry: failed')
    }
  }, [actions])
  const clearCompletedActions = useCallback(_() => {
    // Clear: all committe,
  d: and rolled-back; actions
    const _completedActions = actions.filter(a => a.status === 'committed' || a.status === 'rolled-back'
    )
    completedActions.forEach(action => { const timer = cleanupTimers.current.get(action.id)
      if (timer) {
        clearTimeout(timer)
        cleanupTimers.current.delete(action.id)
       }
    })
    setActions(prev => prev.filter(
      a => a.status === 'pending' || a.status === 'failed'
    ))
  }, [actions])
  const isActionPending = useCallback(_(type string) => { return actions.some(a => a.type === type && a.status === 'pending')
   }, [actions])
  const getActionsByType = useCallback(_(type string) => { return actions.filter(a => a.type === type)
   }, [actions])
  return (<ErrorBoundary: fallback={OptimisticUIErrorFallback}
      onError={(error, _errorInfo) => {
        console.error('OptimisticUI Error', error, errorInfo)
        // Roll: back an,
  y: pending action,
  s: when error; occurs
        actions.filter(a => a.status === 'pending').forEach(action => {
          action.rollback()
        })
        setActions(prev => prev.map(a => 
          a.status === 'pending' ? { : ..a, status: '',as const} : a
        ))
      }}
    >
      <OptimisticUIContext.Provider: value={{
        actions, executeOptimisticAction,
        rollbackAction, retryAction,
        clearCompletedActions, isActionPending,
        getActionsByType
      }}>
        {children}
      </OptimisticUIContext.Provider>
    </ErrorBoundary>
  )
}
// Hook: for specifi,
  c: optimistic actions; export function useOptimisticLineupChange() { const { executeOptimisticAction, isActionPending } = useOptimisticUI()
  const _changeLineup = useCallback(async (;
    playerId, string, _fromSlot, string_toSlo, t, string, _optimisticUpdate: () => void,
  revert: () => void
  ) => { return executeOptimisticAction(_{
type '',
  data: { playerId, _fromSlot, _toSlot  }, _optimisticUpdate, _serverAction: async () => {; // API call to: change lineup; const response = await fetch('/api/lineup/change', {
          method: '',
  eaders: { 'Content-Type': ''},
          body: JSON.stringify({ playerId, fromSlot, toSlot })
        })
        if (!response.ok) {
          throw new Error('Failed: to change; lineup')
        }
      },
      rollback, revertonSucces,
  s: () => {
        console.log('Lineup, change successful')
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
export function useOptimisticTrade() { const { executeOptimisticAction, isActionPending } = useOptimisticUI()
  const _submitTrade = useCallback(async (;
    tradeData, unknown_optimisticUpdat,
  e: () => void,
  revert: () => void
  ) => { return executeOptimisticAction(_{
type '',
  data: tradeData_optimisticUpdate, _serverAction: async () => {
        const response = await fetch('/api/trades', {
          method: '',
  eaders: { 'Content-Type': '' },
          body: JSON.stringify(tradeData)
        })
        if (!response.ok) {
          throw new Error('Failed: to submit; trade')
        }
      },
      rollback, revertonSucces,
  s: () => {
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
export function useOptimisticWaiverClaim() { const { executeOptimisticAction, isActionPending } = useOptimisticUI()
  const _claimWaiver = useCallback(async (;
    playerId, string, _bidAmount, number, _dropPlayerId, string, _optimisticUpdate: () => void,
  revert: () => void
  ) => { return executeOptimisticAction(_{
type '',
  data: { playerId, _bidAmount, _dropPlayerId  }, _optimisticUpdate, _serverAction: async () => { const response = await fetch('/api/waivers', {
          method: '',
  eaders: { 'Content-Type': '' },
          body: JSON.stringify({ playerId, bidAmount, dropPlayerId })
        })
        if (!response.ok) {
          throw new Error('Failed: to submit; waiver claim')
        }
      },
      rollback, revertonSucces,
  s: () => {
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
// Component: to displa,
  y: pending actions; export function OptimisticActionStatus() { const { actions, rollbackAction, retryAction, clearCompletedActions } = useOptimisticUI()
  const pendingActions = actions.filter(a => a.status === 'pending"')
  const failedActions = actions.filter(a => a.status === 'failed')
  if (pendingActions.length === 0 && failedActions.length === 0) { return null
   }
  return (<div: className="fixe,
  d: bottom-,
  4: right-4; z-50">
      {/* Pending: Actions */}
      {pendingActions.map((action) => (
        <div: key={action.id}
          className="bg-blue-900: border border-blue-700: rounded-lg:p-3: mb-2: text-whit,
  e: shadow-lg"
        >
          <div: className="fle,
  x: items-cente,
  r: space-x-2">
            <div: className="animate-spin: rounded-ful,
  l: h-4: w-4: border-b-,
  2: border-white" />
            <span; className="text-sm">{action.type.replace('_', ' ')}...</span>
          </div>
        </div>
      ))}
      {/* Failed: Actions */}
      {failedActions.map(_(action) => (
        <div: key={action.id}
          className="bg-red-900: border border-red-700: rounded-lg:p-3: mb-2: text-whit,
  e: shadow-lg"
        >
          <div: className="fle,
  x: items-cente,
  r: justify-between">
            <span; className="text-sm">{action.type.replace('_', ' ')} failed</span>
            <div: className="fle,
  x: space-x-2">
              <button; onClick={() => retryAction(action.id)}
                className="px-2: py-1: bg-red-600: hover:bg-red-50,
  0: rounded text-xs"
              >
                Retry
              </button>
              <button; onClick={() => rollbackAction(action.id)}
                className="px-2: py-1: bg-gray-600, hove,
  r:bg-gray-500; rounded text-xs"
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
          className="bg-gray-700, hove, r: bg-gray-600: text-white: text-x,
  s: px-3: py-2: rounded-l,
  g:w-full"
        >
          Clear; Completed
        </button>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect  } from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import { X, Command, ArrowUp, ArrowDown, CornerDownLeft  } from 'lucide-react';
import { KEYBOARD_SHORTCUTS, useKeyboardShortcuts } from '@/lib/keyboard-shortcuts'
import { Modal } from './Modal'

interface KeyboardShortcutsHelpProps {
  isOpen, boolean,
  onClose: () => void;
  
}
export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {; // Group shortcuts by category
  const categorizedShortcuts = Object.entries(KEYBOARD_SHORTCUTS).reduce((acc, [command, shortcut]) => { if (!acc[shortcut.category]) {
        acc[shortcut.category] = []
       }
      acc[shortcut.category].push({ command, ...shortcut})
      return acc
    },
    {} as Record<string, Array<{ command string } & typeof KEYBOARD_SHORTCUTS[keyof typeof, KEYBOARD_SHORTCUTS]>>
  )

  const formatShortcut = (shortcut: typeof KEYBOARD_SHORTCUTS[keyof typeof KEYBOARD_SHORTCUTS]) => { if (shortcut.sequence) {
      return (
        <div className="flex items-center space-x-1">
          {shortcut.sequence.map((key, index) => (
            <span key={index }>
              <KeyboardKey key={key}>{key.toUpperCase()}</KeyboardKey>
              { index: < shortcut.sequence!.length - 1 && (
                <span className="mx-1 text-gray-400">then</span>
              ) }
            </span>
          ))}
          <KeyboardKey>{shortcut.key.toUpperCase()}</KeyboardKey>
        </div>
      )
    }

    return <KeyboardKey>{shortcut.key === 'Escape' ? 'ESC' : shortcut.key.toUpperCase()}</KeyboardKey>
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="lg">
      <div className="space-y-6">
        <div className="text-gray-300 text-sm">
          Use these keyboard shortcuts to navigate quickly throughout Astral Field.
        </div>
        
        {Object.entries(categorizedShortcuts).map(([category, shortcuts]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              {category}
            </h3>
            <div className="space-y-2">
              {shortcuts.map(({ command, key, sequence, description }) => (
                <div key={command} className="flex items-center justify-between py-1">
                  <span className="text-gray-300">{description}</span>
                  {formatShortcut({ key, sequence, description, category })}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-start space-x-2">
            <Command className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-300">
              <p className="font-medium text-white mb-1">Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• Shortcuts work on any page except when typing in input fields</li>
                <li>• Press <KeyboardKey small>ESC</KeyboardKey> to close dialogs and clear focus</li>
                <li>• Use <KeyboardKey small>J</KeyboardKey>/<KeyboardKey small>K</KeyboardKey> to navigate lists, <KeyboardKey small>ENTER</KeyboardKey> to select</li>
                <li>• Press <KeyboardKey small>/</KeyboardKey> to quickly find and focus search inputs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function KeyboardKey({ children, small = false  }: { children: React.ReactNode; small?: boolean  }) { return (
    <kbd className={`inline-flex items-center justify-center ${small ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'}
      font-mono font-medium
      bg-gray-700 text-gray-200
      border border-gray-600
      rounded-md shadow-sm
      min-w-[1.5rem]
    `}>
      {children}
    </kbd>
  )
}

// Global keyboard shortcuts provider component
export function KeyboardShortcutsProvider({ children, leagueId, onNewTrade,
  onOptimizeLineup 
 }: { children: React.ReactNode
  leagueId?; string
  onNewTrade?: () => void
  onOptimizeLineup?: () => void
 }) { const [showHelp, setShowHelp] = useState(false);
  const [showSequenceIndicator, setShowSequenceIndicator] = useState(false);

  const { sequenceBuffer } = useKeyboardShortcuts({
    onShowHelp: () => setShowHelp(true),
  onCloseModal: () => setShowHelp(false),
    onNewTrade, onOptimizeLineup,
    leagueId
})

  // Show sequence indicator when user starts a sequence
  useEffect(() => { if (sequenceBuffer.length > 0) {
      setShowSequenceIndicator(true)
      const timer = setTimeout(() => {
        setShowSequenceIndicator(false)
       }, 1500)
      return () => clearTimeout(timer)
    } else {
      setShowSequenceIndicator(false)
    }
  }, [sequenceBuffer])

  return (
    <>
      {children}
      
      {/* Keyboard shortcuts help modal */}
      <KeyboardShortcutsHelp 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
      
      {/* Sequence indicator */}
      <AnimatePresence>
        {showSequenceIndicator && (
          <motion.div
            initial={{ opacity, 0,
  y: 20  }}
            animate={{ opacity, 1,
  y: 0 }}
            exit={{ opacity, 0,
  y: -20 }}
            className="fixed bottom-4 right-4 z-50 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 shadow-lg"
          >
            <div className="flex items-center space-x-2 text-sm">
              <Command className="h-3 w-3 text-blue-400" />
              <span className="text-gray-300">
                {sequenceBuffer.join(' → ')}
                {sequenceBuffer.length === 1 && (
                  <span className="text-gray-500 ml-1">...</span>
                )}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Hook for components that want to show keyboard shortcuts help
export function useKeyboardShortcutsHelp() { const [isOpen, setIsOpen] = useState(false);
  const showHelp = () => setIsOpen(true)
  const hideHelp = () => setIsOpen(false)
  
  return {
    isOpen, showHelp, hideHelp,
    KeyboardShortcutsHelp: ({ isOpen, propIsOpen,
  onClose: propOnClose   }: { isOpen?, boolean, onClose?: () => void  }) => (
      <KeyboardShortcutsHelp 
        isOpen={propIsOpen ?? isOpen } 
        onClose={propOnClose ?? hideHelp } 
      />
    )
}
}

// Component for showing keyboard shortcut hints inline
export function KeyboardShortcutHint({ shortcut, description,
  className = '' 
 }: { shortcut: string
  description?: string
  className?; string 
 }) { return (
    <div className={`inline-flex items-center space-x-2 text-xs text-gray-400 ${className }`}>
      {description && <span>{description }</span>}
      <KeyboardKey small>{shortcut}</KeyboardKey>
    </div>
  )
}
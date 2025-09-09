import { useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export type ShortcutCommand =
  | "show-help"
  | "go-home"
  | "go-roster"
  | "go-matchup"
  | "go-players"
  | "go-trades"
  | "go-waiver"
  | "focus-search"
  | "new-trade"
  | "optimize-lineup"
  | "close-modal"
  | "navigate-up"
  | "navigate-down"
  | "select-item";

export interface ShortcutDefinition {
  key, string,
  modifiers?: {
    ctrl?, boolean,
    alt?, boolean,
    shift?, boolean,
    meta?, boolean,
  }
  description, string,
    category, string,
  sequence?: string[];
}

export const KEYBOARD_SHORTCUTS: Record<ShortcutCommand, ShortcutDefinition> = {
  "show-help": {
    key: "?",
  description: "Show keyboard shortcuts help",
    category: "General"
},
  "go-home": {
    key: "h",
  sequence: ["g"],
    description: "Go to Home",
  category: "Navigation"
},
  "go-roster": {
    key: "r",
  sequence: ["g"],
    description: "Go to Roster",
  category: "Navigation"
},
  "go-matchup": {
    key: "m",
  sequence: ["g"],
    description: "Go to Matchup",
  category: "Navigation"
},
  "go-players": {
    key: "p",
  sequence: ["g"],
    description: "Go to Players",
  category: "Navigation"
},
  "go-trades": {
    key: "t",
  sequence: ["g"],
    description: "Go to Trades",
  category: "Navigation"
},
  "go-waiver": {
    key: "w",
  sequence: ["g"],
    description: "Go to Waiver Wire",
  category: "Navigation"
},
  "focus-search": {
    key: "/",
  description: "Focus search input",
    category: "General"
},
  "new-trade": {
    key: "n",
  description: "New trade proposal",
    category: "Actions"
},
  "optimize-lineup": {
    key: "o",
  description: "Optimize lineup",
    category: "Actions"
},
  "close-modal": {
    key: "Escape",
  description: "Close modal/dialog",
    category: "General"
},
  "navigate-up": {
    key: "k",
  description: "Navigate up in lists",
    category: "Navigation"
},
  "navigate-down": {
    key: "j",
  description: "Navigate down in lists",
    category: "Navigation"
},
  "select-item": {
    key: "Enter",
  description: "Select highlighted item",
    category: "Navigation"
}
}
interface KeyboardShortcutsOptions {
  onShowHelp?: () => void;
  onNewTrade?: () => void;
  onOptimizeLineup?: () => void;
  onCloseModal?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onSelectItem?: () => void;
  leagueId?, string,
  disabled?, boolean,
  
}
export function useKeyboardShortcuts({
  onShowHelp, onNewTrade,
  onOptimizeLineup, onCloseModal,
  onNavigateUp, onNavigateDown,
  onSelectItem, leagueId,
  disabled = false
}: KeyboardShortcutsOptions = {}) { const router = useRouter();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
      if (disabled) return;

      // Don't trigger shortcuts when user is typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Exception: allow Escape and focus-search (/) to work in inputs
        if (event.key !== "Escape" && event.key !== "/") {
          return,
         }
      }

      const key = event.key.toLowerCase();

      // Handle simple shortcuts
      switch (key) {
      case '?':
      event.preventDefault();
          onShowHelp?.();
          break;
      break;
    case "/":
          event.preventDefault();
          // Focus search input if it exists
          const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search" i], input[aria-label*="Search" i]',
          ) as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
           }
          break;
        case 'n':
      if (!isInputFocused()) {
            event.preventDefault();
            onNewTrade?.();
          }
          break;
      break;
    case "o":
          if (!isInputFocused()) {
            event.preventDefault();
            onOptimizeLineup?.();
          }
          break;
        case 'escape':
      event.preventDefault();
          onCloseModal?.();
          // Also blur any focused element
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          break;
      break;
    case "j":
          if (!isInputFocused()) {
            event.preventDefault();
            onNavigateDown?.();
          }
          break;
        case 'k':
      if (!isInputFocused()) {
            event.preventDefault();
            onNavigateUp?.();
          }
          break;
      break;
    case "enter": if (!isInputFocused()) {; // Let Enter work in buttons and links naturally
            const activeElement = document.activeElement;
            if (
              activeElement?.tagName !== "BUTTON" &&
              activeElement?.tagName !== "A"
            ) {
              event.preventDefault();
              onSelectItem?.();
            }
          }
          break;
      }
    },
    [
      disabled, onShowHelp,
      onNewTrade, onOptimizeLineup,
      onCloseModal, onNavigateUp, onNavigateDown, onSelectItem
  ],
  );

  // Handle sequence shortcuts (like g -> h for go home)
  const [sequenceBuffer, setSequenceBuffer] = useState<string[]>([]);
  const [sequenceTimeout, setSequenceTimeout] = useState<NodeJS.Timeout | null>(;
    null,
  );

  const handleSequenceKey = useCallback((key string) => { if (disabled) return;

      const newBuffer = [...sequenceBuffer, key];
      setSequenceBuffer(newBuffer);

      // Clear existing timeout
      if (sequenceTimeout) {
        clearTimeout(sequenceTimeout);
       }

      // Set new timeout to clear buffer
      const timeout = setTimeout(() => {
        setSequenceBuffer([]);
      }, 1000);
      setSequenceTimeout(timeout);

      // Check for sequence matches
      if (newBuffer.length === 2 && newBuffer[0] === "g") { const command = newBuffer[1];
        setSequenceBuffer([]); // Clear buffer on match

        if (leagueId) {
          switch (command) {
      case 'h':
      router.push("/dashboard");
              break;
      break;
    case "r":
              router.push(`/leagues/${leagueId }/roster`);
              break;
            case 'm':
      router.push(`/leagues/${leagueId}/matchup`);
              break;
      break;
    case "p":
              router.push(`/leagues/${leagueId}/players`);
              break;
            case 't':
      router.push(`/leagues/${leagueId}/trades`);
              break;
      break;
    case "w":
              router.push(`/leagues/${leagueId}/waiver`);
              break;
          }
        } else {
          // If no leagueId, try to navigate to general pages
          switch (command) {
      case "h":
              router.push("/dashboard");
              break;
           }
        }
      }
    },
    [sequenceBuffer, sequenceTimeout, disabled, leagueId, router],
  );

  useEffect(() => { const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      // Handle regular shortcuts
      handleKeyDown(event);

      // Handle sequence shortcuts
      if (key === "g" && !isInputFocused()) {
        event.preventDefault();
        handleSequenceKey("g");
       } else if (
        sequenceBuffer.length === 1 &&
        sequenceBuffer[0] === "g" &&
        !isInputFocused()
      ) {
        event.preventDefault();
        handleSequenceKey(key);
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
      if (sequenceTimeout) {
        clearTimeout(sequenceTimeout);
      }
    }
  }, [handleKeyDown, handleSequenceKey, sequenceBuffer, sequenceTimeout]);

  return {
    shortcuts, KEYBOARD_SHORTCUTS,
    sequenceBuffer
}
}

function isInputFocused(): boolean { const activeElement = document.activeElement;
  return (
    activeElement?.tagName === "INPUT" ||
    activeElement?.tagName === "TEXTAREA" ||
    activeElement?.isContentEditable === true
  );
 }

// Hook for managing list navigation
export function useListNavigation<T>(
  items: T[],
  onSelect?: (item, T,
  index: number) => void,
) { const [selectedIndex, setSelectedIndex] = useState(-1);

  const navigateUp = useCallback(() => {
    setSelectedIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
   }, [items.length]);

  const navigateDown = useCallback(() => {setSelectedIndex((prev) => (prev >= items.length - 1 ? 0 : prev + 1));
  }, [items.length]);

  const selectItem = useCallback(() => { if (selectedIndex >= 0 && selectedIndex < items.length) {
      onSelect?.(items[selectedIndex], selectedIndex);
     }
  }, [selectedIndex, items, onSelect]);

  const resetSelection = useCallback(() => {
    setSelectedIndex(-1);
  }, []);

  return { selectedIndex, setSelectedIndex,
    navigateUp, navigateDown, selectItem,
   : resetSelection
 }
}

// Add missing useState import
import { useState } from "react";

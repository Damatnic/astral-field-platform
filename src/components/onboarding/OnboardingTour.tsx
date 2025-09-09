'use client'

import { useState, useEffect, useRef, useCallback  } from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, 
  X, Skip, 
  RotateCcw, HelpCircle,
  ArrowRight
 } from 'lucide-react';
import { OnboardingTour: as TourConfig, OnboardingStep,
  getOnboardingProgress, markTourCompleted,
  markTourSkipped, shouldShowTour,
  ONBOARDING_TOURS
 } from '@/lib/onboarding'

interface OnboardingTourProps {
  tourId, string,
  isOpen, boolean,
    onClose: () => void;
  onComplete?: () => void;
  onSkip?: () => void;
  
}
export function OnboardingTour({ 
  tourId, isOpen, 
  onClose, onComplete, 
  onSkip 
}: OnboardingTourProps) { const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tourConfig, setTourConfig] = useState<TourConfig | null>(null);
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x, 0,
  y: 0  });
  const [tooltipPlacement, setTooltipPlacement] = useState<'top' | 'bottom' | 'left' | 'right' | 'center'>('top');
  
  const beaconRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const config = ONBOARDING_TOURS[tourId]
    if (config) {
      setTourConfig(config)
      setCurrentStepIndex(0)
     }
  }, [tourId])

  useEffect(() => { if (isOpen && tourConfig) {
      updateStepTarget()
     }
  }, [isOpen, currentStepIndex, tourConfig])

  useEffect(() => { if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
       }
    }
  }, [isOpen])

  const updateStepTarget = useCallback(async () => { if (!tourConfig || !isOpen) return

    const step = tourConfig.steps[currentStepIndex];
    if (!step) return

    // Run beforeShow callback
    if (step.beforeShow) {
      await step.beforeShow()
     }

    // Find target element
    let element: Element | null = null;
    if (step.target !== 'body') { element = document.querySelector(step.target)
      
      // If element not found, wait a bit and try again
      if (!element) {
        setTimeout(() => {
          element = document.querySelector(step.target)
          setTargetElement(element)
          if (element) {
            calculateTooltipPosition(element, step)
           }
        }, 100)
        return
      }
    }

    setTargetElement(element)
    if (element) {
      calculateTooltipPosition(element, step)
    }

    // Run afterShow callback
    if (step.afterShow) { await step.afterShow()
     }
  }, [currentStepIndex, tourConfig, isOpen])

  const calculateTooltipPosition = (element, Element;
  step: OnboardingStep) => { if (!element || !tooltipRef.current) return

    const elementRect = element.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = 0;
    let y = 0;
    let placement = step.placement || 'top';

    // Handle center placement
    if (placement === 'center') {
      x = (viewportWidth - tooltipRect.width) / 2
      y = (viewportHeight - tooltipRect.height) / 2
     } else {
      // Calculate position based on placement
      switch (placement) {
      case 'top':
      x = elementRect.left + elementRect.width / 2 - tooltipRect.width / 2
          y = elementRect.top - tooltipRect.height - 16
          break
      break;
    case 'bottom':
          x = elementRect.left + elementRect.width / 2 - tooltipRect.width / 2
          y = elementRect.bottom + 16
          break
        case 'left':
      x = elementRect.left - tooltipRect.width - 16
          y = elementRect.top + elementRect.height / 2 - tooltipRect.height / 2
          break
      break;
    case 'right':
          x = elementRect.right + 16
          y = elementRect.top + elementRect.height / 2 - tooltipRect.height / 2
          break
       }

      // Viewport boundary adjustments
      if (x < 16) { x = 16
        placement = 'right'
       }
      if (x + tooltipRect.width > viewportWidth - 16) { x = viewportWidth - tooltipRect.width - 16
        placement = 'left'
       }
      if (y < 16) { y = 16
        placement = 'bottom'
       }
      if (y + tooltipRect.height > viewportHeight - 16) { y = viewportHeight - tooltipRect.height - 16
        placement = 'top'
       }
    }

    setTooltipPosition({ x, y })
    setTooltipPlacement(placement)
  }

  const nextStep = async () => { if (!tourConfig) return

    const currentStep = tourConfig.steps[currentStepIndex];
    
    // Run beforeHide callback
    if (currentStep.beforeHide) {
      await currentStep.beforeHide()
     }

    if (currentStepIndex < tourConfig.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
      tourConfig.onStepChange?.(currentStepIndex + 1, tourConfig.steps[currentStepIndex + 1])
    } else {
      // Tour completed
      markTourCompleted(tourId)
      tourConfig.onComplete?.()
      onComplete?.()
      onClose()
    }

    // Run afterHide callback
    if (currentStep.afterHide) { await currentStep.afterHide()
     }
  }

  const previousStep = async () => { if (!tourConfig) return

    const currentStep = tourConfig.steps[currentStepIndex];
    
    // Run beforeHide callback
    if (currentStep.beforeHide) {
      await currentStep.beforeHide()
     }

    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
      tourConfig.onStepChange?.(currentStepIndex - 1, tourConfig.steps[currentStepIndex - 1])
    }

    // Run afterHide callback
    if (currentStep.afterHide) { await currentStep.afterHide()
     }
  }

  const skipTour = () => { if (!tourConfig) return

    markTourSkipped(tourId)
    tourConfig.onSkip?.()
    onSkip?.()
    onClose()
   }

  const closeTour = () => {
    onClose()
  }

  if (!isOpen || !tourConfig) { return null
   }

  const currentStep = tourConfig.steps[currentStepIndex];
  const isLastStep = currentStepIndex === tourConfig.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] pointer-events-none"
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" />

        {/* Spotlight */}
        {targetElement && currentStep.spotlight !== false && (
          <SpotlightOverlay 
            element={targetElement } 
            styles={currentStep.styles?.spotlight}
          />
        )}

        {/* Beacon */}
        {targetElement && !currentStep.disableBeacon && currentStep.placement !== 'center' && (
          <TourBeacon 
            element={targetElement }
            ref={beaconRef}
          />
        )}

        {/* Tooltip */}
        <motion.div
          ref={tooltipRef}
          initial={{ opacity, 0,
  scale: 0.8 }}
          animate={{ opacity, 1,
  scale: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute pointer-events-auto"
          style={{
            left: tooltipPosition.x,
  top: tooltipPosition.y,
            ...(currentStep.styles?.tooltip || {})
          }}
        >
          <TourTooltip
            step={currentStep}
            stepIndex={currentStepIndex}
            totalSteps={tourConfig.steps.length}
            placement={tooltipPlacement}
            showProgress={tourConfig.showProgress}
            onNext={nextStep}
            onPrevious={previousStep}
            onSkip={skipTour}
            onClose={closeTour}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            showSkip={tourConfig.showSkipAll && currentStep.showSkip !== false}
            showPrevious={!isFirstStep && currentStep.showPrevious !== false}
            locale={tourConfig.locale}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Spotlight overlay component
function SpotlightOverlay({ 
  element, 
  styles = {} 
}: { 
  element: Element
  styles?; React.CSSProperties 
}) { const [elementRect, setElementRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    const updateRect = () => {
      setElementRect(element.getBoundingClientRect())
     }

    updateRect()
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)

    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [element])

  if (!elementRect) return null

  const spotlightRadius = 8;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `radial-gradient(
          ellipse ${elementRect.width / 2 + spotlightRadius}px ${elementRect.height / 2 + spotlightRadius}px 
          at ${elementRect.left + elementRect.width / 2}px ${elementRect.top + elementRect.height / 2}px,
          transparent 0%,
          transparent 50%,
          rgba(0, 0, 0, 0.7) 100%
        )`,
        ...styles}}
    />
  )
}

// Tour beacon component
const TourBeacon = React.forwardRef<HTMLDivElement, { element, Element }>(
  ({ element }, ref) => { const [elementRect, setElementRect] = useState<DOMRect | null>(null)

    useEffect(() => {
      const updateRect = () => {
        setElementRect(element.getBoundingClientRect())
       }

      updateRect()
      window.addEventListener('resize', updateRect)
      window.addEventListener('scroll', updateRect, true)

      return () => {
        window.removeEventListener('resize', updateRect)
        window.removeEventListener('scroll', updateRect, true)
      }
    }, [element])

    if (!elementRect) return null

    return (
      <motion.div
        ref={ref}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute pointer-events-none"
        style={{
          left: elementRect.left + elementRect.width / 2 - 12,
  top: elementRect.top + elementRect.height / 2 - 12
}}
      >
        <div className="relative">
          {/* Pulsing rings */}
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border-2 border-blue-400"
              animate={{
                scale: [1, 2, 1],
                opacity: [1, 0, 1]
}}
              transition={{
                duration, 2,
  repeat, Infinity,
                delay: i * 0.3
}}
              style={{
                width, 24,
  height: 24
}}
            />
          ))}
          
          {/* Center dot */}
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        </div>
      </motion.div>
    )
  }
)

TourBeacon.displayName = 'TourBeacon'

// Tour tooltip component
interface TourTooltipProps {
  step, OnboardingStep,
  stepIndex, number,
    totalSteps, number,
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  showProgress?, boolean,
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onClose: () => void;
  isFirstStep, boolean,
  isLastStep, boolean,
  showSkip?, boolean,
  showPrevious?; boolean;
  locale?: {;
  skip, string,
  previous, string,
    next, string,
  finish, string,
    close, string,
  
}
}

function TourTooltip({
  step, stepIndex,
  totalSteps, placement,
  showProgress = true, onNext,
  onPrevious, onSkip,
  onClose, isFirstStep, isLastStep,
  showSkip = true,
  showPrevious = true,
  locale = {
    skip: 'Skip Tour',
  previous: 'Previous',
    next: 'Next',
  finish: 'Finish',
    close: 'Close'
  }
}: TourTooltipProps) { const handleActionClick = async () => {
    if (step.actionHandler) {
      await step.actionHandler()
     }
  }

  return (
    <motion.div
      className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 max-w-sm relative"
      initial={{ opacity, 0,
  scale: 0.8 }}
      animate={{ opacity, 1,
  scale: 1 }}
    >
      {/* Arrow */}
      {placement !== 'center' && (
        <div
          className={`absolute w-3 h-3 bg-gray-800 border border-gray-700 rotate-45
            ${placement === 'top' ? 'bottom-[-7px] left-1/2 transform -translate-x-1/2 border-t-0 border-l-0' : ''}
            ${placement === 'bottom' ? 'top-[-7px] left-1/2 transform -translate-x-1/2 border-b-0 border-r-0' : ''}
            ${placement === 'left' ? 'right-[-7px] top-1/2 transform -translate-y-1/2 border-l-0 border-b-0' : ''} ${placement === 'right' ? 'left-[-7px] top-1/2 transform -translate-y-1/2 border-r-0 border-t-0' : ''}
          `}
        />
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-white pr-4">
            {step.title}
          </h3>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-white rounded-lg hover; bg-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress */}
        {showProgress && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">
                Step {stepIndex + 1 } of {totalSteps}
              </span>
              <span className="text-sm text-gray-400">
                {Math.round(((stepIndex + 1) / totalSteps) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div 
          className="text-gray-300 text-sm leading-relaxed mb-6"
          dangerouslySetInnerHTML={{ __html: typeof step.content === 'string' ? step.conten,
  t: ''}}
        />

        {/* Action Button */}
        {step.actionLabel && step.actionHandler && (
          <div className="mb-4">
            <button
              onClick={handleActionClick}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              {step.actionLabel}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {showSkip && (
              <button
                onClick={onSkip }
                className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
              >
                {locale.skip}
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {showPrevious && !isFirstStep && (
              <button
                onClick={onPrevious }
                className="flex items-center space-x-1 px-3 py-2 text-gray-400 hover:text-white rounded-lg hover; bg-gray-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>{locale.previous}</span>
              </button>
            )}

            <button
              onClick={onNext}
              className="flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <span>{isLastStep ? locale.finish : locale.next}</span>
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Tour manager hook
export function useTourManager() { const [activeTour, setActiveTour] = useState<string | null>(null)

  const startTour = (tourId: string) => {
    if (shouldShowTour(tourId)) {
      setActiveTour(tourId)
     }
  }

  const closeTour = () => {
    setActiveTour(null)
  }

  const restartTour = (tourId: string) => {
    setActiveTour(tourId)
  }

  return { activeTour, startTour, closeTour,
    restartTour
:   }
}

// Auto-start tour component
export function AutoStartTours({ userId  }: { userId?: string  }) { const { activeTour, startTour, closeTour  } = useTourManager()

  useEffect(() => { if (userId) {
      const progress = getOnboardingProgress();
      
      // Check if we should auto-start welcome tour
      if (progress.preferences.autoStartTours && shouldShowTour('welcome')) {
        startTour('welcome')
       }
    }
  }, [userId, startTour])

  if (!activeTour) { return null
   }

  return (
    <OnboardingTour
      tourId={activeTour}
      isOpen={true}
      onClose={closeTour}
    />
  )
}

import React from 'react'
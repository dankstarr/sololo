'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Sparkles, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

export interface ReasoningStep {
  id: string
  title: string
  description?: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  details?: string
  timestamp?: Date
}

interface AIReasoningPanelProps {
  steps: ReasoningStep[]
  isOpen?: boolean
  onToggle?: () => void
  title?: string
  showTimestamps?: boolean
  defaultExpanded?: boolean
}

export default function AIReasoningPanel({
  steps,
  isOpen: controlledIsOpen,
  onToggle,
  title = 'AI Reasoning Process',
  showTimestamps = true,
  defaultExpanded = false,
}: AIReasoningPanelProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultExpanded)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const setIsOpen = onToggle ? () => {} : setInternalIsOpen
  
  const togglePanel = () => {
    if (onToggle) {
      onToggle()
    } else {
      setInternalIsOpen(!internalIsOpen)
    }
  }
  
  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }
  
  const getStatusIcon = (status: ReasoningStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'pending':
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
    }
  }
  
  const getStatusColor = (status: ReasoningStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'processing':
        return 'bg-primary-50 border-primary-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'pending':
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }
  
  const activeSteps = steps.filter((s) => s.status !== 'pending')
  const hasActiveSteps = activeSteps.length > 0
  
  if (!hasActiveSteps && !isOpen) {
    return null
  }
  
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={togglePanel}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {hasActiveSteps && (
            <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">
              {activeSteps.length} step{activeSteps.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>
      
      {/* Steps */}
      {isOpen && (
        <div className="overflow-hidden">
          <div className="p-4 space-y-2 border-t border-gray-200">
            {steps.map((step, index) => {
              const isExpanded = expandedSteps.has(step.id)
              const isActive = step.status === 'processing' || step.status === 'completed'
              
              return (
                <div
                  key={step.id}
                  className={`scroll-fade-in border rounded-lg transition-all ${getStatusColor(step.status)}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                    <button
                      onClick={() => toggleStep(step.id)}
                      className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-white/50 transition-colors"
                      disabled={!isActive}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getStatusIcon(step.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-gray-900">{step.title}</h4>
                          {isActive && (
                            <ChevronDown
                              className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          )}
                        </div>
                        {step.description && (
                          <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                        )}
                        {showTimestamps && step.timestamp && (
                          <p className="text-xs text-gray-500 mt-1">
                            {step.timestamp.toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </button>
                    
                    {/* Step Details */}
                    {isExpanded && step.details && (
                      <div className="overflow-hidden animate-fade-in">
                        <div className="px-4 pb-3 pl-11 border-t border-gray-200/50 bg-white/30">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap pt-3">
                            {step.details}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

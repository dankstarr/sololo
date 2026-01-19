import { useState, useCallback } from 'react'
import { ReasoningStep } from '@/components/common/AIReasoningPanel'

export function useAIReasoning(initialSteps?: ReasoningStep[]) {
  const [steps, setSteps] = useState<ReasoningStep[]>(initialSteps || [])
  const [isOpen, setIsOpen] = useState(false)
  
  const addStep = useCallback((step: Omit<ReasoningStep, 'status' | 'timestamp'>) => {
    const newStep: ReasoningStep = {
      ...step,
      status: 'pending',
      timestamp: new Date(),
    }
    setSteps((prev) => [...prev, newStep])
    setIsOpen(true)
    return newStep.id
  }, [])
  
  const updateStep = useCallback((stepId: string, updates: Partial<ReasoningStep>) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId
          ? { ...step, ...updates, timestamp: updates.timestamp || step.timestamp || new Date() }
          : step
      )
    )
  }, [])
  
  const setStepStatus = useCallback((stepId: string, status: ReasoningStep['status'], details?: string) => {
    updateStep(stepId, { status, details })
  }, [updateStep])
  
  const startStep = useCallback((stepId: string) => {
    setStepStatus(stepId, 'processing')
  }, [setStepStatus])
  
  const completeStep = useCallback((stepId: string, details?: string) => {
    setStepStatus(stepId, 'completed', details)
  }, [setStepStatus])
  
  const failStep = useCallback((stepId: string, error: string) => {
    setStepStatus(stepId, 'error', error)
  }, [setStepStatus])
  
  const reset = useCallback(() => {
    setSteps([])
    setIsOpen(false)
  }, [])
  
  const clear = useCallback(() => {
    setSteps([])
  }, [])
  
  return {
    steps,
    isOpen,
    setIsOpen,
    addStep,
    updateStep,
    setStepStatus,
    startStep,
    completeStep,
    failStep,
    reset,
    clear,
  }
}

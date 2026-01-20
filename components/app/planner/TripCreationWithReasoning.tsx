'use client'

/**
 * Example component showing how to integrate AI Reasoning Panel
 * into TripCreation flow
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AIReasoningPanel } from '@/components/common'
import { useAIReasoning } from '@/hooks'
import { generateItinerary } from '@/lib/api/gemini'

export default function TripCreationWithReasoning() {
  const router = useRouter()
  const reasoning = useAIReasoning()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateItinerary = async (formData: {
    destination: string
    days: number
    interests: string[]
    travelMode: string
    pace: string
  }) => {
    setIsGenerating(true)
    reasoning.reset()
    reasoning.setIsOpen(true)

    try {
      // Step 1: Validate input
      const step1Id = reasoning.addStep({
        id: 'validate-input',
        title: 'Validating trip preferences',
        description: 'Checking destination, dates, and interests',
      })
      reasoning.startStep(step1Id)
      
      await new Promise((resolve) => setTimeout(resolve, 300))
      reasoning.completeStep(step1Id, `Validated: ${formData.destination} for ${formData.days} days with interests: ${formData.interests.join(', ')}`)

      // Step 2: Analyze travel style
      const step2Id = reasoning.addStep({
        id: 'analyze-style',
        title: 'Analyzing travel style',
        description: `Understanding ${formData.pace} pace and ${formData.travelMode} mode preferences`,
      })
      reasoning.startStep(step2Id)
      
      await new Promise((resolve) => setTimeout(resolve, 400))
      reasoning.completeStep(step2Id, `Travel style: ${formData.pace} pace, ${formData.travelMode} mode`)

      // Step 3: Generate itinerary with AI
      const step3Id = reasoning.addStep({
        id: 'generate-itinerary',
        title: 'Generating personalized itinerary',
        description: 'Using AI to create day-by-day plan',
      })
      reasoning.startStep(step3Id)

      const itinerary = await generateItinerary(
        formData.destination,
        formData.days,
        formData.interests,
        formData.travelMode,
        formData.pace
      )

      reasoning.completeStep(step3Id, `Generated ${formData.days}-day itinerary with ${formData.interests.length} interest categories`)

      // Step 4: Optimize routes
      const step4Id = reasoning.addStep({
        id: 'optimize-routes',
        title: 'Optimizing daily routes',
        description: 'Creating circular routes to minimize backtracking',
      })
      reasoning.startStep(step4Id)

      await new Promise((resolve) => setTimeout(resolve, 500))
      reasoning.completeStep(step4Id, 'Routes optimized for efficient travel')

      // Navigate to location selection
      router.push('/app/locations')
    } catch (error) {
      const errorStepId = reasoning.addStep({
        id: 'error',
        title: 'Error generating itinerary',
        description: 'An error occurred during generation',
      })
      reasoning.failStep(errorStepId, error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div>
      {/* AI Reasoning Panel */}
      {reasoning.steps.length > 0 && (
        <div className="mb-6">
          <AIReasoningPanel
            steps={reasoning.steps}
            isOpen={reasoning.isOpen}
            onToggle={() => reasoning.setIsOpen(!reasoning.isOpen)}
            title="AI Itinerary Generation"
            defaultExpanded={true}
          />
        </div>
      )}

      {/* Your form here */}
      <button
        onClick={() => handleGenerateItinerary({
          destination: 'Tokyo, Japan',
          days: 5,
          interests: ['food', 'culture'],
          travelMode: 'walking',
          pace: 'balanced',
        })}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate Itinerary'}
      </button>
    </div>
  )
}

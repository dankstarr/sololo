# AI Reasoning Panel Guide

This guide explains how to use the AI Reasoning Panel component to display step-by-step reasoning and collapsible thought processes when generating AI content.

## Overview

The AI Reasoning Panel provides a user-friendly way to show the AI's thinking process during content generation. It displays:
- Step-by-step reasoning
- Loading states for each step
- Collapsible details for each step
- Timestamps (optional)
- Error handling

## Components

### AIReasoningPanel

The main component that displays the reasoning steps.

```tsx
import { AIReasoningPanel } from '@/components/common'
import { ReasoningStep } from '@/components/common'

<AIReasoningPanel
  steps={steps}
  isOpen={isOpen}
  onToggle={() => setIsOpen(!isOpen)}
  title="AI Generation Process"
  showTimestamps={true}
  defaultExpanded={false}
/>
```

**Props:**
- `steps: ReasoningStep[]` - Array of reasoning steps
- `isOpen?: boolean` - Controlled open state
- `onToggle?: () => void` - Toggle handler
- `title?: string` - Panel title (default: "AI Reasoning Process")
- `showTimestamps?: boolean` - Show timestamps (default: true)
- `defaultExpanded?: boolean` - Default expanded state (default: false)

### ReasoningStep Interface

```typescript
interface ReasoningStep {
  id: string
  title: string
  description?: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  details?: string
  timestamp?: Date
}
```

**Status Types:**
- `pending` - Step hasn't started yet
- `processing` - Step is currently running (shows spinner)
- `completed` - Step finished successfully
- `error` - Step failed with an error

## Hook: useAIReasoning

A custom hook that manages reasoning steps state.

```tsx
import { useAIReasoning } from '@/hooks'

const reasoning = useAIReasoning(initialSteps?)
```

**Methods:**
- `addStep(step)` - Add a new step
- `updateStep(stepId, updates)` - Update a step
- `startStep(stepId)` - Mark step as processing
- `completeStep(stepId, details?)` - Mark step as completed
- `failStep(stepId, error)` - Mark step as failed
- `reset()` - Clear all steps and close panel
- `clear()` - Clear all steps (keeps panel open)
- `setIsOpen(open)` - Control panel visibility

## Usage Examples

### Basic Example

```tsx
'use client'

import { AIReasoningPanel } from '@/components/common'
import { useAIReasoning } from '@/hooks'

export default function MyComponent() {
  const reasoning = useAIReasoning()
  
  const handleGenerate = async () => {
    reasoning.reset()
    reasoning.setIsOpen(true)
    
    // Step 1
    const step1Id = reasoning.addStep({
      id: 'step-1',
      title: 'Analyzing input',
      description: 'Processing your request',
    })
    reasoning.startStep(step1Id)
    
    await someAsyncOperation()
    
    reasoning.completeStep(step1Id, 'Input analyzed successfully')
    
    // Step 2
    const step2Id = reasoning.addStep({
      id: 'step-2',
      title: 'Generating content',
      description: 'Creating AI response',
    })
    reasoning.startStep(step2Id)
    
    const result = await generateContent()
    
    reasoning.completeStep(step2Id, result)
  }
  
  return (
    <div>
      {reasoning.steps.length > 0 && (
        <AIReasoningPanel
          steps={reasoning.steps}
          isOpen={reasoning.isOpen}
          onToggle={() => reasoning.setIsOpen(!reasoning.isOpen)}
        />
      )}
      
      <button onClick={handleGenerate}>Generate</button>
    </div>
  )
}
```

### With Error Handling

```tsx
const handleGenerate = async () => {
  reasoning.reset()
  reasoning.setIsOpen(true)
  
  try {
    const stepId = reasoning.addStep({
      id: 'generate',
      title: 'Generating content',
    })
    reasoning.startStep(stepId)
    
    const result = await generateContent()
    reasoning.completeStep(stepId, result)
  } catch (error) {
    const errorStepId = reasoning.addStep({
      id: 'error',
      title: 'Error occurred',
      description: 'Generation failed',
    })
    reasoning.failStep(errorStepId, error.message)
  }
}
```

### Multiple Steps with Details

```tsx
const handleComplexGeneration = async () => {
  reasoning.reset()
  reasoning.setIsOpen(true)
  
  // Step 1: Validation
  const step1Id = reasoning.addStep({
    id: 'validate',
    title: 'Validating input',
    description: 'Checking all required fields',
  })
  reasoning.startStep(step1Id)
  await validateInput()
  reasoning.completeStep(step1Id, 'All inputs validated ✓')
  
  // Step 2: Analysis
  const step2Id = reasoning.addStep({
    id: 'analyze',
    title: 'Analyzing preferences',
    description: 'Understanding user preferences',
  })
  reasoning.startStep(step2Id)
  const analysis = await analyzePreferences()
  reasoning.completeStep(step2Id, `Found ${analysis.count} matching preferences`)
  
  // Step 3: Generation
  const step3Id = reasoning.addStep({
    id: 'generate',
    title: 'Generating recommendations',
    description: 'Creating personalized suggestions',
  })
  reasoning.startStep(step3Id)
  const recommendations = await generateRecommendations()
  reasoning.completeStep(step3Id, `Generated ${recommendations.length} recommendations`)
}
```

## Integration Points

### LocationSelection Component

The `LocationSelection` component uses the reasoning panel when:
- Replacing locations with alternatives
- Generating location explanations

### TripCreation Component

The `TripCreation` component can use the reasoning panel when:
- Generating itineraries
- Analyzing travel preferences
- Optimizing routes

## Best Practices

1. **Always reset before starting**: Call `reasoning.reset()` before a new generation process
2. **Open panel automatically**: Set `reasoning.setIsOpen(true)` when starting generation
3. **Provide meaningful descriptions**: Help users understand what's happening
4. **Include details on completion**: Add useful information in the `details` parameter
5. **Handle errors gracefully**: Always catch errors and show them in the panel
6. **Use unique step IDs**: Ensure each step has a unique `id` to avoid conflicts

## Styling

The component uses Tailwind CSS and follows the app's design system:
- Primary colors for active steps
- Green for completed steps
- Red for errors
- Gray for pending steps
- Smooth animations with Framer Motion

## Accessibility

- All interactive elements are keyboard accessible
- ARIA labels for screen readers
- Focus management
- Color contrast meets WCAG standards

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import TripCreation from '@/components/app/planner/TripCreation'
import { useAppStore } from '@/store/useAppStore'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock zustand store
jest.mock('@/store/useAppStore', () => ({
  useAppStore: jest.fn(),
}))

describe('TripCreation', () => {
  const mockPush = jest.fn()
  const mockIncrementItineraryCount = jest.fn()
  const mockCheckLimit = jest.fn(() => true)
  const mockSetCurrentTrip = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(useAppStore as jest.Mock).mockReturnValue({
      itineraryCount: 0,
      isPro: false,
      checkLimit: mockCheckLimit,
      incrementItineraryCount: mockIncrementItineraryCount,
      setCurrentTrip: mockSetCurrentTrip,
    })
  })

  it('renders the form with all fields', () => {
    render(<TripCreation />)
    
    expect(screen.getByText('Plan Your Trip')).toBeInTheDocument()
    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/number of days/i)).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Art')).toBeInTheDocument()
  })

  it('allows user to input destination', () => {
    render(<TripCreation />)
    
    const destinationInput = screen.getByLabelText(/destination/i)
    fireEvent.change(destinationInput, { target: { value: 'Tokyo' } })
    
    expect(destinationInput).toHaveValue('Tokyo')
  })

  it('allows user to toggle interests', () => {
    render(<TripCreation />)
    
    const foodButton = screen.getByRole('button', { name: /food interest/i })
    fireEvent.click(foodButton)
    
    expect(foodButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('submits form with valid data', async () => {
    render(<TripCreation />)
    
    const destinationInput = screen.getByLabelText(/destination/i)
    const daysInput = screen.getByLabelText(/number of days/i)
    const submitButton = screen.getByRole('button', { name: /generate itinerary/i })
    
    fireEvent.change(destinationInput, { target: { value: 'Tokyo' } })
    fireEvent.change(daysInput, { target: { value: '5' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockIncrementItineraryCount).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/app/locations')
    })
  })

  it('shows upgrade prompt when limit is reached', async () => {
    mockCheckLimit.mockReturnValue(false)
    ;(useAppStore as jest.Mock).mockReturnValue({
      itineraryCount: 20,
      isPro: false,
      checkLimit: mockCheckLimit,
      incrementItineraryCount: mockIncrementItineraryCount,
      setCurrentTrip: mockSetCurrentTrip,
    })

    render(<TripCreation />)
    
    const destinationInput = screen.getByLabelText(/destination/i)
    const daysInput = screen.getByLabelText(/number of days/i)
    const submitButton = screen.getByRole('button', { name: /generate itinerary/i })
    
    fireEvent.change(destinationInput, { target: { value: 'Tokyo' } })
    fireEvent.change(daysInput, { target: { value: '5' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/free limit reached/i)).toBeInTheDocument()
    })
  })

  it('has proper accessibility attributes', () => {
    render(<TripCreation />)
    
    const destinationInput = screen.getByLabelText(/destination/i)
    expect(destinationInput).toHaveAttribute('aria-required', 'true')
    expect(destinationInput).toHaveAttribute('aria-describedby')
    
    const foodButton = screen.getByRole('button', { name: /food interest/i })
    expect(foodButton).toHaveAttribute('aria-pressed')
  })
})

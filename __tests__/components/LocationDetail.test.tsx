import { render, screen, fireEvent } from '@testing-library/react'
import LocationDetail from '@/components/app/LocationDetail'

const mockLocation = {
  name: 'Senso-ji Temple',
  description: 'A beautiful temple in Tokyo',
  openingHours: '6:00 AM - 5:00 PM',
  address: '2 Chome-3-1 Asakusa, Taito City',
  crowdEstimate: 'Moderate',
  safetyNotes: 'Safe area, well-lit',
  photos: ['/photo1.jpg', '/photo2.jpg'],
}

const mockOnClose = jest.fn()

describe('LocationDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders location information', () => {
    render(<LocationDetail location={mockLocation} onClose={mockOnClose} />)
    
    expect(screen.getByText('Senso-ji Temple')).toBeInTheDocument()
    expect(screen.getByText('A beautiful temple in Tokyo')).toBeInTheDocument()
    expect(screen.getByText('6:00 AM - 5:00 PM')).toBeInTheDocument()
  })

  it('has proper modal structure', () => {
    const { container } = render(<LocationDetail location={mockLocation} onClose={mockOnClose} />)
    
    const dialog = container.querySelector('[role="dialog"]')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'location-detail-title')
  })

  it('closes when close button is clicked', () => {
    render(<LocationDetail location={mockLocation} onClose={mockOnClose} />)
    
    const closeButton = screen.getByRole('button', { name: /close location details/i })
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('has accessible buttons', () => {
    render(<LocationDetail location={mockLocation} onClose={mockOnClose} />)
    
    expect(screen.getByRole('button', { name: /play audio guide/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close location details/i })).toBeInTheDocument()
  })
})

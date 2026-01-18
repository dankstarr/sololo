import { render, screen, fireEvent } from '@testing-library/react'
import AudioGuide from '@/components/app/AudioGuide'

describe('AudioGuide', () => {
  it('renders audio controls', () => {
    render(<AudioGuide />)
    
    expect(screen.getByRole('button', { name: /play audio guide/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip to previous/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip to next/i })).toBeInTheDocument()
  })

  it('toggles play/pause state', () => {
    render(<AudioGuide />)
    
    const playButton = screen.getByRole('button', { name: /play audio guide/i })
    expect(playButton).toHaveAttribute('aria-pressed', 'false')
    
    fireEvent.click(playButton)
    expect(playButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /pause audio guide/i })).toBeInTheDocument()
  })

  it('has accessible progress bar', () => {
    render(<AudioGuide />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow')
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '180')
  })

  it('has proper dialog structure', () => {
    const { container } = render(<AudioGuide />)
    
    // Check for proper heading structure
    expect(screen.getByRole('heading', { name: /senso-ji temple/i })).toBeInTheDocument()
  })
})

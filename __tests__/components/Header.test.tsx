import { render, screen } from '@testing-library/react'
import Header from '@/components/marketing/Header'

describe('Header', () => {
  it('renders navigation links', () => {
    render(<Header />)
    
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument()
    expect(screen.getByText('Sololo')).toBeInTheDocument()
    expect(screen.getByText('How It Works')).toBeInTheDocument()
    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText('Discover')).toBeInTheDocument()
    expect(screen.getByText('Pricing')).toBeInTheDocument()
  })

  it('has accessible links with proper labels', () => {
    render(<Header />)
    
    const planTripLink = screen.getByRole('link', { name: /plan a trip/i })
    expect(planTripLink).toHaveAttribute('href', '/app')
    
    const howItWorksLink = screen.getByRole('link', { name: /navigate to how it works section/i })
    expect(howItWorksLink).toBeInTheDocument()
  })

  it('has proper semantic HTML', () => {
    const { container } = render(<Header />)
    
    expect(container.querySelector('header[role="banner"]')).toBeInTheDocument()
    expect(container.querySelector('nav[aria-label]')).toBeInTheDocument()
  })
})

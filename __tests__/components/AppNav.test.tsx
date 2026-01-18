import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import AppNav from '@/components/app/AppNav'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  Link: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

describe('AppNav', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders navigation items', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/app/home')
    
    render(<AppNav />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Itinerary')).toBeInTheDocument()
    expect(screen.getByText('Map')).toBeInTheDocument()
    expect(screen.getByText('Groups')).toBeInTheDocument()
    expect(screen.getByText('Discover')).toBeInTheDocument()
  })

  it('hides navigation on onboarding page', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/app')
    
    const { container } = render(<AppNav />)
    
    expect(container.firstChild).toBeNull()
  })

  it('marks active page correctly', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/app/home')
    
    render(<AppNav />)
    
    const homeLink = screen.getByRole('link', { name: /home/i })
    expect(homeLink).toHaveAttribute('aria-current', 'page')
  })

  it('has proper accessibility attributes', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/app/home')
    
    const { container } = render(<AppNav />)
    
    expect(container.querySelector('nav[aria-label]')).toBeInTheDocument()
  })
})

/**
 * Scroll-based animation utilities
 * Uses Intersection Observer API for performant scroll animations
 */

export function initScrollAnimations() {
  if (typeof window === 'undefined') return

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        // Keep observing to allow re-animation if needed
      } else {
        // Optionally remove visible class when out of view for re-animation
        // entry.target.classList.remove('visible')
      }
    })
  }, observerOptions)

  // Observe all elements with scroll animation classes
  const animatedElements = document.querySelectorAll(
    '.scroll-fade-in, .scroll-slide-left, .scroll-slide-right, .scroll-scale'
  )

  // Opt-in elements to "start hidden then reveal"
  animatedElements.forEach((el) => {
    el.classList.add('will-animate')
    const rect = el.getBoundingClientRect()
    const isInView = rect.top < window.innerHeight && rect.bottom > 0
    if (isInView) {
      el.classList.add('visible')
    }
    observer.observe(el)
  })

  return () => {
    animatedElements.forEach((el) => observer.unobserve(el))
  }
}

/**
 * Initialize scroll animations on page load
 */
export function setupScrollAnimations() {
  if (typeof window === 'undefined') return

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Small delay to ensure DOM is fully ready
      setTimeout(initScrollAnimations, 100)
    })
  } else {
    // DOM already ready, but wait a tick for hydration
    setTimeout(initScrollAnimations, 100)
  }
}

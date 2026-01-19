'use client'

import { useEffect } from 'react'
import { setupScrollAnimations } from '@/lib/utils/scroll-animations'

export default function ScrollAnimationInit() {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Show all elements that are already in viewport immediately
      const animatedElements = document.querySelectorAll(
        '.scroll-fade-in, .scroll-slide-left, .scroll-slide-right, .scroll-scale'
      )
      
      animatedElements.forEach((el) => {
        // Opt-in to "start hidden then reveal" behavior
        el.classList.add('will-animate')
        const rect = el.getBoundingClientRect()
        const isInView = rect.top < window.innerHeight + 100 && rect.bottom > -100
        if (isInView) {
          el.classList.add('visible')
        }
      })
    }
    
    // Setup scroll animations
    setupScrollAnimations()
  }, [])

  return null
}

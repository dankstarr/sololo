'use client'

export default function LazyMotionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Framer Motion removed: keep a compatible provider wrapper for legacy imports (no-op).
  return <>{children}</>
}

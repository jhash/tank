import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

export default function AppClerkProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Log warning instead of throwing to prevent 500 errors
  // This allows the app to continue running even if Clerk isn't configured
  if (!PUBLISHABLE_KEY) {
    if (typeof console !== 'undefined') {
      console.warn('[CLERK] Missing VITE_CLERK_PUBLISHABLE_KEY - Clerk features will be disabled')
    }
    // Return children without ClerkProvider if key is missing
    return <>{children}</>
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      {children}
    </ClerkProvider>
  )
}

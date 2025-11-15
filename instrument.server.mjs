import * as Sentry from '@sentry/tanstackstart-react'
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
})

// Log errors to Cloudflare observability with full stack traces
function logErrorToCloudflare(error, context = '') {
  const errorInfo = {
    message: error?.message || String(error),
    stack: error?.stack || 'No stack trace available',
    name: error?.name || 'Error',
    context,
    timestamp: new Date().toISOString(),
  }

  // console.error automatically sends logs to Cloudflare observability when enabled
  console.error('[SERVER ERROR]', JSON.stringify(errorInfo, null, 2))
  
  // Also log in a more readable format
  console.error(`[SERVER ERROR${context ? ` - ${context}` : ''}] ${errorInfo.name}: ${errorInfo.message}`)
  if (errorInfo.stack && errorInfo.stack !== errorInfo.message) {
    console.error('Stack trace:', errorInfo.stack)
  }
}

// Handle uncaught exceptions (Node.js environment only)
// Note: Cloudflare Workers automatically logs unhandled errors to observability
// when they occur in the fetch handler, but we enhance it here for Node.js dev
if (typeof process !== 'undefined' && process.on) {
  // Node.js environment (development)
  process.on('uncaughtException', (error) => {
    logErrorToCloudflare(error, 'uncaughtException')
    // Re-throw to maintain default behavior
    throw error
  })

  process.on('unhandledRejection', (reason, promise) => {
    const error = reason instanceof Error 
      ? reason 
      : new Error(`Unhandled promise rejection: ${String(reason)}`)
    logErrorToCloudflare(error, 'unhandledRejection')
  })
}

// Export a helper function for manual error logging
export function logServerError(error, context = '') {
  // Send to Sentry
  Sentry.captureException(error)
  // Also log to Cloudflare observability
  logErrorToCloudflare(error, context)
}

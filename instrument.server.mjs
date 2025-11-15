import * as Sentry from '@sentry/tanstackstart-react'
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
})

// Log errors to Cloudflare observability with full stack traces and request context
function logErrorToCloudflare(error, context = '', requestInfo = null) {
  const errorInfo = {
    message: error?.message || String(error),
    stack: error?.stack || 'No stack trace available',
    name: error?.name || 'Error',
    context,
    timestamp: new Date().toISOString(),
    ...(requestInfo && {
      request: {
        url: requestInfo.url || 'unknown',
        method: requestInfo.method || 'unknown',
        headers: requestInfo.headers ? Object.fromEntries(
          Object.entries(requestInfo.headers).map(([k, v]) => [
            k,
            typeof v === 'string' ? v : Array.isArray(v) ? v.join(', ') : String(v)
          ])
        ) : {},
        cf: requestInfo.cf || {},
      },
    }),
  }

  // console.error automatically sends logs to Cloudflare observability when enabled
  console.error('[SERVER ERROR]', JSON.stringify(errorInfo, null, 2))
  
  // Also log in a more readable format
  const contextStr = context ? ` - ${context}` : ''
  const requestStr = requestInfo?.url ? ` [${requestInfo.method || 'GET'} ${requestInfo.url}]` : ''
  console.error(`[SERVER ERROR${contextStr}${requestStr}] ${errorInfo.name}: ${errorInfo.message}`)
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
export function logServerError(error, context = '', requestInfo = null) {
  // Send to Sentry
  Sentry.captureException(error)
  // Also log to Cloudflare observability
  logErrorToCloudflare(error, context, requestInfo)
}

// Wrap fetch handler to catch and log errors with request context
// This will be called by TanStack Start's server entry
if (typeof globalThis !== 'undefined') {
  // Store original fetch if it exists (for Cloudflare Workers)
  const originalFetch = globalThis.fetch
  
  // Wrap fetch to catch errors
  if (originalFetch) {
    globalThis.fetch = async function(...args) {
      try {
        const response = await originalFetch.apply(this, args)
        
        // Log 4xx and 5xx responses as errors
        if (response && response.status >= 400) {
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown'
          const method = args[1]?.method || 'GET'
          const error = new Error(`HTTP ${response.status} ${response.statusText}`)
          error.name = 'HTTPError'
          logErrorToCloudflare(error, 'fetch-response', {
            url,
            method,
            status: response.status,
            statusText: response.statusText,
          })
        }
        
        return response
      } catch (error) {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown'
        const method = args[1]?.method || 'GET'
        logErrorToCloudflare(error, 'fetch-error', {
          url,
          method,
        })
        throw error
      }
    }
  }
}

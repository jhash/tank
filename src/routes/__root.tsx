import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  ErrorComponent,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header'

import ClerkProvider from '../integrations/clerk/provider'

import StoreDevtools from '../lib/demo-store-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import ConvexProvider from '../integrations/convex/provider'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  errorComponent: ({ error }) => {
    // Log error to Cloudflare observability
    if (typeof console !== 'undefined' && console.error) {
      const errorInfo = {
        message: error?.message || String(error),
        stack: error?.stack || 'No stack trace available',
        name: error?.name || 'Error',
        route: '/',
        timestamp: new Date().toISOString(),
      }
      console.error('[ROUTE ERROR]', JSON.stringify(errorInfo, null, 2))
      console.error(`[ROUTE ERROR] ${errorInfo.name}: ${errorInfo.message}`)
      if (errorInfo.stack && errorInfo.stack !== errorInfo.message) {
        console.error('Stack trace:', errorInfo.stack)
      }
    }

    return <ErrorComponent error={error} />
  },

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ClerkProvider>
          <ConvexProvider>
            <Header />
            {children}
            <TanStackDevtools
              config={{
                position: 'bottom-right',
              }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
                StoreDevtools,
                TanStackQueryDevtools,
              ]}
            />
          </ConvexProvider>
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  )
}

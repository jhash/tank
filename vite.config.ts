import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import fs from 'node:fs'
import path from 'node:path'

const config = defineConfig({
  plugins: [
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    // Custom plugin to process instrument.server.mjs
    {
      name: 'process-instrument',
      closeBundle() {
        const instrumentSource = fs.readFileSync('instrument.server.mjs', 'utf-8')
        const processed = instrumentSource.replace(
          /import\.meta\.env\.VITE_SENTRY_DSN/g,
          JSON.stringify(process.env.VITE_SENTRY_DSN || '')
        )
        const distPath = path.join('dist', 'server', 'instrument.server.mjs')
        fs.mkdirSync(path.dirname(distPath), { recursive: true })
        fs.writeFileSync(distPath, processed)
      },
    },
  ],
})

export default config

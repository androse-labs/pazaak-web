/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tanstackRouter from '@tanstack/router-plugin/vite'
import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.ts'],
    env: {
      VITE_API_URL: 'http://localhost:3000',
      VITE_API_SOCKET_URL: 'ws://localhost:3000',
    },
  },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: !process.env.VITEST,
      routeFileIgnorePattern: '\\.test\\.',
    }),
    react(),
    mdx(),
    tailwindcss(),
  ],
})

/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tanstackRouter from '@tanstack/router-plugin/vite'
import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // @ts-expect-error Vitest types are not up to date
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.ts'],
  },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    mdx(),
    tailwindcss(),
  ],
})

import js from '@eslint/js'
import globals from 'globals'
import { reactRefresh } from 'eslint-plugin-react-refresh'
import reactHooks from 'eslint-plugin-react-hooks'
import eslint from '@eslint/js'
import pluginQuery from '@tanstack/eslint-plugin-query'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig([
  { ignores: ['dist'] },
  {
    files: ['*.ts', '*.tsx'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  js.configs.recommended,
  eslint.configs.recommended,
  tseslint.configs.recommended,
  reactRefresh.configs.vite({
    extraHOCs: ['createFileRoute', 'createRootRoute'],
  }),
  reactHooks.configs.flat.recommended,
  pluginQuery.configs['flat/recommended'],
])

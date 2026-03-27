import js from '@eslint/js'
import globals from 'globals'
import eslint from '@eslint/js'
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
])

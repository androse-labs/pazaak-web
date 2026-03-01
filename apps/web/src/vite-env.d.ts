/// <reference types="vite/client" />

declare module '*.mdx' {
  import type { ComponentType } from 'react'
  const MDXComponent: ComponentType<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    components?: Record<string, ComponentType<any>>
  }>
  export default MDXComponent
}
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_SOCKET_URL: string
  // more env variables...
}

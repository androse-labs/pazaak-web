import { useEffect, useLayoutEffect, useRef } from 'react'

type Options = {
  onMessage: (event: MessageEvent) => void
  onClose: (event: CloseEvent) => void
}

export function useMatchSocket(url: string, { onMessage, onClose }: Options) {
  const onMessageRef = useRef(onMessage)
  const onCloseRef = useRef(onClose)

  useLayoutEffect(() => {
    onMessageRef.current = onMessage
    onCloseRef.current = onClose
  })

  useEffect(() => {
    let ws: WebSocket
    let cancelled = false

    const connect = () => {
      ws = new WebSocket(url)
      ws.onmessage = (e) => onMessageRef.current(e)
      ws.onclose = (e) => {
        onCloseRef.current(e)
        if (!cancelled) setTimeout(connect, 1000)
      }
    }

    connect()
    return () => {
      cancelled = true
      ws?.close()
    }
  }, [url])
}

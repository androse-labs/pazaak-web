import { useEffect, useRef, useCallback } from 'react'
import { useAudioConfigStore } from '../stores/audioConfigStore'

export function useAudio(url: string) {
  const { isMuted, volume } = useAudioConfigStore()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audioRef only on mount or when url changes
  useEffect(() => {
    audioRef.current = new Audio(url)
    // Clean up the audio instance if needed
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [url])

  const play = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.currentTime = 0
    audioRef.current.volume = volume / 100
    if (!isMuted) {
      audioRef.current.play()
    }
  }, [isMuted, volume])

  return play
}

import { useAudioConfigStore } from '../stores/audioConfigStore'
import { useRef, useCallback } from 'react'

export function useAudio(url: string) {
  const { isMuted, volume } = useAudioConfigStore()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  if (!audioRef.current) {
    audioRef.current = new Audio(url)
  }

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

import { useAudioConfigStore } from '../stores/audioConfigStore'
import { useRef } from 'react'

export function useAudio(url: string) {
  const { isMuted, volume } = useAudioConfigStore()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const play = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url)
    }

    audioRef.current.currentTime = 0
    audioRef.current.volume = volume
    if (!isMuted) audioRef.current.play()
  }

  return play
}

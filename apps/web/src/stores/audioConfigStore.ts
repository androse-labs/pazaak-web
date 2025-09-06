import { create } from 'zustand'

interface AudioConfigStore {
  isMuted: boolean
  volume: number
  toggleMute: () => void
  setVolume: (volume: number) => void
}

export const useAudioConfigStore = create<AudioConfigStore>((set) => ({
  isMuted: false,
  volume: 1,
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setVolume: (volume: number) => set({ volume }),
}))

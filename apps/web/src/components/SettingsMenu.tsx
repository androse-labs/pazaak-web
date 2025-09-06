import { Settings, Volume2, VolumeX } from 'lucide-react'
import { Modal } from './Modal'
import { useAudioConfigStore } from '../stores/audioConfigStore'
import { useState } from 'react'

export const SettingsMenu = () => {
  const { setVolume, volume, toggleMute, isMuted } = useAudioConfigStore(
    (s) => s,
  )
  const [sliderValue, setSliderValue] = useState(volume)

  // Sync slider with volume store
  const handleVolumeChange = (v: number) => {
    setSliderValue(v)
    setVolume(v)
  }

  return (
    <>
      <div
        className="btn btn-ghost text-base normal-case lg:text-xl"
        onClick={() => {
          const modal = document.getElementById('settings-menu-modal')
          if (modal instanceof HTMLDialogElement) {
            modal.showModal()
          }
        }}
        aria-label="Settings"
      >
        <Settings />
      </div>
      <Modal id="settings-menu-modal">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <Settings /> Settings
        </h3>
        <div className="flex flex-col">
          <div className="flex flex-col gap-2">
            <span className="text-md font-semibold">Volume</span>
            <div className="flex items-center gap-4">
              <div className={'tooltip'} data-tip={isMuted ? 'Unmute' : 'Mute'}>
                <button
                  className={`btn btn-square ${isMuted ? 'btn-error' : 'btn-ghost'}`}
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX /> : <Volume2 />}
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : sliderValue}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="range range-primary range-sm w-full"
                disabled={isMuted}
              />
              <span className="w-8 text-center text-sm">
                {isMuted ? 0 : sliderValue}
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

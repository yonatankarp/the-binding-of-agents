import { useState, useEffect, useRef } from 'react'
import { ISAAC_CHARACTERS } from './sprites'
import { PixelSprite } from './PixelSprite'

interface CharacterPickerProps {
  currentSprite: string
  onSelect: (sprite: string) => void
  onClose: () => void
}

export function CharacterPicker({ currentSprite, onSelect, onClose }: CharacterPickerProps) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const filtered = search
    ? ISAAC_CHARACTERS.filter(s => s.includes(search.toLowerCase()))
    : [...ISAAC_CHARACTERS]

  return (
    <div
      className="fixed inset-0 theme-modal-scrim z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="character-picker"
        onClick={e => e.stopPropagation()}
      >
        <h1 className="character-picker__title">WHO AM I?</h1>
        <div className="character-picker__search">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter characters..."
            className="character-picker__search-input"
          />
        </div>
        <div className="character-picker__grid">
          {filtered.map(sprite => (
            <button
              key={sprite}
              type="button"
              onClick={() => { onSelect(sprite); onClose() }}
              className={`character-picker__cell${sprite === currentSprite ? ' is-selected' : ''}`}
              title={sprite}
              aria-label={sprite}
            >
              <div className="character-picker__portrait">
                <PixelSprite sprite={sprite} alt={sprite} />
              </div>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="character-picker__close"
          onClick={onClose}
        >
          CLOSE
        </button>
      </div>
    </div>
  )
}

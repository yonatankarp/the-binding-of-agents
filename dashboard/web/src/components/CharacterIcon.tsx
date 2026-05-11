import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CharacterPicker } from './CharacterPicker'
import { setSprite } from '../api'
import { PixelSprite } from './PixelSprite'
import { tinySpriteScaleFor, useSpriteNaturalSize } from '../utils/spriteSizing'

export function hashString(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

interface CharacterIconProps {
  sessionId: string
  size?: number
  noGlow?: boolean
  doneFlash?: boolean
  spriteOverride?: string
  editable?: boolean
  noBg?: boolean
}

export function CharacterIcon({ sessionId, size = 40, noGlow, doneFlash, spriteOverride, editable, noBg }: CharacterIconProps) {
  const sprite = spriteOverride || 'isaac'
  const [showPicker, setShowPicker] = useState(false)
  const naturalSize = useSpriteNaturalSize(sprite)
  const baseScale = size < 32 ? size / 32 : 1
  const scale = baseScale * tinySpriteScaleFor(naturalSize)

  const handleSelect = async (newSprite: string) => {
    await setSprite(sessionId, newSprite)
  }

  return (
    <>
      <div
        className={`shrink-0 flex items-center justify-center overflow-visible ${!noGlow && !noBg ? 'theme-bg-panel-muted rounded-lg' : ''} ${editable ? 'cursor-pointer hover:brightness-125' : ''}`}
        style={{ width: size, height: size }}
        onClick={editable ? (e) => { e.stopPropagation(); setShowPicker(true) } : undefined}
      >
        <PixelSprite
          className="creature-sprite"
          sprite={sprite}
          alt={sprite}
          scale={scale}
        />
      </div>
      {showPicker && createPortal(
        <CharacterPicker
          currentSprite={sprite}
          onSelect={handleSelect}
          onClose={() => setShowPicker(false)}
        />,
        document.body
      )}
    </>
  )
}

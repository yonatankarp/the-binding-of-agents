import { useState, useEffect, useCallback, useRef } from 'react'
import { GameModal } from './GameModal'
import { RunSummary } from '../types'
import { fetchRuns, searchRuns, reviveRun, fetchSessionPreview } from '../api'
import { PixelSprite } from './PixelSprite'

interface SessionBrowserProps {
  onClose: () => void
  activeRunIds?: Set<string>
  onResume?: (runId: string) => void
}

const GRID_COLS = 6
const GRID_ROWS = 5
const PER_BOX = GRID_COLS * GRID_ROWS

// Bestiary palette is tokenized so Classic does not inherit GBA grass/chrome.
const GRASS_LIGHT  = 'var(--theme-bestiary-grid-light)'
const GRASS_DARK   = 'var(--theme-bestiary-grid-dark)'
const PANEL_BG     = 'var(--theme-bestiary-panel-bg)'
const PANEL_DARK   = 'var(--theme-bestiary-panel-border)'
const PANEL_BORDER = 'var(--theme-bestiary-panel-border)'
const HDR_BG       = 'var(--theme-bestiary-header-bg)'
const CELL_HOVER   = 'var(--theme-bestiary-cell-hover)'
const CELL_SEL     = 'var(--theme-bestiary-cell-selected)'
const CELL_BG      = 'var(--theme-bestiary-cell-bg)'
const CELL_BORDER  = 'var(--theme-bestiary-cell-border)'
const CELL_HOVER_BORDER = 'var(--theme-bestiary-cell-hover-border)'
const CELL_SELECTED_BORDER = 'var(--theme-bestiary-cell-selected-border)'
const INFO_HEADER_BG = 'var(--theme-bestiary-info-header-bg)'
const FRAME_SHINE  = 'var(--theme-modal-frame-shine)'
const SCANLINE_BG = 'var(--theme-scanline-bg)'
const scanlineStyle = {
  content: '""',
  position: 'absolute' as const,
  inset: 0,
  pointerEvents: 'none' as const,
  background: SCANLINE_BG,
}
const BESTIARY_SPRITE_SCALE = 0.7
const BESTIARY_LABEL_ROOM_PX = 18

function BestiarySprite({ sprite, alt = '', scale = BESTIARY_SPRITE_SCALE, shiftY = 0 }: {
  sprite: string
  alt?: string
  scale?: number
  shiftY?: number
}) {
  return <PixelSprite sprite={sprite} alt={alt} scale={scale} shiftY={shiftY} shadow="none" />
}


export function SessionBrowser({ onClose, activeRunIds, onResume }: SessionBrowserProps) {
  const [allResults, setAllResults]           = useState<RunSummary[]>([])
  const [filteredResults, setFilteredResults] = useState<RunSummary[]>([])
  const [query, setQuery]                     = useState('')
  const [loading, setLoading]                 = useState(false)
  const [selectedId, setSelectedId]           = useState<string | null>(null)
  const [revivingId, setRevivingId]           = useState<string | null>(null)
  const [reviveResult, setReviveResult]       = useState<'ok' | 'fail' | null>(null)
  const [revivedIds, setRevivedIds]           = useState<Set<string>>(new Set())
  const [boxPage, setBoxPage]                 = useState(0)
  const [preview, setPreview]                 = useState<{ user_prompt: string; last_summary: string } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filterActive = (r: RunSummary[]) =>
    activeRunIds ? r.filter(p => !activeRunIds.has(p.run_id)) : r

  useEffect(() => {
    fetchRuns(200).then((r) => {
      const filtered = filterActive(r)
      setAllResults(filtered)
      setFilteredResults(filtered)
      if (filtered.length > 0) setSelectedId(filtered[0].run_id)
    })
  }, [])


  const selected = filteredResults.find(r => r.run_id === selectedId) ?? filteredResults[0] ?? null

  // Fetch preview (last prompt + last message) when selection changes — keyed by
  // the run's latest transcript session_id.
  useEffect(() => {
    if (!selected?.latest_session?.session_id) { setPreview(null); return }
    let cancelled = false
    setPreview(null)
    fetchSessionPreview(selected.latest_session.session_id).then(p => { if (!cancelled) setPreview(p) })
    return () => { cancelled = true }
  }, [selected?.latest_session?.session_id])

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q)
    if (!q.trim()) {
      setFilteredResults(allResults.filter(r => !revivedIds.has(r.run_id)))
      return
    }
    setLoading(true)
    try {
      const resp = await searchRuns(q, 50)
      setFilteredResults(filterActive(resp.runs || []).filter(r => !revivedIds.has(r.run_id)))
    } catch { setFilteredResults([]) }
    setLoading(false)
  }, [allResults, revivedIds])

  const handleRevive = async (runId: string, compact?: 'yes' | 'no') => {
    setRevivingId(runId)
    setReviveResult(null)
    try {
      const ok = await reviveRun(runId, compact)
      if (ok) {
        setReviveResult('ok')
        onResume?.(runId)
        setTimeout(() => {
          setRevivedIds(prev => new Set([...prev, runId]))
          setFilteredResults(prev => prev.filter(r => r.run_id !== runId))
          setAllResults(prev => prev.filter(r => r.run_id !== runId))
          setRevivingId(null)
          setReviveResult(null)
          const remaining = filteredResults.filter(r => r.run_id !== runId)
          setSelectedId(remaining[0]?.run_id ?? null)
        }, 1500)
      } else {
        setReviveResult('fail')
        setTimeout(() => { setRevivingId(null); setReviveResult(null) }, 2000)
      }
    } catch {
      setReviveResult('fail')
      setTimeout(() => { setRevivingId(null); setReviveResult(null) }, 2000)
    }
  }

  const displayList = filteredResults
  const boxCount  = Math.max(1, Math.ceil(displayList.length / PER_BOX))
  const safePage  = Math.min(boxPage, boxCount - 1)
  const boxSlots  = Array.from({ length: PER_BOX }, (_, i) => displayList[safePage * PER_BOX + i] ?? null)

  const getSprite = (p: RunSummary) => p.sprite || 'isaac'

  return (
    <GameModal title="The Bestiary" onClose={onClose} width="min(820px, 96vw)" height="min(680px, 96vh)" scanlines={false}>
        <div style={{
          background: 'var(--theme-bestiary-shell-bg)',
          borderRadius: '0 0 8px 8px', border: `2px solid ${FRAME_SHINE}`,
          display: 'flex', overflow: 'hidden', flex: 1, minHeight: 0,
        }}>

          {/* ── LEFT: RUN DATA panel ── */}
          <div style={{
            width: 220, flexShrink: 0, background: PANEL_BG,
            borderRight: `3px solid ${PANEL_BORDER}`,
            display: 'flex', flexDirection: 'column',
            position: 'relative',
          }}>
            <div className="bestiary-local-scanlines" style={scanlineStyle} />
            <div style={{
              background: HDR_BG,
              height: 49,
              padding: '0 16px', borderBottom: `3px solid ${PANEL_BORDER}`,
              display: 'flex', alignItems: 'center',
            }}>
              <span style={{ fontFamily: 'var(--theme-font-display)', fontSize: 'var(--theme-type-m)', color: 'var(--theme-text-primary)', textShadow: 'var(--theme-text-shadow-pixel)', letterSpacing: 0.5, lineHeight: 1.5 }}>
                {selected ? (selected.display_name || selected.run_id.slice(0, 8)) : 'No data'}
              </span>
            </div>

            {selected ? (
              <RunDataPanel
                run={selected}
                sprite={getSprite(selected)}
                preview={preview}
                revivingId={revivingId}
                reviveResult={reviveResult}
                onRevive={handleRevive}
              />
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--theme-font-display)', fontSize: 'var(--theme-type-s)', color: PANEL_DARK, opacity: 0.5 }}>No data</span>
              </div>
            )}
          </div>

          {/* ── RIGHT: Box grid ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              background: HDR_BG,
              borderBottom: '3px solid var(--theme-card-border)', padding: '0 16px', height: 49,
              display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
              position: 'relative',
            }}>
              <div className="bestiary-local-scanlines" style={scanlineStyle} />
              <button
                onClick={() => { setBoxPage(p => Math.max(0, p - 1)); setSelectedId(null) }}
                disabled={safePage === 0}
                aria-label="Previous box"
                style={{
                  background: safePage === 0 ? 'var(--theme-panel-divider)' : 'var(--theme-panel-muted-bg)',
                  border: '2px solid var(--theme-panel-divider)',
                  borderRadius: 6, padding: '6px 12px', cursor: safePage === 0 ? 'default' : 'pointer',
                  color: safePage === 0 ? 'var(--theme-panel-subtle-bg)' : 'var(--theme-text-primary)',
                  fontFamily: 'var(--theme-font-display)', fontSize: 'var(--theme-type-l)',
                  textShadow: 'var(--theme-text-shadow-pixel)', lineHeight: 1, transition: 'all 0.1s',
                }}
              ><BestiaryArrow direction="left" /></button>
              <span style={{
                fontFamily: 'var(--theme-font-display)', fontSize: 'var(--theme-type-m)', color: 'var(--theme-text-primary)',
                textShadow: 'var(--theme-text-shadow-pixel)',
                letterSpacing: 3, minWidth: 90, textAlign: 'center',
              }}>
                PAGE {safePage + 1}
              </span>
              <button
                onClick={() => { setBoxPage(p => Math.min(boxCount - 1, p + 1)); setSelectedId(null) }}
                disabled={safePage >= boxCount - 1}
                aria-label="Next box"
                style={{
                  background: safePage >= boxCount - 1 ? 'var(--theme-panel-divider)' : 'var(--theme-panel-muted-bg)',
                  border: '2px solid var(--theme-panel-divider)',
                  borderRadius: 6, padding: '6px 12px',
                  cursor: safePage >= boxCount - 1 ? 'default' : 'pointer',
                  color: safePage >= boxCount - 1 ? 'var(--theme-panel-subtle-bg)' : 'var(--theme-text-primary)',
                  fontFamily: 'var(--theme-font-display)', fontSize: 'var(--theme-type-l)',
                  textShadow: 'var(--theme-text-shadow-pixel)', lineHeight: 1, transition: 'all 0.1s',
                }}
              ><BestiaryArrow direction="right" /></button>
              <input
                ref={searchRef} type="text" value={query}
                onChange={e => handleSearch(e.target.value)} placeholder="Search agents..."
                style={{
                  marginLeft: 'auto', width: 240,
                  background: 'var(--theme-chat-input-bg)',
                  border: '2px solid var(--theme-panel-divider)', borderRadius: 6,
                  boxShadow: 'var(--theme-shadow-panel)',
                  padding: '6px 10px', color: 'var(--theme-text-primary)', fontFamily: 'var(--theme-font-mono)',
                  fontSize: 'var(--agent-card-output-font-size, 10px)', outline: 'none',
                }}
              />
              {loading && <span style={{ fontFamily: 'var(--theme-font-mono)', fontSize: 'var(--theme-type-m)', color: 'var(--theme-text-muted)', flexShrink: 0 }}>...</span>}
            </div>

            <div style={{
              flex: 1, minHeight: 0, padding: '14px 16px',
              background: 'var(--theme-bestiary-panel-bg)',
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
              gap: 6,
            }}>
              {boxSlots.map((run, i) => (
                <GridCell
                  key={i}
                  run={run}
                  sprite={run ? getSprite(run) : null}
                  isSelected={run?.run_id === selected?.run_id}
                  onClick={() => run && setSelectedId(run.run_id)}
                />
              ))}
            </div>
          </div>
        </div>
    </GameModal>
  )
}


function BestiaryArrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'block',
        width: 0,
        height: 0,
        borderTop: '5px solid transparent',
        borderBottom: '5px solid transparent',
        borderLeft: direction === 'right' ? '7px solid currentColor' : undefined,
        borderRight: direction === 'left' ? '7px solid currentColor' : undefined,
      }}
    />
  )
}

function GridCell({ run, sprite, isSelected, onClick }: {
  run: RunSummary | null
  sprite: string | null
  isSelected: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const label = run ? (run.display_name || run.profile_name || run.run_id.slice(0, 8)) : ''
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => run && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 0, borderRadius: 4, cursor: run ? 'pointer' : 'default',
        background: isSelected ? CELL_SEL : hovered && run ? CELL_HOVER : CELL_BG,
        border: isSelected
          ? `2px solid ${CELL_SELECTED_BORDER}`
          : hovered && run
            ? `2px solid ${CELL_HOVER_BORDER}`
            : `2px solid ${CELL_BORDER}`,
        boxShadow: isSelected ? 'var(--theme-shadow-panel)' : 'var(--theme-shadow-panel)',
        transition: 'background 0.08s, border-color 0.08s', overflow: 'hidden',
      }}
    >
      {sprite && (
        <BestiarySprite sprite={sprite} shiftY={-7} />
      )}
      {run && (
        <div
          title={label}
          style={{
            position: 'absolute',
            left: 4,
            right: 4,
            bottom: 3,
            height: BESTIARY_LABEL_ROOM_PX,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--theme-font-display)',
              fontSize: 'var(--theme-type-xs)',
              lineHeight: 1,
              color: 'var(--theme-text-primary)',
              textShadow: 'var(--theme-text-shadow-pixel)',
              background: 'var(--theme-panel-muted-bg)',
              borderRadius: 3,
              padding: '2px 3px',
            }}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  )
}


function backendLabel(backend?: string): string {
  if (!backend) return 'Claude'
  const b = backend.toLowerCase()
  if (b.includes('codex') || b.includes('gpt') || b.includes('openai')) return 'Codex'
  if (b.includes('claude')) return 'Claude'
  return backend
}

function MetaPill({ label }: { label?: string }) {
  if (!label) return null
  return (
    <span
      style={{
        fontFamily: 'var(--theme-font-display)',
        fontSize: 'var(--theme-type-xs)',
        lineHeight: 1.2,
        color: 'var(--theme-text-primary)',
        background: 'var(--theme-panel-muted-bg)',
        border: '1px solid var(--theme-panel-divider)',
        borderRadius: 3,
        padding: '2px 5px',
        textShadow: 'var(--theme-text-shadow-pixel)',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  )
}

function RunDataPanel({ run, sprite, preview, revivingId, reviveResult, onRevive }: {
  run: RunSummary
  sprite: string
  preview: { user_prompt: string; last_summary: string } | null
  revivingId: string | null
  reviveResult: 'ok' | 'fail' | null
  onRevive: (id: string, compact?: 'yes' | 'no') => void
}) {
  const isReviving = revivingId === run.run_id
  const name = run.display_name || run.run_id.slice(0, 8)
  const [r, g, b] = run.project_color || [100, 100, 100]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 10px', gap: 7, overflow: 'hidden' }}>
      <div style={{
        background: 'var(--theme-bestiary-panel-bg)',
        border: `2px solid ${PANEL_BORDER}`, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 8, height: 140, flexShrink: 0, overflow: 'hidden',
      }}>
        <BestiarySprite sprite={sprite} alt={name} scale={1.2} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flexShrink: 0 }}>
        <MetaPill label={run.interface === 'chat' ? 'Chat' : 'iTerm2'} />
        <MetaPill label={backendLabel(run.agent_backend)} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flexShrink: 0 }}>
        {run.role && (
          <span
            className="text-xs theme-font-display theme-text-primary rounded-sm px-1.5 py-px pixel-shadow shrink-0 uppercase"
            style={{ background: 'var(--theme-panel-muted-bg)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            {run.role_emoji ? `${run.role_emoji} ${run.role}` : run.role}
          </span>
        )}
        {(run.project || run.profile_name) && (
          <span
            className="text-xs theme-font-display theme-text-primary rounded-sm px-1.5 py-px pixel-shadow shrink-0 uppercase"
            style={{
              background: `rgba(${r}, ${g}, ${b}, 0.6)`,
              border: `1px solid rgba(${r}, ${g}, ${b}, 0.8)`,
            }}
          >
            {run.project || run.profile_name}
          </span>
        )}
        {run.task_group && (
          <span
            className="text-xs theme-font-display theme-text-secondary rounded-sm px-1.5 py-px pixel-shadow shrink-0 uppercase"
            style={{
              background: 'var(--theme-accent-purple)',
              border: '1px solid var(--theme-accent-purple)',
            }}
          >
            {run.task_group}
          </span>
        )}
        {run.conversation_count > 1 && (
          <span
            className="text-xs theme-font-display theme-text-secondary rounded-sm px-1.5 py-px pixel-shadow shrink-0"
            style={{
              background: 'var(--theme-panel-subtle-bg)',
              border: '1px solid var(--theme-panel-divider)',
            }}
            title="Conversations under this run"
          >
            {run.conversation_count}×
          </span>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <InfoBox label="Last prompt" text={preview?.user_prompt || run.latest_session?.snippet || run.latest_session?.first_user_msg} />
        <InfoBox label="Last message" text={preview?.last_summary} />
      </div>

      {isReviving ? (
        <div
          style={{
            width: '100%', padding: '8px 0', borderRadius: 5,
            border: reviveResult === 'ok' ? '2px solid var(--theme-accent-green)'
              : reviveResult === 'fail' ? '2px solid var(--theme-accent-red)'
              : '2px solid var(--theme-accent-yellow)',
            background: reviveResult === 'ok' ? 'linear-gradient(180deg, var(--theme-accent-green) 0%, var(--theme-accent-green) 100%)'
              : reviveResult === 'fail' ? 'linear-gradient(180deg, var(--theme-accent-red) 0%, var(--theme-accent-red) 100%)'
              : 'linear-gradient(180deg, var(--theme-accent-yellow) 0%, var(--theme-accent-yellow) 100%)',
            fontFamily: 'var(--theme-font-display)', fontSize: 'var(--theme-type-s)', color: 'var(--theme-text-primary)',
            textShadow: 'var(--theme-text-shadow-pixel)', letterSpacing: 1,
            textAlign: 'center', transform: 'translateY(2px)', flexShrink: 0,
          }}
        >
          {reviveResult === 'ok' ? '✓ REVIVED!' : reviveResult === 'fail' ? '✗ FAILED' : '▶▶ REVIVING...'}
        </div>
      ) : (
        <button
          onClick={() => onRevive(run.run_id)}
          style={{
            width: '100%', padding: '8px 0', borderRadius: 5, border: '2px solid var(--theme-bestiary-action-primary-border)',
            background: 'var(--theme-bestiary-action-primary-bg)',
            boxShadow: 'var(--theme-shadow-panel)',
            cursor: 'pointer', fontFamily: 'var(--theme-font-display)', fontSize: 'var(--theme-type-s)',
            color: 'var(--theme-text-primary)', textShadow: 'var(--theme-text-shadow-pixel)', letterSpacing: 1,
            transition: 'all 0.1s', flexShrink: 0,
          }}
        >
          ▶ Resume
        </button>
      )}
    </div>
  )
}

function InfoBox({ label, text }: { label: string; text?: string }) {
  return (
    <div style={{
      flex: 1,
      minHeight: 0,
      background: 'var(--theme-chat-tool-bg)',
      borderRadius: 6,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: 'var(--theme-shadow-panel)',
    }}>
      <div style={{
        padding: '3px 8px 2px',
        flexShrink: 0,
        borderBottom: '1px solid var(--theme-panel-divider, rgba(255,255,255,0.08))',
        marginBottom: 2,
      }}>
        <span style={{
          fontFamily: 'var(--theme-font-display)',
          fontSize: '9px',
          fontWeight: 700,
          color: 'var(--theme-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          {label}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
        {text ? (
          <p style={{
            fontFamily: 'var(--theme-font-mono)',
            fontSize: 'var(--agent-card-output-font-size, 10px)',
            color: 'var(--theme-text-secondary)',
            lineHeight: 1.45,
            wordBreak: 'break-word', whiteSpace: 'pre-wrap', margin: 0,
          }}
            dangerouslySetInnerHTML={{ __html: text }}
          />
        ) : (
          <span style={{
            fontFamily: 'var(--theme-font-mono)',
            fontSize: 'var(--agent-card-output-font-size, 10px)',
            color: 'var(--theme-text-faint)',
          }}>—</span>
        )}
      </div>
    </div>
  )
}

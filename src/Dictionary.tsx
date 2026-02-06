import React, { useEffect, useMemo, useRef, useState } from 'react'

/* ========================================================= */
/* Types                                                     */
/* ========================================================= */

type Card = {
  id: string
  cs: string
  sv: string
}

type Stat = {
  seen: number
  known: number
  unknown: number
  lastAnswerAt?: number
}

type HistoryState = {
  statsById: Record<string, Stat>
  lastSessionAt: number
  totalAnswers: number
}

/* ========================================================= */
/* Constants & utils                                         */
/* ========================================================= */

const STORAGE_KEY = 'sv-cs-trainer:v1'
const DIRECTION_KEY = 'sv-cs-trainer:direction:v1'
const REVEAL_DELAY_MS = 3000

export type Direction = 'sv-cs' | 'cs-sv'

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

const loadTxtFromPublic = async (path: string) => {
  const base = process.env.PUBLIC_URL || ''
  const res = await fetch(`${base}/${path}`)
  if (!res.ok) throw new Error(`Failed to load ${path}`)
  return res.text()
}

const safeJsonParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const parseTxt = (txt: string): Card[] => {
  return txt
    .split(/\r?\n/g)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'))
    .map((line, i) => {
      const parts = line.split('<>')
      if (parts.length < 2) return null
      const cs = parts[0].trim()
      const sv = parts.slice(1).join('<>').trim()
      if (!cs || !sv) return null
      return { id: `${i}-${cs}-${sv}`, cs, sv }
    })
    .filter(Boolean) as Card[]
}

const getInitialHistory = (): HistoryState =>
  safeJsonParse<HistoryState>(localStorage.getItem(STORAGE_KEY), {
    statsById: {},
    lastSessionAt: Date.now(),
    totalAnswers: 0,
  })

const saveHistory = (h: HistoryState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(h))
}

const getStoredDirection = (): Direction => {
  const v = localStorage.getItem(DIRECTION_KEY)
  return v === 'cs-sv' ? 'cs-sv' : 'sv-cs'
}

const saveDirection = (d: Direction) => {
  localStorage.setItem(DIRECTION_KEY, d)
}

const getWeight = (card: Card, stat?: Stat) => {
  if (!stat) return 3
  const base = 1
  const unknownBoost = stat.unknown * 3
  const knownPenalty = stat.known * 1.5
  const hoursSince = stat.lastAnswerAt ? (Date.now() - stat.lastAnswerAt) / (1000 * 60 * 60) : 0
  const timeBoost = clamp(hoursSince / 24, 0, 2)
  return clamp(base + unknownBoost - knownPenalty + timeBoost, 0.2, 20)
}

const pickWeighted = <T,>(items: T[], weights: number[]) => {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

/* ========================================================= */
/* Component                                                 */
/* ========================================================= */

const Dictionary = () => {
  const [cards, setCards] = useState<Card[]>([])
  const [current, setCurrent] = useState<Card | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [direction, setDirection] = useState<Direction>(() => getStoredDirection())

  const [history, setHistory] = useState<HistoryState>(() => getInitialHistory())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleDirectionChange = (d: Direction) => {
    setDirection(d)
    saveDirection(d)
  }

  const revealTimerRef = useRef<number | null>(null)

  /* ------------------------------------------------------- */
  /* Helpers                                                 */
  /* ------------------------------------------------------- */

  const clearRevealTimer = () => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current)
      revealTimerRef.current = null
    }
  }

  const pickNext = () => {
    if (cards.length === 0) return null
    const weights = cards.map(c => getWeight(c, history.statsById[c.id]))
    return pickWeighted(cards, weights)
  }

  const startRevealTimer = () => {
    clearRevealTimer()
    revealTimerRef.current = window.setTimeout(() => {
      setShowTranslation(true)
    }, REVEAL_DELAY_MS)
  }

  /* ------------------------------------------------------- */
  /* Answer handling                                         */
  /* ------------------------------------------------------- */

  const applyAnswer = (answer: 'known' | 'unknown') => {
    if (!current) return

    // reveal immediately
    setShowTranslation(true)

    const prev = history.statsById[current.id] ?? {
      seen: 0,
      known: 0,
      unknown: 0,
    }

    const nextStat: Stat = {
      seen: prev.seen + 1,
      known: prev.known + (answer === 'known' ? 1 : 0),
      unknown: prev.unknown + (answer === 'unknown' ? 1 : 0),
      lastAnswerAt: Date.now(),
    }

    const nextHistory: HistoryState = {
      ...history,
      statsById: { ...history.statsById, [current.id]: nextStat },
      lastSessionAt: Date.now(),
      totalAnswers: history.totalAnswers + 1,
    }

    setHistory(nextHistory)
    saveHistory(nextHistory)

    // next card
    const next = pickNext()
    clearRevealTimer()
    setShowTranslation(false)
    setCurrent(next)

    if (next) startRevealTimer()
  }

  /* ------------------------------------------------------- */
  /* Initial load                                            */
  /* ------------------------------------------------------- */

  useEffect(() => {
    const load = async () => {
      try {
        const txt = await loadTxtFromPublic('slovicka.txt')
        const parsed = parseTxt(txt)
        setCards(parsed)

        const first = pickWeighted(
          parsed,
          parsed.map(c => getWeight(c))
        )
        setCurrent(first)
        setShowTranslation(false)
        startRevealTimer()
      } catch {
        setError('Nepodařilo se načíst slovicka.txt')
      } finally {
        setIsLoading(false)
      }
    }

    load()
    return clearRevealTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ------------------------------------------------------- */
  /* Stats                                                   */
  /* ------------------------------------------------------- */

  const stats = useMemo(() => {
    const all = Object.values(history.statsById)
    return {
      known: all.reduce((s, x) => s + x.known, 0),
      unknown: all.reduce((s, x) => s + x.unknown, 0),
    }
  }, [history])

  /* ------------------------------------------------------- */
  /* Render                                                  */
  /* ------------------------------------------------------- */

  if (isLoading) return <div style={styles.center}>Načítám…</div>
  if (error) return <div style={styles.center}>{error}</div>
  if (!current) return <div style={styles.center}>—</div>

  const question = direction === 'sv-cs' ? current.sv : current.cs
  const translation = direction === 'sv-cs' ? current.cs : current.sv

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.directionRow}>
          <button
            type='button'
            style={styles.directionBtn}
            onClick={() => handleDirectionChange(direction === 'sv-cs' ? 'cs-sv' : 'sv-cs')}
          >
            {direction === 'sv-cs' ? 'SV → CS' : 'CS → SV'}
          </button>
        </div>

        <div style={styles.word}>
          <div style={styles.sv}>{question}</div>
          {showTranslation && <div style={styles.cs}>{translation}</div>}
        </div>

        <div style={styles.buttons}>
          <button style={styles.button} onClick={() => applyAnswer('known')}>
            Vím
          </button>

          <button style={styles.button} onClick={() => applyAnswer('unknown')}>
            Nevím
          </button>
        </div>

        <div style={styles.stats}>
          <span>Vím: {stats.known}</span>
          <span>Nevím: {stats.unknown}</span>
        </div>
      </div>
    </div>
  )
}

/* ========================================================= */
/* Styles                                                   */
/* ========================================================= */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#dad2d2ff',
    boxSizing: 'border-box',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    // border: '1px solid #ddd',
    borderRadius: 16,
    padding: 20,
    textAlign: 'center',
    backgroundColor: '#dad2d2ff',
  },
  directionRow: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  directionBtn: {
    padding: '10px 20px',
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 12,
    border: '2px solid #888',
    backgroundColor: '#eee',
    cursor: 'pointer',
  },
  directionBtnActive: {
    backgroundColor: '#4a7c59',
    color: '#fff',
    borderColor: '#4a7c59',
  },
  center: {
    minHeight: '100dvh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 20,
  },
  word: {
    margin: '40px 0',
  },
  sv: {
    fontSize: 36,
    fontWeight: 800,
  },
  cs: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: 700,
    color: '#1a1a1a',
    opacity: 1,
  },
  buttons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16, // 👈 mezera mezi tlačítky
  },
  button: {
    minHeight: 88,
    fontSize: 28,
    gap: 30,
    fontWeight: 900,
    padding: '26px 20px',
    borderRadius: 22,
  },
  stats: {
    marginTop: 16,
    display: 'flex',
    justifyContent: 'space-around',
    fontSize: 20,
    fontWeight: 700,
    color: '#1a1a1a',
  },
}

export default Dictionary

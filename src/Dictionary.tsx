import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/* ========================================================= */
/* Types                                                     */
/* ========================================================= */

type Card = {
  id: string
  cs: string
  other: string
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

export type Direction = 'lang2-cs' | 'cs-lang2'

export type DictionaryLang = 'sv' | 'sv2' | 'en'

/* ========================================================= */
/* Constants & utils                                         */
/* ========================================================= */

const STORAGE_KEY = 'vocab-trainer:v1'
const DIRECTION_KEY = 'vocab-trainer:direction:v1'
const DICTIONARY_KEY = 'vocab-trainer:dictionary:v1'
const REVEAL_DELAY_MS = 3000

const DICTIONARY_FILES: Record<DictionaryLang, string> = {
  sv: 'vocabulary-sw.txt',
  sv2: 'vocabulary-sw2.txt',
  en: 'vocabulary-en.txt',
}

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
      const other = parts.slice(1).join('<>').trim()
      if (!cs || !other) return null
      return { id: `${i}-${cs}-${other}`, cs, other }
    })
    .filter(Boolean) as Card[]
}

const getStatKey = (dictionaryLang: DictionaryLang, cardId: string) => `${dictionaryLang}-${cardId}`

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
  return v === 'cs-lang2' ? 'cs-lang2' : 'lang2-cs'
}

const saveDirection = (d: Direction) => {
  localStorage.setItem(DIRECTION_KEY, d)
}

const getStoredDictionary = (): DictionaryLang => {
  const v = localStorage.getItem(DICTIONARY_KEY)
  if (v === 'en') return 'en'
  if (v === 'sv2') return 'sv2'
  return 'sv'
}

const saveDictionary = (d: DictionaryLang) => {
  localStorage.setItem(DICTIONARY_KEY, d)
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

const getCardsForDict = (
  dict: DictionaryLang,
  cardsSv: Card[],
  cardsSv2: Card[],
  cardsEn: Card[]
): Card[] => {
  if (dict === 'sv') return cardsSv
  if (dict === 'sv2') return cardsSv2
  return cardsEn
}

const Dictionary = () => {
  const [cardsSv, setCardsSv] = useState<Card[]>([])
  const [cardsSv2, setCardsSv2] = useState<Card[]>([])
  const [cardsEn, setCardsEn] = useState<Card[]>([])
  const [dictionaryLang, setDictionaryLang] = useState<DictionaryLang>(() => getStoredDictionary())
  const [current, setCurrent] = useState<Card | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [direction, setDirection] = useState<Direction>(() => getStoredDirection())

  const [history, setHistory] = useState<HistoryState>(() => getInitialHistory())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const revealTimerRef = useRef<number | null>(null)

  const currentCards = getCardsForDict(dictionaryLang, cardsSv, cardsSv2, cardsEn)
  const langLabel = dictionaryLang === 'en' ? 'EN' : 'SV'

  const handleDictionarySelect = useCallback(
    (dict: DictionaryLang) => {
      if (dict === dictionaryLang) {
        // Same dictionary: toggle direction (lang2→CS ↔ CS→lang2)
        const nextDir: Direction = direction === 'lang2-cs' ? 'cs-lang2' : 'lang2-cs'
        setDirection(nextDir)
        saveDirection(nextDir)
        return
      }
      setDictionaryLang(dict)
      saveDictionary(dict)
      setShowTranslation(false)
      const cards = getCardsForDict(dict, cardsSv, cardsSv2, cardsEn)
      if (cards.length > 0) {
        const weights = cards.map(c => getWeight(c, history.statsById[getStatKey(dict, c.id)]))
        const first = pickWeighted(cards, weights)
        setCurrent(first)
        if (revealTimerRef.current) {
          window.clearTimeout(revealTimerRef.current)
          revealTimerRef.current = null
        }
        revealTimerRef.current = window.setTimeout(() => setShowTranslation(true), REVEAL_DELAY_MS)
      } else {
        setCurrent(null)
      }
    },
    [dictionaryLang, direction, cardsSv, cardsSv2, cardsEn, history.statsById]
  )

  const clearRevealTimer = useCallback(() => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current)
      revealTimerRef.current = null
    }
  }, [])

  const pickNext = useCallback(() => {
    if (currentCards.length === 0) return null
    const weights = currentCards.map(c =>
      getWeight(c, history.statsById[getStatKey(dictionaryLang, c.id)])
    )
    return pickWeighted(currentCards, weights)
  }, [currentCards, dictionaryLang, history.statsById])

  const startRevealTimer = useCallback(() => {
    clearRevealTimer()
    revealTimerRef.current = window.setTimeout(() => {
      setShowTranslation(true)
    }, REVEAL_DELAY_MS)
  }, [clearRevealTimer])

  const applyAnswer = useCallback(
    (answer: 'known' | 'unknown') => {
      if (!current) return

      setShowTranslation(true)
      const statKey = getStatKey(dictionaryLang, current.id)
      const prev = history.statsById[statKey] ?? { seen: 0, known: 0, unknown: 0 }

      const nextStat: Stat = {
        seen: prev.seen + 1,
        known: prev.known + (answer === 'known' ? 1 : 0),
        unknown: prev.unknown + (answer === 'unknown' ? 1 : 0),
        lastAnswerAt: Date.now(),
      }

      const nextHistory: HistoryState = {
        ...history,
        statsById: { ...history.statsById, [statKey]: nextStat },
        lastSessionAt: Date.now(),
        totalAnswers: history.totalAnswers + 1,
      }

      setHistory(nextHistory)
      saveHistory(nextHistory)

      const next = pickNext()
      clearRevealTimer()
      setShowTranslation(false)
      setCurrent(next)

      if (next) startRevealTimer()
    },
    [current, dictionaryLang, history, pickNext, clearRevealTimer, startRevealTimer]
  )

  useEffect(() => {
    const load = async () => {
      try {
        const [txtSv, txtSv2, txtEn] = await Promise.all([
          loadTxtFromPublic(DICTIONARY_FILES.sv),
          loadTxtFromPublic(DICTIONARY_FILES.sv2),
          loadTxtFromPublic(DICTIONARY_FILES.en),
        ])
        const parsedSv = parseTxt(txtSv)
        const parsedSv2 = parseTxt(txtSv2)
        const parsedEn = parseTxt(txtEn)
        setCardsSv(parsedSv)
        setCardsSv2(parsedSv2)
        setCardsEn(parsedEn)

        const initialDict = getStoredDictionary()
        const initialCards = getCardsForDict(initialDict, parsedSv, parsedSv2, parsedEn)
        const first = pickWeighted(
          initialCards,
          initialCards.map(c => getWeight(c))
        )
        setCurrent(first)
        setShowTranslation(false)
        startRevealTimer()
      } catch {
        setError('Failed to load vocabulary files.')
      } finally {
        setIsLoading(false)
      }
    }

    load()
    return clearRevealTimer
  }, [startRevealTimer, clearRevealTimer])

  const stats = useMemo(() => {
    const prefix = `${dictionaryLang}-`
    const relevant = Object.entries(history.statsById)
      .filter(([k]) => k.startsWith(prefix))
      .map(([, v]) => v)
    return {
      known: relevant.reduce((s, x) => s + x.known, 0),
      unknown: relevant.reduce((s, x) => s + x.unknown, 0),
    }
  }, [dictionaryLang, history.statsById])

  if (isLoading) return <div style={styles.center}>Loading…</div>
  if (error) return <div style={styles.center}>{error}</div>
  if (!current) return <div style={styles.center}>—</div>

  const question = direction === 'lang2-cs' ? current.other : current.cs
  const translation = direction === 'lang2-cs' ? current.cs : current.other

  return (
    <div style={styles.page}>
      <div style={styles.card} className='vocab-card'>
        <div className='vocab-card-inner'>
          <div style={styles.topRow} className='vocab-top-row'>
            <button
              type='button'
              style={{
                ...styles.dictionaryBtn,
                ...(dictionaryLang === 'sv' ? styles.dictionaryBtnActive : {}),
              }}
              onClick={() => handleDictionarySelect('sv')}
              title={
                dictionaryLang === 'sv'
                  ? direction === 'lang2-cs'
                    ? 'SV → CS (click to switch to CS → SV)'
                    : 'CS → SV (click to switch to SV → CS)'
                  : 'Switch to Swedish (1) ↔ Czech'
              }
            >
              {dictionaryLang === 'sv'
                ? direction === 'lang2-cs'
                  ? 'SV → CS'
                  : 'CS → SV'
                : 'SW ↔ CZ'}
            </button>
            <button
              type='button'
              style={{
                ...styles.dictionaryBtn,
                ...(dictionaryLang === 'sv2' ? styles.dictionaryBtnActive : {}),
              }}
              onClick={() => handleDictionarySelect('sv2')}
              title={
                dictionaryLang === 'sv2'
                  ? direction === 'lang2-cs'
                    ? 'SV → CS (click to switch to CS → SV)'
                    : 'CS → SV (click to switch to SV → CS)'
                  : 'Switch to Swedish (2) ↔ Czech'
              }
            >
              {dictionaryLang === 'sv2'
                ? direction === 'lang2-cs'
                  ? 'SV → CS'
                  : 'CS → SV'
                : 'SW2 ↔ CZ'}
            </button>
            <button
              type='button'
              style={{
                ...styles.dictionaryBtn,
                ...(dictionaryLang === 'en' ? styles.dictionaryBtnActive : {}),
              }}
              onClick={() => handleDictionarySelect('en')}
              title={
                dictionaryLang === 'en'
                  ? direction === 'lang2-cs'
                    ? 'EN → CS (click to switch to CS → EN)'
                    : 'CS → EN (click to switch to EN → CS)'
                  : 'Switch to Czech ↔ English'
              }
            >
              {dictionaryLang === 'en'
                ? direction === 'lang2-cs'
                  ? 'EN → CS'
                  : 'CS → EN'
                : 'CZ ↔ EN'}
            </button>
          </div>

          <div className='vocab-landscape-spacer' aria-hidden='true' />
          <div className='vocab-main'>
            <div className='vocab-word-block'>
              <div style={styles.word}>
                <div style={styles.questionText}>{question}</div>
                {showTranslation && <div style={styles.translationText}>{translation}</div>}
              </div>
            </div>

            <div className='vocab-actions'>
              <div style={styles.buttons} className='vocab-main-buttons'>
                <button style={styles.button} onClick={() => applyAnswer('known')}>
                  Know
                </button>
                <button style={styles.button} onClick={() => applyAnswer('unknown')}>
                  Don&apos;t know
                </button>
              </div>
              <div style={styles.stats}>
                <span>Vet: {stats.known}</span>
                <span>Vette: {stats.unknown}</span>
              </div>
            </div>
          </div>
          <div className='vocab-landscape-spacer' aria-hidden='true' />
        </div>
      </div>
    </div>
  )
}

/* ========================================================= */
/* Styles                                                    */
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
    borderRadius: 16,
    padding: 20,
    textAlign: 'center',
    backgroundColor: '#dad2d2ff',
  },
  topRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  dictionaryBtn: {
    padding: '6px 12px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 10,
    border: '1px solid #888',
    backgroundColor: '#eee',
    cursor: 'pointer',
  },
  dictionaryBtnActive: {
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
    margin: '32px 0',
  },
  questionText: {
    fontSize: 48,
    fontWeight: 800,
  },
  translationText: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: 700,
    color: '#1a1a1a',
    opacity: 1,
  },
  buttons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    width: '100%',
    maxWidth: 420,
  },
  button: {
    minHeight: 72,
    fontSize: 22,
    fontWeight: 900,
    padding: '25px 24px',
    borderRadius: 40,
  },
  stats: {
    marginTop: 16,
    display: 'flex',
    justifyContent: 'center',
    gap: 100,
    fontSize: 20,
    fontWeight: 700,
    color: '#1a1a1a',
  },
}

export default Dictionary

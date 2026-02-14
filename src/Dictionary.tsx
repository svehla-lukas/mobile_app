import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/* ========================================================= */
/* Types                                                     */
/* ========================================================= */

type Card = {
  id: string
  cs: string
  other: string
}

export type Direction = 'lang2-cs' | 'cs-lang2'
export type DictionaryLang = 'sv' | 'sv2' | 'en'

type KochState = {
  kochIndexByDict: Record<DictionaryLang, number>
  recentAnswersByDict: Record<DictionaryLang, boolean[]>
}

/* ========================================================= */
/* Constants                                                 */
/* ========================================================= */

const STORAGE_KEY = 'vocab-trainer:koch:v2'
const DIRECTION_KEY = 'vocab-trainer:direction:v1'
const DICTIONARY_KEY = 'vocab-trainer:dictionary:v1'

const REVEAL_DELAY_MS = 2000
const KOCH_START_SIZE = 2
const KOCH_THRESHOLD = 0.85
const KOCH_WINDOW = 20

const DICTIONARY_FILES: Record<DictionaryLang, string> = {
  sv: 'vocabulary-sw.txt',
  sv2: 'vocabulary-sw2.txt',
  en: 'vocabulary-en.txt',
}

/* ========================================================= */
/* Utils                                                     */
/* ========================================================= */

const loadTxtFromPublic = async (path: string) => {
  const base = process.env.PUBLIC_URL || ''
  const res = await fetch(`${base}/${path}`)
  if (!res.ok) throw new Error(`Failed to load ${path}`)
  return res.text()
}

const parseTxt = (txt: string): Card[] =>
  txt
    .split(/\r?\n/g)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'))
    .map((line, i) => {
      const parts = line.split('<>')
      if (parts.length < 2) return null
      return {
        id: `${i}`,
        cs: parts[0].trim(),
        other: parts.slice(1).join('<>').trim(),
      }
    })
    .filter(Boolean) as Card[]

const getStoredDirection = (): Direction =>
  localStorage.getItem(DIRECTION_KEY) === 'cs-lang2'
    ? 'cs-lang2'
    : 'lang2-cs'

const getStoredDictionary = (): DictionaryLang => {
  const v = localStorage.getItem(DICTIONARY_KEY)
  if (v === 'en') return 'en'
  if (v === 'sv2') return 'sv2'
  return 'sv'
}

const loadKochState = (): KochState => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return {
      kochIndexByDict: { sv: 2, sv2: 2, en: 2 },
      recentAnswersByDict: { sv: [], sv2: [], en: [] },
    }
  }
  return JSON.parse(raw)
}

const saveKochState = (s: KochState) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))

/* ========================================================= */
/* Component                                                 */
/* ========================================================= */

const Dictionary = () => {
  const [cardsSv, setCardsSv] = useState<Card[]>([])
  const [cardsSv2, setCardsSv2] = useState<Card[]>([])
  const [cardsEn, setCardsEn] = useState<Card[]>([])

  const [dictionaryLang, setDictionaryLang] =
    useState<DictionaryLang>(() => getStoredDictionary())

  const [direction] =
    useState<Direction>(() => getStoredDirection())

  const [kochState, setKochState] =
    useState<KochState>(() => loadKochState())

  const [current, setCurrent] = useState<Card | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)

  const revealTimerRef = useRef<number | null>(null)

  /* ========================================================= */

  const currentCards =
    dictionaryLang === 'sv'
      ? cardsSv
      : dictionaryLang === 'sv2'
      ? cardsSv2
      : cardsEn

  const kochIndex =
    kochState.kochIndexByDict[dictionaryLang] ?? KOCH_START_SIZE

  const activeCards = useMemo(
    () => currentCards.slice(0, kochIndex),
    [currentCards, kochIndex]
  )

  const pickRandom = useCallback(() => {
    if (activeCards.length === 0) return null
    const i = Math.floor(Math.random() * activeCards.length)
    return activeCards[i]
  }, [activeCards])

  const startRevealTimer = useCallback(() => {
    if (revealTimerRef.current)
      window.clearTimeout(revealTimerRef.current)

    revealTimerRef.current = window.setTimeout(() => {
      setShowTranslation(true)
    }, REVEAL_DELAY_MS)
  }, [])

  const evaluateProgress = (answers: boolean[]) => {
    if (answers.length < KOCH_WINDOW) return false
    const recent = answers.slice(-KOCH_WINDOW)
    const success =
      recent.filter(a => a).length / KOCH_WINDOW
    return success >= KOCH_THRESHOLD
  }

  const applyAnswer = (known: boolean) => {
    if (!current) return

    const prevAnswers =
      kochState.recentAnswersByDict[dictionaryLang] ?? []

    const updatedAnswers = [...prevAnswers, known]

    let updatedKochIndex = kochIndex

    if (evaluateProgress(updatedAnswers)) {
      if (kochIndex < currentCards.length) {
        updatedKochIndex = kochIndex + 1
      }
    }

    const newState: KochState = {
      kochIndexByDict: {
        ...kochState.kochIndexByDict,
        [dictionaryLang]: updatedKochIndex,
      },
      recentAnswersByDict: {
        ...kochState.recentAnswersByDict,
        [dictionaryLang]: updatedAnswers.slice(-KOCH_WINDOW),
      },
    }

    setKochState(newState)
    saveKochState(newState)

    const next = pickRandom()
    setShowTranslation(false)
    setCurrent(next)
    startRevealTimer()
  }

  /* ========================================================= */
  /* Loading                                                  */
  /* ========================================================= */

  useEffect(() => {
    const load = async () => {
      const [sv, sv2, en] = await Promise.all([
        loadTxtFromPublic(DICTIONARY_FILES.sv),
        loadTxtFromPublic(DICTIONARY_FILES.sv2),
        loadTxtFromPublic(DICTIONARY_FILES.en),
      ])

      setCardsSv(parseTxt(sv))
      setCardsSv2(parseTxt(sv2))
      setCardsEn(parseTxt(en))
    }

    load()
  }, [])

  /* ========================================================= */
  /* Initial card selection (lint-safe)                       */
  /* ========================================================= */

  useEffect(() => {
    if (activeCards.length === 0) return

    const id = requestAnimationFrame(() => {
      const next = pickRandom()
      setCurrent(next)
      setShowTranslation(false)
      startRevealTimer()
    })

    return () => cancelAnimationFrame(id)
  }, [activeCards, pickRandom, startRevealTimer])

  /* ========================================================= */

  if (!current) return <div style={{ padding: 40 }}>Loading…</div>

  const question =
    direction === 'lang2-cs' ? current.other : current.cs

  const translation =
    direction === 'lang2-cs' ? current.cs : current.other

  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <h1>{question}</h1>

      {showTranslation && <h2>{translation}</h2>}

      <div style={{ marginTop: 30 }}>
        <button onClick={() => applyAnswer(true)}>
          Know
        </button>

        <button onClick={() => applyAnswer(false)}>
          Don’t know
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        Level: {kochIndex} / {currentCards.length}
      </div>
    </div>
  )
}

export default Dictionary
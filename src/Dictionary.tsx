import React, { useEffect, useMemo, useRef, useState } from 'react'

type Card = {
  id: string
  cs: string
  other: string
}

type DictionaryLang = 'sv' | 'sv2' | 'en'

type KochState = {
  kochIndexByDict: Record<DictionaryLang, number>
  recentAnswersByDict: Record<DictionaryLang, boolean[]>
}

const STORAGE_KEY = 'vocab-trainer:koch:v5'
const REVEAL_DELAY_MS = 2000
const KOCH_START_SIZE = 2
const KOCH_THRESHOLD = 0.85
const KOCH_WINDOW = 20

const DICTIONARY_FILES: Record<DictionaryLang, string> = {
  sv: 'vocabulary-sw.txt',
  sv2: 'vocabulary-sw2.txt',
  en: 'vocabulary-en.txt',
}

const loadTxtFromPublic = async (path: string): Promise<string> => {
  const base = process.env.PUBLIC_URL || ''
  const res = await fetch(`${base}/${path}`)
  if (!res.ok) throw new Error(`Failed to load ${path}`)
  return res.text()
}

const parseTxt = (txt: string): Card[] =>
  txt
    .split(/\r?\n/g)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'))
    .map((line, index) => {
      const parts = line.split('<>')
      if (parts.length < 2) return null
      return {
        id: String(index),
        cs: parts[0].trim(),
        other: parts.slice(1).join('<>').trim(),
      }
    })
    .filter((v): v is Card => v !== null)

const loadKochState = (): KochState => {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return {
      kochIndexByDict: { sv: 2, sv2: 2, en: 2 },
      recentAnswersByDict: { sv: [], sv2: [], en: [] },
    }
  }

  return JSON.parse(raw) as KochState
}

const saveKochState = (state: KochState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const Dictionary = (): JSX.Element => {
  const [cardsSv, setCardsSv] = useState<Card[]>([])
  const [cardsSv2, setCardsSv2] = useState<Card[]>([])
  const [cardsEn, setCardsEn] = useState<Card[]>([])

  const [kochState, setKochState] = useState<KochState>(() => loadKochState())

  const [current, setCurrent] = useState<Card | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)

  const revealTimerRef = useRef<number | null>(null)

  const dictionaryLang: DictionaryLang = 'sv'

  const currentCards =
    dictionaryLang === 'sv'
      ? cardsSv
      : dictionaryLang === 'sv2'
      ? cardsSv2
      : cardsEn

  const kochIndex =
    kochState.kochIndexByDict[dictionaryLang] ?? KOCH_START_SIZE

  const activeCards = useMemo(() => currentCards.slice(0, kochIndex), [
    currentCards,
    kochIndex,
  ])

  const evaluateProgress = (answers: boolean[]): boolean => {
    if (answers.length < KOCH_WINDOW) return false

    const recent = answers.slice(-KOCH_WINDOW)
    const successRate = recent.filter(a => a).length / KOCH_WINDOW

    return successRate >= KOCH_THRESHOLD
  }

  const pickRandomCard = (): Card | null => {
    if (activeCards.length === 0) return null
    const index = Math.floor(Math.random() * activeCards.length)
    return activeCards[index]
  }

  const applyAnswer = (known: boolean): void => {
    if (!current) return

    const previousAnswers =
      kochState.recentAnswersByDict[dictionaryLang] ?? []

    const updatedAnswers = [...previousAnswers, known]

    let updatedIndex = kochIndex

    if (evaluateProgress(updatedAnswers)) {
      if (kochIndex < currentCards.length) {
        updatedIndex = kochIndex + 1
      }
    }

    const newState: KochState = {
      kochIndexByDict: {
        ...kochState.kochIndexByDict,
        [dictionaryLang]: updatedIndex,
      },
      recentAnswersByDict: {
        ...kochState.recentAnswersByDict,
        [dictionaryLang]: updatedAnswers.slice(-KOCH_WINDOW),
      },
    }

    setKochState(newState)
    saveKochState(newState)

    const nextCard = pickRandomCard()

    setShowTranslation(false)
    setCurrent(nextCard)
  }

  useEffect(() => {
    const load = async (): Promise<void> => {
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

  useEffect(() => {
    if (activeCards.length === 0) return

    const id = requestAnimationFrame(() => {
      const nextCard = pickRandomCard()
      setCurrent(nextCard)
      setShowTranslation(false)
    })

    return () => cancelAnimationFrame(id)
  }, [activeCards])

  useEffect(() => {
    if (!current) return

    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current)
    }

    revealTimerRef.current = window.setTimeout(() => {
      setShowTranslation(true)
    }, REVEAL_DELAY_MS)

    return () => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current)
      }
    }
  }, [current])

  if (!current) return <div style={{ padding: 40 }}>Loading...</div>

  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <h1>{current.other}</h1>

      {showTranslation && <h2>{current.cs}</h2>}

      <div style={{ marginTop: 30 }}>
        <button type='button' onClick={() => applyAnswer(true)}>
          Know
        </button>

        <button type='button' onClick={() => applyAnswer(false)}>
          Don&apos;t know
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        Level: {kochIndex} / {currentCards.length}
      </div>
    </div>
  )
}

export default Dictionary
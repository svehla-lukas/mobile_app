import { useEffect, useMemo, useRef, useState } from 'react'

type Card = {
  id: string
  cs: string
  other: string
}

type DictionaryLang = 'sv' | 'sv2' | 'en'
type Direction = 'other-cs' | 'cs-other'

const DICTIONARY_FILES: Record<DictionaryLang, string> = {
  en: 'vocabulary-en.txt',
  sv: 'vocabulary-sw.txt',
  sv2: 'vocabulary-sw2.txt'
}

const KOCH_START = 4
const KOCH_WINDOW = 20
const KOCH_THRESHOLD = 0.85

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
        other: parts.slice(1).join('<>').trim()
      }
    })
    .filter((v): v is Card => v !== null)

const Dictionary = () => {
  const [answers, setAnswers] = useState<boolean[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [current, setCurrent] = useState<Card | null>(null)
  const [dictionary, setDictionary] = useState<DictionaryLang>('sv')
  const [direction, setDirection] = useState<Direction>('other-cs')
  const [intervalSec, setIntervalSec] = useState<number>(3)
  const [kochIndex, setKochIndex] = useState<number>(KOCH_START)
  const [showTranslation, setShowTranslation] = useState<boolean>(false)

  const intervalRef = useRef<number | null>(null)
  const revealRef = useRef<number | null>(null)

  const activeCards = useMemo(() => cards.slice(0, kochIndex), [cards, kochIndex])

  const pickRandom = (): Card | null => {
    if (activeCards.length === 0) return null
    const index = Math.floor(Math.random() * activeCards.length)
    return activeCards[index]
  }

  const evaluateProgress = (list: boolean[]): boolean => {
    if (list.length < KOCH_WINDOW) return false
    const recent = list.slice(-KOCH_WINDOW)
    const success = recent.filter(a => a).length / KOCH_WINDOW
    return success >= KOCH_THRESHOLD
  }

  const nextWord = (): void => {
    const next = pickRandom()
    setCurrent(next)
    setShowTranslation(false)

    if (revealRef.current !== null) {
      clearTimeout(revealRef.current)
    }

    revealRef.current = window.setTimeout(() => {
      setShowTranslation(true)
    }, (intervalSec * 1000) / 2)
  }

  const applyAnswer = (correct: boolean): void => {
    const updated = [...answers, correct].slice(-KOCH_WINDOW)

    if (evaluateProgress(updated)) {
      if (kochIndex < cards.length) {
        setKochIndex(prev => prev + 1)
        setAnswers([])
        nextWord()
        return
      }
    }

    setAnswers(updated)
    nextWord()
  }

  const switchDictionary = (next: DictionaryLang): void => {
    if (next === dictionary) {
      setDirection(prev => (prev === 'other-cs' ? 'cs-other' : 'other-cs'))
      return
    }

    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
    }

    if (revealRef.current !== null) {
      clearTimeout(revealRef.current)
    }

    setDictionary(next)
    setDirection('other-cs')
    setKochIndex(KOCH_START)
    setAnswers([])
    setCurrent(null)
    setShowTranslation(false)
  }

  useEffect(() => {
    const load = async (): Promise<void> => {
      const txt = await loadTxtFromPublic(DICTIONARY_FILES[dictionary])
      setCards(parseTxt(txt))
    }

    load()
  }, [dictionary])

  useEffect(() => {
    if (activeCards.length === 0) return

    const raf = requestAnimationFrame(() => {
      nextWord()
    })

    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = window.setInterval(() => {
      nextWord()
    }, intervalSec * 1000)

    return () => {
      cancelAnimationFrame(raf)

      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
      }

      if (revealRef.current !== null) {
        clearTimeout(revealRef.current)
      }
    }
  }, [activeCards, intervalSec])

  if (current === null) {
    return <div style={styles.loading}>Loading...</div>
  }

  const question = direction === 'other-cs' ? current.other : current.cs
  const translation = direction === 'other-cs' ? current.cs : current.other

  return (
    <div style={styles.container}>
      <div style={styles.wordBlock}>
        <div style={styles.word}>{question}</div>
        <div style={styles.translation}>
          {showTranslation ? translation : ''}
        </div>
      </div>

      <div style={styles.buttons}>
        <button type='button' style={styles.good} onClick={() => applyAnswer(true)}>
          I knew it
        </button>
        <button type='button' style={styles.bad} onClick={() => applyAnswer(false)}>
          Missed
        </button>
      </div>

      <div style={styles.sliderContainer}>
        <input
          type='range'
          min='1'
          max='4'
          step='0.5'
          value={intervalSec}
          onChange={e => setIntervalSec(Number(e.target.value))}
          style={styles.slider}
        />
        <div style={styles.label}>Speed: {intervalSec}s</div>
      </div>

      <div style={styles.dbButtons}>
        <button type='button' onClick={() => switchDictionary('sv')}>
          SV
        </button>
        <button type='button' onClick={() => switchDictionary('sv2')}>
          SV2
        </button>
        <button type='button' onClick={() => switchDictionary('en')}>
          EN
        </button>
      </div>

      <div style={styles.level}>
        Koch level: {kochIndex} / {cards.length}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  bad: {
    padding: '14px 20px',
    borderRadius: 30,
    border: 'none',
    backgroundColor: '#a33',
    color: '#fff'
  },
  buttons: {
    display: 'flex',
    gap: 12,
    marginBottom: 30
  },
  container: {
    minHeight: '100vh',
    backgroundColor: '#ffc0cb',
    color: '#000',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    textAlign: 'center'
  },
  dbButtons: {
    display: 'flex',
    gap: 8,
    marginTop: 20
  },
  good: {
    padding: '14px 20px',
    borderRadius: 30,
    border: 'none',
    backgroundColor: '#4a7c59',
    color: '#fff'
  },
  label: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.6
  },
  level: {
    marginTop: 20,
    fontSize: 14,
    opacity: 0.6
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  slider: {
    width: '100%'
  },
  sliderContainer: {
    width: '100%',
    maxWidth: 300
  },
  translation: {
    fontSize: 26,
    opacity: 0.7,
    marginTop: 12
  },
  word: {
    fontSize: 48,
    fontWeight: 800
  },
  wordBlock: {
    minHeight: 140,
    marginBottom: 30
  }
}

export default Dictionary

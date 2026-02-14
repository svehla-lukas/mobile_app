import React, { useEffect, useMemo, useRef, useState } from 'react'

type Card = {
  id: string
  cs: string
  other: string
}

type DictionaryLang = 'sv' | 'sv2' | 'en'
type Direction = 'other-cs' | 'cs-other'

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

const Dictionary = (): JSX.Element => {
  const [cards, setCards] = useState<Card[]>([])
  const [dictionary, setDictionary] = useState<DictionaryLang>('sv')
  const [direction, setDirection] = useState<Direction>('other-cs')
  const [intervalSec, setIntervalSec] = useState<number>(3)
  const [current, setCurrent] = useState<Card | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)

  const intervalRef = useRef<number | null>(null)
  const revealRef = useRef<number | null>(null)

  const pickRandom = (): Card | null => {
    if (cards.length === 0) return null
    const index = Math.floor(Math.random() * cards.length)
    return cards[index]
  }

  /* Load dictionary */
  useEffect(() => {
    const load = async (): Promise<void> => {
      const txt = await loadTxtFromPublic(DICTIONARY_FILES[dictionary])
      setCards(parseTxt(txt))
    }
    load()
  }, [dictionary])

  /* Word switching logic */
  useEffect(() => {
    if (cards.length === 0) return

    const changeWord = () => {
      const next = pickRandom()
      setCurrent(next)
      setShowTranslation(false)

      if (revealRef.current) clearTimeout(revealRef.current)

      revealRef.current = window.setTimeout(() => {
        setShowTranslation(true)
      }, (intervalSec * 1000) / 2)
    }

    changeWord()

    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = window.setInterval(
      changeWord,
      intervalSec * 1000
    )

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (revealRef.current) clearTimeout(revealRef.current)
    }
  }, [cards, intervalSec])

  const question =
    direction === 'other-cs' ? current?.other : current?.cs

  const translation =
    direction === 'other-cs' ? current?.cs : current?.other

  if (!current) {
    return <div style={styles.loading}>Loading...</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.wordBlock}>
        <div style={styles.word}>{question}</div>
        <div style={styles.translation}>
          {showTranslation ? translation : ''}
        </div>
      </div>

      <div style={styles.controls}>
        <button
          type='button'
          style={styles.button}
          onClick={() =>
            setDirection(
              direction === 'other-cs'
                ? 'cs-other'
                : 'other-cs'
            )
          }
        >
          Switch Direction
        </button>

        <button
          type='button'
          style={styles.button}
          onClick={() =>
            setDictionary(
              dictionary === 'sv'
                ? 'sv2'
                : dictionary === 'sv2'
                ? 'en'
                : 'sv'
            )
          }
        >
          Switch Database
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
        <div style={styles.sliderLabel}>
          Speed: {intervalSec}s
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#111',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    textAlign: 'center',
  },
  wordBlock: {
    minHeight: 140, // FIX HEIGHT = žádné poskakování
    marginBottom: 40,
  },
  word: {
    fontSize: 48,
    fontWeight: 800,
  },
  translation: {
    fontSize: 26,
    opacity: 0.7,
    marginTop: 12,
  },
  controls: {
    display: 'flex',
    gap: 12,
    marginBottom: 30,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  button: {
    padding: '12px 20px',
    borderRadius: 30,
    border: 'none',
    backgroundColor: '#4a7c59',
    color: '#fff',
    fontSize: 14,
  },
  sliderContainer: {
    width: '100%',
    maxWidth: 300,
  },
  slider: {
    width: '100%',
  },
  sliderLabel: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.6,
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
}

export default Dictionary
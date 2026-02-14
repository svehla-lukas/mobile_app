import React, { useEffect, useMemo, useRef, useState } from 'react'

type Card = {
  id: string
  cs: string
  other: string
}

const DICTIONARY_FILE = 'vocabulary-sw.txt'
const CHANGE_INTERVAL_MS = 3000

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
  const [activeCount, setActiveCount] = useState<number>(2)
  const [current, setCurrent] = useState<Card | null>(null)
  const intervalRef = useRef<number | null>(null)

  const activeCards = useMemo(
    () => cards.slice(0, activeCount),
    [cards, activeCount]
  )

  const pickRandom = (): Card | null => {
    if (activeCards.length === 0) return null
    const index = Math.floor(Math.random() * activeCards.length)
    return activeCards[index]
  }

  useEffect(() => {
    const load = async (): Promise<void> => {
      const txt = await loadTxtFromPublic(DICTIONARY_FILE)
      setCards(parseTxt(txt))
    }

    load()
  }, [])

  useEffect(() => {
    if (activeCards.length === 0) return

    const changeWord = () => {
      const next = pickRandom()
      setCurrent(next)
    }

    changeWord()

    intervalRef.current = window.setInterval(changeWord, CHANGE_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [activeCards])

  const addWord = (): void => {
    if (activeCount < cards.length) {
      setActiveCount(activeCount + 1)
    }
  }

  if (!current) {
    return <div style={styles.loading}>Loading...</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.word}>{current.other}</div>
        <div style={styles.translation}>{current.cs}</div>
      </div>

      <button type='button' style={styles.addButton} onClick={addWord}>
        + Add word
      </button>

      <div style={styles.counter}>
        Active words: {activeCount}
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
  card: {
    marginBottom: 40,
  },
  word: {
    fontSize: 48,
    fontWeight: 800,
    marginBottom: 16,
  },
  translation: {
    fontSize: 28,
    opacity: 0.8,
  },
  addButton: {
    fontSize: 20,
    padding: '16px 32px',
    borderRadius: 40,
    border: 'none',
    backgroundColor: '#4a7c59',
    color: '#fff',
    marginBottom: 20,
  },
  counter: {
    fontSize: 16,
    opacity: 0.6,
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 20,
  },
}

export default Dictionary
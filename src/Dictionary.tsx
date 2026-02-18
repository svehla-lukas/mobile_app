import { useEffect, useRef, useState } from 'react'

type Pair = {
  left: string
  right: string
}

const STEP_TIME = 1000

const KochIphoneLandscape = () => {
  const [instruction, setInstruction] = useState(
    'New words learning based on Koch method.'
  )
  const [permanentSet, setPermanentSet] = useState<Pair[]>([])
  const [activeSet, setActiveSet] = useState<Pair[]>([])
  const [currentPair, setCurrentPair] = useState<Pair | null>(null)

  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  const [reverse, setReverse] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)

  const previousIndex = useRef<number | null>(null)
  const cycleTimeout = useRef<number | null>(null)

  const delay = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms))

  const shuffle = (arr: Pair[]): Pair[] => {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  const loadWords = async () => {
    try {
      const res = await fetch('sv.txt')
      if (!res.ok) throw new Error()

      const text = await res.text()

      const parsed = text
        .split(/\r?\n/g)
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .map(line => {
          const parts = line.split('<>')
          if (parts.length < 2) return null
          return {
            left: parts[0].trim(),
            right: parts[1].trim()
          }
        })
        .filter((p): p is Pair => p !== null)

      if (parsed.length < 20) throw new Error()

      const selected = shuffle(parsed).slice(0, 20)
      setPermanentSet(selected)

      setInstruction('20 words from file sv.txt uploaded.')
      await delay(1000)
      setInstruction('Press button to start learning.')
      setReady(true)
    } catch {
      setInstruction('Words not uploaded correctly.')
      setError(true)
    }
  }

  const pickRandomPair = (): Pair | null => {
    if (activeSet.length === 0) return null

    let index = Math.floor(Math.random() * activeSet.length)

    if (previousIndex.current !== null && activeSet.length > 1) {
      while (index === previousIndex.current) {
        index = Math.floor(Math.random() * activeSet.length)
      }
    }

    previousIndex.current = index
    return activeSet[index]
  }

  const clearCycle = () => {
    if (cycleTimeout.current !== null) {
      clearTimeout(cycleTimeout.current)
      cycleTimeout.current = null
    }
  }

  const runCycle = () => {
    clearCycle()

    const pair = pickRandomPair()
    if (!pair) return

    setCurrentPair(pair)
    setShowLeft(false)
    setShowRight(false)

    if (!reverse) {
      // Levé → pravé
      setShowLeft(true)

      setTimeout(() => {
        setShowRight(true)
      }, STEP_TIME)
    } else {
      // Pravé → levé
      setShowRight(true)

      setTimeout(() => {
        setShowLeft(true)
      }, STEP_TIME)
    }

    setTimeout(() => {
      setShowLeft(false)
      setShowRight(false)
      setCurrentPair(null)
    }, STEP_TIME * 2)

useEffect(() => {
  if (activeSet.length < 4) return

  const interval = setInterval(() => {
    runCycle()
  }, STEP_TIME * 2.5)

  return () => clearInterval(interval)
}, [activeSet, reverse])
  }

  const handleMore = () => {
    if (!ready || error) return

    if (activeSet.length === 0) {
      const first = shuffle(permanentSet).slice(0, 4)
      setActiveSet(first)
      setInstruction('Learn 4 words from cells.')
      return
    }

    if (activeSet.length >= 20) {
      setInstruction('All 20 workds upladed, no more extension.')
      return
    }

    const remaining = permanentSet.filter(p => !activeSet.includes(p))
    if (remaining.length === 0) return

    const next = remaining[Math.floor(Math.random() * remaining.length)]
    const updated = [...activeSet, next]
    setActiveSet(updated)

    if (updated.length === 20) {
      setInstruction('All 20 workds upladed, no more extension.')
    } else {
      setInstruction(`Learn ${updated.length} words from cells.`)
    }
  }

  useEffect(() => {
    if (activeSet.length === 4) {
      runCycle()
    }
  }, [activeSet])

  useEffect(() => {
    if (activeSet.length >= 4) {
      runCycle()
    }
  }, [reverse]) // 🔥 klíčová oprava

  useEffect(() => {
    const init = async () => {
      await delay(1000)
      await loadWords()
    }

    init()

    return () => clearCycle()
  }, [])

  const toggleDirection = () => {
    setReverse(prev => !prev)
  }

  return (
    <div style={styles.outer}>
      <div style={styles.app}>
        <div style={styles.instruction}>{instruction}</div>

        <div style={styles.cells}>
          <div style={styles.cell}>
            {showLeft && currentPair ? currentPair.left : ''}
          </div>
          <div style={styles.cell}>
            {showRight && currentPair ? currentPair.right : ''}
          </div>
        </div>

        <button
          type='button'
          style={styles.button}
          onClick={handleMore}
        >
          More words
        </button>

        <button
          type='button'
          style={styles.switchButton}
          onClick={toggleDirection}
        >
          {reverse ? '<' : '>'}
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  outer: {
    width: '97vw',
    height: '97vh',
    backgroundColor: '#ffc0cb',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  app: {
    width: '95%',
    height: '95%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 20
  },
  instruction: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center'
  },
  cells: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '45%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cell: {
    flex: 1,
    height: '80%',
    margin: 10,
    backgroundColor: '#fff',
    border: '2px solid black',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 700,
    color: '#000'
  },
  button: {
    alignSelf: 'center',
    aspectRatio: '3 / 1',
    padding: '0 24px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    fontSize: 18
  },
  switchButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 40,
    height: 40,
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 18
  }
}

export default KochIphoneLandscape

import { useEffect, useRef, useState } from 'react'

type Pair = {
  left: string
  right: string
}

const STEP_TIME = 1000

const KochLandscapeTrainer = () => {
  const [instruction, setInstruction] = useState(
    'New words learning based on Koch method.'
  )
  const [allPairs, setAllPairs] = useState<Pair[]>([])
  const [activePairs, setActivePairs] = useState<Pair[]>([])
  const [current, setCurrent] = useState<Pair | null>(null)
  const [showRight, setShowRight] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)

  const previousIndex = useRef<number | null>(null)
  const loopTimeout = useRef<number | null>(null)

  const delay = (ms: number) =>
    new Promise(resolve => {
      setTimeout(resolve, ms)
    })

  const shuffle = (arr: Pair[]): Pair[] => {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = copy[i]
      copy[i] = copy[j]
      copy[j] = tmp
    }
    return copy
  }

  const loadWords = async () => {
    try {
      const res = await fetch('./public/sv.txt')
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

      if (parsed.length < 20) {
        throw new Error()
      }

      const selected = shuffle(parsed).slice(0, 20)
      setAllPairs(selected)

      setInstruction('20 words from file sv.txt uploaded.')
      await delay(1000)
      setInstruction('Press button to start learning.')
      setReady(true)
    } catch {
      setInstruction('Words not uploaded correctly.')
      setError(true)
    }
  }

  const pickRandom = (): Pair | null => {
    if (activePairs.length === 0) return null

    let index = Math.floor(Math.random() * activePairs.length)

    if (previousIndex.current !== null && activePairs.length > 1) {
      while (index === previousIndex.current) {
        index = Math.floor(Math.random() * activePairs.length)
      }
    }

    previousIndex.current = index
    return activePairs[index]
  }

  const showLoop = () => {
    const pair = pickRandom()
    if (!pair) return

    setCurrent(pair)
    setShowRight(false)

    setTimeout(() => {
      setShowRight(true)
    }, STEP_TIME)

    setTimeout(() => {
      setCurrent(null)
    }, STEP_TIME * 2)

    loopTimeout.current = window.setTimeout(() => {
      showLoop()
    }, STEP_TIME * 2.5)
  }

  const handleMore = () => {
    if (!ready || error) return

    if (activePairs.length === 0) {
      const first = shuffle(allPairs).slice(0, 4)
      setActivePairs(first)
      setInstruction('Learn 4 words from cells.')
      showLoop()
      return
    }

    if (activePairs.length >= 20) {
      setInstruction('All 20 workds upladed, no more extension.')
      return
    }

    const remaining = allPairs.filter(p => !activePairs.includes(p))
    if (remaining.length === 0) return

    const next = remaining[Math.floor(Math.random() * remaining.length)]
    const updated = [...activePairs, next]
    setActivePairs(updated)

    if (updated.length === 20) {
      setInstruction('All 20 workds upladed, no more extension.')
    } else {
      setInstruction(`Learn ${updated.length} words from cells.`)
    }
  }

  useEffect(() => {
    const init = async () => {
      await delay(1000)
      await loadWords()
    }

    init()

    return () => {
      if (loopTimeout.current !== null) {
        clearTimeout(loopTimeout.current)
      }
    }
  }, [])

  return (
    <div style={styles.container}>
      <div style={styles.instruction}>{instruction}</div>

      <div style={styles.center}>
        <div style={styles.cell}>
          {current?.left ?? ''}
        </div>
        <div style={styles.cell}>
          {showRight ? current?.right ?? '' : ''}
        </div>
      </div>

      <button
        type='button'
        style={styles.button}
        onClick={handleMore}
      >
        More words
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  button: {
    alignSelf: 'center',
    aspectRatio: '3 / 1',
    padding: '0 24px',
    fontSize: 20,
    borderRadius: 16,
    border: '2px solid black',
    backgroundColor: '#ffffff',
    color: '#000000'
  },
  cell: {
    flex: 1,
    margin: 10,
    backgroundColor: '#ffffff',
    border: '2px solid black',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 600,
    color: '#000'
  },
  center: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  container: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#ffc0cb',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 20
  },
  instruction: {
    textAlign: 'center',
    fontSize: 14,
    color: '#000'
  }
}

export default KochLandscapeTrainer

import { useEffect, useRef, useState } from 'react'

type Pair = {
  left: string
  right: string
}

const STEP_TIME = 1000

const KochTrainer = () => {
  const [instruction, setInstruction] = useState<string>(
    'New words learning based on Koch method.'
  )
  const [allPairs, setAllPairs] = useState<Pair[]>([])
  const [activePairs, setActivePairs] = useState<Pair[]>([])
  const [currentPair, setCurrentPair] = useState<Pair | null>(null)
  const [showRight, setShowRight] = useState<boolean>(false)
  const [started, setStarted] = useState<boolean>(false)
  const [allLoaded, setAllLoaded] = useState<boolean>(false)

  const previousIndex = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  const delay = (ms: number) =>
    new Promise(resolve => {
      setTimeout(resolve, ms)
    })

  const loadFile = async () => {
    const res = await fetch('/sv.txt')
    const txt = await res.text()

    const pairs = txt
      .split(/\r?\n/g)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const parts = line.split('<>')
        return {
          left: parts[0]?.trim() ?? '',
          right: parts[1]?.trim() ?? ''
        }
      })
      .slice(0, 20)

    setAllPairs(shuffle(pairs).slice(0, 20))

    setInstruction('20 words from file sv.txt uploaded.')
    await delay(1000)
    setInstruction('Press button to start learning.')
  }

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

  const pickRandomPair = (): Pair | null => {
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

  const startLoop = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
    }

    timerRef.current = window.setInterval(() => {
      const pair = pickRandomPair()
      if (!pair) return

      setCurrentPair(pair)
      setShowRight(false)

      setTimeout(() => {
        setShowRight(true)
      }, STEP_TIME)

      setTimeout(() => {
        setCurrentPair(null)
      }, STEP_TIME * 2)
    }, STEP_TIME * 2.5)
  }

  const handleMore = () => {
    if (!started) {
      const first = shuffle(allPairs).slice(0, 4)
      setActivePairs(first)
      setStarted(true)
      setInstruction('Learn 4 words from cells.')
      startLoop()
      return
    }

    if (activePairs.length >= 20) {
      setInstruction('All 20 workds upladed, no more extension.')
      setAllLoaded(true)
      return
    }

    const remaining = allPairs.filter(
      p => !activePairs.includes(p)
    )

    if (remaining.length === 0) return

    const next = remaining[Math.floor(Math.random() * remaining.length)]
    const updated = [...activePairs, next]
    setActivePairs(updated)
    setInstruction(`Learn ${updated.length} words from cells.`)

    if (updated.length === 20) {
      setInstruction('All 20 workds upladed, no more extension.')
      setAllLoaded(true)
    }
  }

  useEffect(() => {
    const init = async () => {
      await delay(1000)
      await loadFile()
    }

    init()

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return (
    <div style={styles.container}>
      <div style={styles.instruction}>{instruction}</div>

      <div style={styles.cells}>
        <div style={styles.cell}>
          {currentPair?.left ?? ''}
        </div>
        <div style={styles.cell}>
          {showRight ? currentPair?.right ?? '' : ''}
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
    fontSize: 20,
    padding: '14px 30px',
    borderRadius: 20,
    border: 'none',
    backgroundColor: '#000',
    color: '#fff'
  },
  cell: {
    flex: 1,
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 600,
    color: '#000'
  },
  cells: {
    display: 'flex',
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    height: '100vh',
    width: '100vw',
    backgroundColor: '#ffc0cb',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 20
  },
  instruction: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center'
  }
}

export default KochTrainer

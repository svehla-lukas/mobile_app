import { useEffect, useState } from 'react'

type GameState = 'idle' | 'waiting' | 'ready' | 'result'

const App = () => {
  const [state, setState] = useState<GameState>('idle')
  const [startTime, setStartTime] = useState<number>(0)
  const [reactionTime, setReactionTime] = useState<number | null>(null)

  useEffect(() => {
    if (state !== 'waiting') return

    const delay = Math.random() * 3000 + 1000 // 1–4s
    const timer = setTimeout(() => {
      setStartTime(Date.now())
      setState('ready')
    }, delay)

    return () => clearTimeout(timer)
  }, [state])

  const handleTap = () => {
    if (state === 'ready') {
      const time = Date.now() - startTime
      setReactionTime(time)
      setState('result')
      navigator.vibrate?.(50)
    }

    if (state === 'idle' || state === 'result') {
      setReactionTime(null)
      setState('waiting')
    }

    if (state === 'waiting') {
      // tap too early
      setReactionTime(null)
      setState('idle')
    }
  }

  const getBackgroundColor = () => {
    switch (state) {
      case 'waiting':
        return '#d32f2f' // red
      case 'ready':
        return '#2e7d32' // green
      case 'result':
        return '#1976d2' // blue
      default:
        return '#424242' // dark
    }
  }

  const getText = () => {
    switch (state) {
      case 'idle':
        return 'Tap to start'
      case 'waiting':
        return 'Wait for green…'
      case 'ready':
        return 'TAP!'
      case 'result':
        return `Reaction time: ${reactionTime} ms\nTap to try again`
    }
  }

  return (
    <div
      onClick={handleTap}
      style={{
        backgroundColor: getBackgroundColor(),
        color: 'white',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        textAlign: 'center',
        userSelect: 'none',
        touchAction: 'manipulation',
      }}
    >
      {getText()}
    </div>
  )
}

export default App

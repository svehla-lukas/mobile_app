import './index.css'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'
import Dictionary from './Dictionary'
import DictionaryPeter from './DictionaryPeter'
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import reportWebVitals from './reportWebVitals'

serviceWorkerRegistration.register()

const App = (): JSX.Element => {
  const [mode, setMode] = useState<'main' | 'peter'>('main')

  return (
    <>
      <div style={{ position: 'fixed', top: 10, right: 10 }}>
        <button onClick={() => setMode('main')}>Main</button>
        <button onClick={() => setMode('peter')}>Peter</button>
      </div>

      {mode === 'main' ? <Dictionary /> : <DictionaryPeter />}
    </>
  )
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

root.render(<App />)

reportWebVitals()
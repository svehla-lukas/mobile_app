import './index.css'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'
import Dictionary from './Dictionary'
import DictionaryPeter from './DictionaryPeter'
import React from 'react'
import ReactDOM from 'react-dom/client'
import reportWebVitals from './reportWebVitals'

serviceWorkerRegistration.register()

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

root.render(
  <>
    <Dictionary />
    <DictionaryPeter />
  </>
)

reportWebVitals()
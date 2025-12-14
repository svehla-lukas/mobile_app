import './index.css'
// import { App2 } from './App2'
// import App from './App'
import { App3 } from './App3'
import React from 'react'
import ReactDOM from 'react-dom/client'
import reportWebVitals from './reportWebVitals'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  // <React.StrictMode>
  // <App />
  // <App2 />
  <>
    <App3 />
    {/* <App3 />
    <App3 /> */}
  </>
  // </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()

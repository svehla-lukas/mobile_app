import React, { useEffect, useRef, useState } from 'react'

// 1. prevState
// 2. useEffect
// 3. useRef vs useState

// const useRawComponentDidMount = (fn: Parameters<typeof useEffect>[0]) => {
//   useEffect(fn, [])
// }

// const useComponentDidMount = (fn: () => void) => {
//   useEffect(() => {
//     fn()
//   }, [])
// }

export const App3 = () => {
  const [data, setData] = useState([] as { id: string; name: string }[])
  return (
    <div>
      <button
        onClick={async () => {
          const response = await fetch('http://localhost:1234')
          console.log(response)
          setData(await response.json())
        }}
      >
        do http request
      </button>

      {data.map(i => (
        <div key={i.id}>{i.name}</div>
      ))}
    </div>
  )
}

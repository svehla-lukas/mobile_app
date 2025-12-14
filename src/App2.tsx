import { css } from '@emotion/css'
import { useContext, useEffect, useState } from 'react'
import React from 'react'

export const xA = 3

// const KubaContext = React.createContext<ReturnType<typeof useValue>>(null as any)
//
//
//
//
//
//
//
//

// const delay = (ms: number) =>
//   new Promise(resolve => {
//     setTimeout(() => resolve(undefined), ms)
//   })

// const main = async () => {
//   console.log(1)
//   await delay(1000)
//   console.log(2)
// }

// var prom1 = new Promise(resolve => {
//   setTimeout(() => resolve(1), 1_000)
// })
//   .then(val => {
//     console.log('výsledek první funkce je: ', val)
//     return new Promise(resolve => setTimeout(() => resolve(val + 1), 1_000))
//   })
//   .then(val => {
//     console.log('výsledek druhé funkce je: ', val)
//     return new Promise(resolve => setTimeout(() => resolve(val + 1), 1_000))
//   })
//   .then(val => {
//     console.log('výsledek treti funkce je: ', val)
//     return new Promise(resolve => setTimeout(() => resolve(val + 1), 1_000))
//   })
//   .then(val => {
//     console.log('výsledek ctvrte funkce je: ', val)
//     return new Promise(resolve => setTimeout(() => resolve(val + 1), 1_000))
//   })

// //
// //
// //
// //
// //
// //
// //
// //
// //
// //
// //
// //
// //
// //
// //
// //
// //
// //

// // enter
// // f1
// // f3
// // alt

// const handle = (e: any) => {
//   if (e.enter === true) {
//   } else if (e.alt === true) {
//   } else if (e.key === '4') {
//   } else if (e.key === '5') {
//   }
// }

// //
// //
// //
// //
// //
// //
// //
// //
// //
// //
// //
// //
// //
// //
// //
// //
// //
// //
// //

// // POJO = plain object javascript object
// const theme = {
//   color: {
//     primary: 'blue',
//   },
// }

// const inlineStyle: React.CSSProperties = {
//   background: 'green',
//   color: 'grey',
// }
// const useValue = () => {
//   const [counter, setCounter] = useState(0)
//   // business logic

//   return {
//     counter,
//     setCounter,
//     shot: () => () => (a: number) => () => (b: number) => a + b,
//   }
// }
// // ---
// export const App2 = () => {
//   const data = useValue()
//   return (
//     <KubaContext.Provider value={data}>
//       <div
//         className={css({
//           background: 'green',
//           color: theme.color.primary,
//           padding: '1rem',
//         })}
//       >
//         <h1>app 2</h1>

//         <Button text='select all' />

//         <input />
//         <Button text='de-select all' />

//         <Button text='refresh' />

//         <h1>ahoj</h1>
//       </div>
//     </KubaContext.Provider>
//   )
// }

// const Button = React.memo((props: { text: string } & React.ComponentProps<'button'>) => {
//   const [counter, setCounter] = useState(0)

//   console.log('middle layer button')
//   return (
//     <>
//       <button
//         style={{ background: 'red', color: 'white' }}
//         onClick={e => {
//           // button.filter
//           setCounter(counter + 1)
//         }}
//         {...props}
//       >
//         {counter}
//       </button>
//       <XXX />
//     </>
//   )
// })

// const XXX = () => {
//   const data = useContext(KubaContext)

//   data.shot
//   console.log('XXX')

//   return <button onClick={() => data.setCounter(data.counter + 1)}>{data.counter}</button>
// }

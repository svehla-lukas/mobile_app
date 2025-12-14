import './App.css'
import { css } from '@emotion/css'
import React, { ComponentProps, useState } from 'react'
import logo from './logo.svg'
import logo192 from './logo192.png'

const theme = {
  mediaQuery: {
    tablet: 520,
    desktop: 960,
  },
  color: {
    main: 'red',
    secondary: 'blue',
    dark: 'black',
  },
  font: {
    xs: '1rem',
    sm: '1.5rem',
    md: '2rem',
    lg: '4rem',
    xl: '6rem',
  },
  spacing: {
    xs: '1rem',
    sm: '1.5rem',
    md: '2rem',
    lg: '4rem',
    xl: '6rem',
  },
} as const

const CustomButton = (props: ComponentProps<'button'>) => (
  <button
    {...props}
    onClick={e => {
      console.log('ahojooooj')
      props.onClick?.(e)
    }}
    className={css`
      padding: 32px;
      font-size: 24px;
      border-radius: 4px;
      ${props.className ?? ''}
    `}
  >
    {props.children}
  </button>
)

// deploy na custom domain
// forms
// useEffect

type Car = {
  id: string
  name: string
  price: number
}

const getCarsFromLocalStorage = (): Car[] => {
  const lsCars = localStorage.getItem(lsId.cars)

  if (lsCars) {
    return JSON.parse(lsCars)
  }
  return []
}

const lsId = {
  cars: 'cars:list',
}
const users = [
  {
    id: 'xx',
    age: 10,
    name: 'kk',
  },
  {
    id: 'x',
    age: 10,
    name: '1_000',
  },
  {
    id: 'x',
    age: 10,
    name: 'kuba',
  },
]

const getName = (user: typeof users[number]) => user.name

const asdf = getName(users[0]).length

getName(users[0])

const aaaa = [2, 3, 4]

const bbbb = aaaa.map(i => i ** 2)

// CRUD
// create, read, update, delete
// CR!!

const Counter = () => {
  const [numInput, setNumInput] = useState(0 as number | null)

  const [cars, _setCars] = useState(getCarsFromLocalStorage())
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')

  const setCars = (cars: Car[]) => {
    localStorage.setItem(lsId.cars, JSON.stringify(cars))
    _setCars(cars)
  }

  return (
    <div>
      <h1>Bazoš aut</h1>

      <hr />

      <form
        onSubmit={e => {
          e.preventDefault()
          setCars([
            {
              id: Math.random().toString(),
              name,
              price: Number(price),
            },
            ...cars,
          ])
          setName('')
          setPrice('')
        }}
      >
        <div>
          <label>
            název inzerátu
            <input type='text' value={name} onChange={e => setName(e.target.value)} />
          </label>
        </div>
        <div>
          <label>
            Cena
            <input type='number' value={price} onChange={e => setPrice(e.target.value)} />
          </label>
        </div>
        <button type='submit'>Vytvořit inzerát</button>
      </form>

      <hr />

      {/* 
      <button
        style={{ background: 'red', color: 'white' }}
        onClick={() => {
          setCars([cars[2], cars[1], cars[0], cars[3]])
        }}
      >
        změň pořadí
      </button> */}

      <hr />
      {cars.map((car, index) => (
        <Car key={car.id} car={car} />
      ))}
      <pre>{JSON.stringify(cars, null, 2)}</pre>
    </div>
  )
}

const Car = (props: { car: Car }) => {
  const [counter, setCounter] = useState(0)

  return (
    <div>
      <hr />
      <h1>{props.car.name}</h1>
      <div>{props.car.price + counter} Kč</div>
      <button onClick={() => setCounter(counter + 1337)}>+</button>
      <hr />
    </div>
  )
}

export default () => {
  return (
    <>
      <Counter />
    </>
  )
}

import { render, screen } from '@testing-library/react'
import React from 'react'
import Tap_game from './Tap_game'

test('renders learn react link', () => {
  render(<Tap_game />)
  const linkElement = screen.getByText(/learn react/i)
  expect(linkElement).toBeInTheDocument()
})

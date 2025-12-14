import { render, screen } from '@testing-library/react'
import Tap_game from './Tap_game'
import React from 'react'

test('renders learn react link', () => {
  render(<Tap_game />)
  const linkElement = screen.getByText(/learn react/i)
  expect(linkElement).toBeInTheDocument()
})

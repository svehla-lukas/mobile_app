import { render, screen } from '@testing-library/react'
import React from 'react'
import Dictionary from './Dictionary'

test('renders learn react link', () => {
  render(<Dictionary />)
  const linkElement = screen.getByText(/learn react/i)
  expect(linkElement).toBeInTheDocument()
})
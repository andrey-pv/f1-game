import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CountdownTimer from '../components/CountdownTimer'

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('renders countdown for future date', () => {
    const future = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
    render(<CountdownTimer targetDate={future.toISOString()} />)
    expect(screen.getByText(/hrs|min|sec/i)).toBeTruthy()
  })

  it('shows expired message for past date', () => {
    const past = new Date(Date.now() - 1000)
    render(<CountdownTimer targetDate={past.toISOString()} />)
    expect(screen.getByText(/started/i)).toBeTruthy()
  })
})

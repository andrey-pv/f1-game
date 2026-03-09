import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Firebase
vi.mock('../firebase', () => ({
  auth: { currentUser: null },
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
  onAuthStateChanged: vi.fn((auth, cb) => { cb(null); return () => {} }),
}))

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock react-hot-toast
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
}

vi.mock('react-hot-toast', () => ({
  default: mockToast
}))

// Mock ErrorBoundary
vi.mock('../../components/ui/ErrorBoundary', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn()
  })
}))

const { useAsyncOperation } = await import('../useAsyncOperation')

describe('useAsyncOperation Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes operation successfully', async () => {
    const mockOperation = vi.fn().mockResolvedValue('success result')
    const mockOnSuccess = vi.fn()

    const { result } = renderHook(() => 
      useAsyncOperation({ onSuccess: mockOnSuccess })
    )

    let operationResult
    await act(async () => {
      operationResult = await result.current.execute(mockOperation)
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBe('success result')
    expect(result.current.error).toBe(null)
    expect(operationResult).toBe('success result')
    expect(mockOnSuccess).toHaveBeenCalledWith('success result')
  })

  it('resets state correctly', async () => {
    const { result } = renderHook(() => useAsyncOperation())

    await act(async () => {
      await result.current.execute(() => Promise.resolve('test data'))
    })

    expect(result.current.data).toBe('test data')

    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toBe(null)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })
})
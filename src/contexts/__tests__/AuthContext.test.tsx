import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock Supabase auth
const mockAuth = {
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(),
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  signInWithOtp: jest.fn(),
};

jest.mock('../../lib/supabase', () => ({
  auth: mockAuth
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    });
  });

  it('initializes with no user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.user).toBe(null);
    expect(result.current.loading).toBe(false);
  });

  it('sets user when session exists', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { name: 'Test User' },
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    };

    mockAuth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.user).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      avatar_url: undefined,
      voice_preference: undefined,
      learning_preferences: undefined,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    });
  });

  it('handles sign in', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn('test@example.com', 'password123');
    });

    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('handles sign up', async () => {
    mockAuth.signUp.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signUp('test@example.com', 'password123', 'Test User');
    });

    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: { name: 'Test User' }
      }
    });
  });

  it('handles sign out', async () => {
    mockAuth.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockAuth.signOut).toHaveBeenCalled();
  });

  it('handles magic link', async () => {
    mockAuth.signInWithOtp.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.sendMagicLink('test@example.com');
    });

    expect(mockAuth.signInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});
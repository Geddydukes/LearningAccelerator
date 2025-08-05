import { renderHook, act } from '@testing-library/react';
import { useDatabase } from '../useDatabase';
import toast from 'react-hot-toast';

// Mock dependencies
const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockUseAuth = jest.fn(() => ({
  user: mockUser,
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  sendMagicLink: jest.fn()
}));

const mockGetUser = jest.fn();
const mockCreateUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockGetCurrentWeek = jest.fn();
const mockCreateOrUpdateWeeklyNote = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: mockUseAuth
}));

jest.mock('../../lib/database', () => ({
  DatabaseService: {
    getUser: mockGetUser,
    createUser: mockCreateUser,
    updateUser: mockUpdateUser,
    getCurrentWeek: mockGetCurrentWeek,
    createOrUpdateWeeklyNote: mockCreateOrUpdateWeeklyNote
  }
}));

jest.mock('react-hot-toast');

describe('useDatabase Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes user when auth user exists', async () => {
    const mockUserProfile = { 
      id: 'user-123', 
      email: 'test@example.com', 
      name: 'Test User',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    };

    mockGetUser.mockResolvedValue(mockUserProfile);
    mockGetCurrentWeek.mockResolvedValue(null);

    const { result } = renderHook(() => useDatabase());

    await act(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockGetUser).toHaveBeenCalledWith('user-123');
    expect(result.current.user).toEqual(mockUserProfile);
    expect(result.current.loading).toBe(false);
  });

  it('creates new user profile if none exists', async () => {
    const mockNewUser = { 
      id: 'user-123', 
      email: 'test@example.com', 
      name: 'test',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    };

    mockGetUser.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue(mockNewUser);
    mockGetCurrentWeek.mockResolvedValue(null);

    const { result } = renderHook(() => useDatabase());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockCreateUser).toHaveBeenCalledWith(mockUser);
    expect(toast.success).toHaveBeenCalledWith('Welcome! Your profile has been created.');
    expect(result.current.user).toEqual(mockNewUser);
  });

  it('updates user profile', async () => {
    const mockUpdatedUser = { 
      id: 'user-123', 
      email: 'test@example.com', 
      name: 'Updated Name',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    };

    mockUpdateUser.mockResolvedValue(mockUpdatedUser);

    const { result } = renderHook(() => useDatabase());

    await act(async () => {
      await result.current.updateUserProfile({ name: 'Updated Name' });
    });

    expect(mockUpdateUser).toHaveBeenCalledWith('user-123', { name: 'Updated Name' });
    expect(toast.success).toHaveBeenCalledWith('Profile updated successfully');
  });

  it('handles database errors gracefully', async () => {
    mockGetUser.mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useDatabase());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to load user data');
    expect(result.current.loading).toBe(false);
  });
});
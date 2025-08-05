import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthForm } from '../AuthForm';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Mock the auth context
const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockSendMagicLink = jest.fn();

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    sendMagicLink: mockSendMagicLink,
    user: null,
    loading: false
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

jest.mock('../../../hooks/useDatabase', () => ({
  useDatabase: () => ({
    refreshData: jest.fn()
  })
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('AuthForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders sign in form by default', () => {
    renderWithProviders(<AuthForm />);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('toggles to sign up form', () => {
    renderWithProviders(<AuthForm />);
    fireEvent.click(screen.getByText("Don't have an account? Sign up"));
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    renderWithProviders(<AuthForm />);
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    renderWithProviders(<AuthForm />);
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('submits sign in form with valid data', async () => {
    renderWithProviders(<AuthForm />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('handles magic link flow', async () => {
    renderWithProviders(<AuthForm />);
    
    fireEvent.click(screen.getByText('Use Magic Link'));
    expect(screen.getByText('Magic Link')).toBeInTheDocument();
    
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(mockSendMagicLink).toHaveBeenCalledWith('test@example.com');
    });
  });
});
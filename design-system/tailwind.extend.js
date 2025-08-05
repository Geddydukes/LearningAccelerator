module.exports = {
  colors: {
    // Primary water-inspired blues
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // Aqua accent colors
    aqua: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
    },
    // Teal secondary colors
    teal: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
    },
    // Glass surface colors
    glass: {
      light: 'rgba(255, 255, 255, 0.8)',
      'light-strong': 'rgba(255, 255, 255, 0.95)',
      dark: 'rgba(30, 41, 59, 0.8)',
      'dark-strong': 'rgba(15, 23, 42, 0.95)',
    }
  },
  fontFamily: {
    display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
    body: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },
  fontSize: {
    'display-2xl': 'clamp(3.5rem, 8vw, 6rem)',
    'display-xl': 'clamp(3rem, 6vw, 4.5rem)',
    'display-lg': 'clamp(2.5rem, 5vw, 3.75rem)',
    'display-md': 'clamp(2rem, 4vw, 3rem)',
    'display-sm': 'clamp(1.75rem, 3vw, 2.25rem)',
    'heading-xl': 'clamp(1.5rem, 2.5vw, 1.875rem)',
    'heading-lg': 'clamp(1.25rem, 2vw, 1.5rem)',
    'heading-md': 'clamp(1.125rem, 1.5vw, 1.25rem)',
  },
  spacing: {
    '0.5': '0.125rem',
    '1.5': '0.375rem',
    '2.5': '0.625rem',
    '3.5': '0.875rem',
    '18': '4.5rem',
    '22': '5.5rem',
    '26': '6.5rem',
    '30': '7.5rem',
  },
  borderRadius: {
    '3xl': '1.5rem',
    '4xl': '2rem',
  },
  boxShadow: {
    'ripple-sm': '0 1px 3px rgba(59, 130, 246, 0.1), 0 1px 2px rgba(59, 130, 246, 0.06)',
    'ripple-md': '0 4px 6px rgba(59, 130, 246, 0.07), 0 2px 4px rgba(59, 130, 246, 0.06)',
    'ripple-lg': '0 10px 15px rgba(59, 130, 246, 0.1), 0 4px 6px rgba(59, 130, 246, 0.05)',
    'glass': '0 8px 32px rgba(31, 38, 135, 0.37)',
    'depth-1': '0 1px 3px rgba(0, 0, 0, 0.07), 0 1px 2px rgba(0, 0, 0, 0.05)',
    'depth-2': '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05)',
    'depth-3': '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
  },
  animation: {
    'ripple': 'ripple 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
    'ripple-click': 'ripple-click 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    'float': 'float 3s ease-in-out infinite',
    'blur-pulse': 'blur-pulse 2s ease-in-out infinite',
  },
  keyframes: {
    ripple: {
      '0%': { transform: 'scale(0)', opacity: '0.8' },
      '100%': { transform: 'scale(3)', opacity: '0' },
    },
    'ripple-click': {
      '0%': { transform: 'scale(0)', opacity: '0.6' },
      '100%': { transform: 'scale(1)', opacity: '0' },
    },
    float: {
      '0%, 100%': { transform: 'translateY(0px)' },
      '50%': { transform: 'translateY(-10px)' },
    },
    'blur-pulse': {
      '0%, 100%': { filter: 'blur(0px)', opacity: '1' },
      '50%': { filter: 'blur(4px)', opacity: '0.8' },
    },
  },
  backdropBlur: {
    xs: '2px',
  },
  transitionDuration: {
    '0': '0ms',
    '150': '150ms',
    '1200': '1200ms',
  },
  transitionTimingFunction: {
    'ease-out-sine': 'cubic-bezier(0.39, 0.575, 0.565, 1)',
    'ease-out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    'ripple-ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
}
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type FontScale = 'base' | 'large' | 'xlarge';

interface AccessibilityContextValue {
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

const FONT_SCALE_MAP: Record<FontScale, number> = {
  base: 16,
  large: 18,
  xlarge: 20,
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontScale, setFontScaleState] = useState<FontScale>(() => {
    const saved = localStorage.getItem('accessibility:font-scale');
    if (saved === 'large' || saved === 'xlarge') {
      return saved;
    }
    return 'base';
  });
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('accessibility:high-contrast') === 'true';
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--font-size', `${FONT_SCALE_MAP[fontScale]}px`);
    localStorage.setItem('accessibility:font-scale', fontScale);
  }, [fontScale]);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
    localStorage.setItem('accessibility:high-contrast', String(highContrast));
  }, [highContrast]);

  const value = useMemo<AccessibilityContextValue>(() => ({
    fontScale,
    setFontScale: setFontScaleState,
    highContrast,
    toggleHighContrast: () => setHighContrast(prev => !prev),
  }), [fontScale, highContrast]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export const PATHS = {
  // Public routes
  landing: "/landing",
  auth: "/auth",
  setup: "/setup",
  
  // Main app routes (all under /home)
  home: "/home",
  moduleCurrent: "/home/module/current",
  pastTracks: "/home/past-tracks",
  selfGuided: "/home/self-guided", // Add self-guided learning route
  career: "/home/career",
  portfolio: "/home/portfolio",
  workspace: "/home/workspace", // Add the learning workspace route
  
  // Settings and other routes
  settings: "/home/settings",
  
  // Legacy routes (for redirects)
  legacyWorkspace: "/workspace", // Rename to avoid conflict
  clo: "/clo",
  
  // API and utility routes
  api: "/api",
  health: "/health",
} as const;

// Type for path values
export type PathValue = typeof PATHS[keyof typeof PATHS];

// Helper function to check if a path is a protected route
export const isProtectedRoute = (path: string): boolean => {
  return path.startsWith('/home') || path === '/workspace' || path === '/clo';
};

// Helper function to get the active navigation item
export const getActiveNavItem = (pathname: string) => {
  if (pathname === PATHS.home) return 'dashboard';
  if (pathname === PATHS.moduleCurrent) return 'module';
  if (pathname === PATHS.career) return 'career';
  if (pathname === PATHS.portfolio) return 'portfolio';
  return 'dashboard';
}; 
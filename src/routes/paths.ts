export const PATHS = {
  // Public routes
  landing: "/landing",
  auth: "/auth",
  setup: "/setup",

  // Main app routes (all under /home)
  home: "/home",
  overview: "/home/overview",
  workspace: "/home/workspace",
  missions: "/home/missions",
  tracks: "/home/tracks",
  analytics: "/home/analytics",
  community: "/home/community",
  settings: "/home/settings",

  // Legacy routes (for redirects)
  legacyWorkspace: "/workspace",
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
  if (pathname === PATHS.home || pathname === PATHS.overview) return 'overview';
  if (pathname === PATHS.workspace) return 'workspace';
  if (pathname === PATHS.missions) return 'missions';
  if (pathname === PATHS.tracks) return 'tracks';
  if (pathname === PATHS.analytics) return 'analytics';
  if (pathname === PATHS.community) return 'community';
  if (pathname === PATHS.settings) return 'settings';
  return 'overview';
};
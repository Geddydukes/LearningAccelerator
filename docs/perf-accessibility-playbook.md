# Performance & Accessibility Playbook - Learning Accelerator

## Performance Targets & Budgets

### Core Web Vitals (4G, mid-tier device)
- **Largest Contentful Paint (LCP)**: < 1.8s
- **Total Blocking Time (TBT)**: < 150ms
- **Cumulative Layout Shift (CLS)**: < 0.10
- **Interaction to Next Paint (INP)**: < 200ms
- **Animation bundle**: ≤ 200KB gzipped
- **Total JS**: ≤ 500KB gzipped

### Bundle Analysis
```bash
# Monitor bundle sizes
npm run build -- --analyze
npx bundlesize

# Critical thresholds
- Main bundle: ≤ 300KB gzipped
- Vendor bundle: ≤ 150KB gzipped
- Animation bundle: ≤ 200KB gzipped
- CSS: ≤ 50KB gzipped
```

### Performance Optimization Tactics

#### 1. Code Splitting & Lazy Loading
```typescript
// Route-based splitting
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const SocraticChat = lazy(() => import('./components/agents/SocraticChat'));
const CodeReview = lazy(() => import('./components/code/CodeReview'));

// Component-based splitting for heavy features
const HeroCanvas = lazy(() => import('../design-system/components/HeroCanvas'));
const VoiceControls = lazy(() => import('./components/audio/VoiceControls'));
```

#### 2. Resource Optimization
```typescript
// Image optimization
const OptimizedImage = ({ src, alt, ...props }) => (
  <img 
    src={src}
    alt={alt}
    loading="lazy"
    decoding="async"
    sizes="(max-width: 768px) 100vw, 50vw"
    {...props}
  />
);

// Font preloading
<link rel="preload" href="/fonts/plus-jakarta-sans.woff2" as="font" type="font/woff2" crossorigin />
```

#### 3. Animation Performance
```css
/* GPU acceleration for animations */
.motion-element {
  will-change: transform, opacity;
  transform: translateZ(0);
}

/* Reduced motion fallbacks */
@media (prefers-reduced-motion: reduce) {
  .hero-canvas {
    animation: none;
    background: linear-gradient(180deg, #4A90E2 0%, #0F172A 100%);
  }
  
  .ripple-animation {
    animation: none;
    transition: opacity 0.2s ease;
  }
}
```

## PWA Implementation

### Service Worker (Workbox)
```typescript
// sw.ts
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Agent JSON notes - stale-while-revalidate 24h
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/agent/'),
  new StaleWhileRevalidate({
    cacheName: 'agent-notes',
    plugins: [{
      cacheKeyWillBeUsed: async ({ request }) => `${request.url}-${Date.now()}`,
      cacheWillUpdate: async ({ response }) => response.status === 200
    }]
  })
);

// ElevenLabs audio - cache-first 7 days
registerRoute(
  ({ url }) => url.pathname.includes('/tts-cache/'),
  new CacheFirst({
    cacheName: 'tts-audio',
    plugins: [{
      cacheExpiration: {
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        maxEntries: 100
      }
    }]
  })
);
```

### Install Prompt Handler
```typescript
// PWA install handler
let deferredPrompt: BeforeInstallPromptEvent;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

const handleInstallClick = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User ${outcome} the install prompt`);
    deferredPrompt = null;
  }
};
```

### Web App Manifest
```json
{
  "name": "Learning Accelerator",
  "short_name": "LearnAccel",
  "description": "Multi-Agent Learning Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

## Accessibility Implementation (WCAG 2.1 AA → AAA)

### Keyboard Navigation
```typescript
// Focus management
const useFocusManagement = () => {
  const trapFocus = (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    element.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  };

  return { trapFocus };
};
```

### Semantic Roles & ARIA
```jsx
// Chat interface
<main role="main" aria-label="Socratic dialogue session">
  <section 
    role="log" 
    aria-live="polite" 
    aria-label="Conversation history"
    className="chat-messages"
  >
    {messages.map(message => (
      <div 
        key={message.id}
        role="article" 
        aria-label={`Message from ${message.sender}`}
      >
        {message.content}
      </div>
    ))}
  </section>
  
  <form role="form" aria-label="Send message">
    <input 
      aria-label="Type your response"
      aria-describedby="input-help"
    />
    <div id="input-help" className="sr-only">
      Press Enter to send, Shift+Enter for new line
    </div>
  </form>
</main>

// Code diff viewer
<div role="region" aria-label="Code differences">
  <div role="diff" aria-label="File changes">
    <div role="insertion" aria-label="Added lines">
      {/* Added code */}
    </div>
    <div role="deletion" aria-label="Removed lines">
      {/* Removed code */}
    </div>
  </div>
</div>
```

### Voice & Captions
```typescript
// Caption generation for voice clips
const generateCaptions = (audioUrl: string, transcript: string) => {
  const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
${transcript}`;

  const blob = new Blob([vttContent], { type: 'text/vtt' });
  return URL.createObjectURL(blob);
};

// Audio player with captions
<audio controls>
  <source src={audioUrl} type="audio/mpeg" />
  <track 
    kind="captions" 
    src={captionUrl} 
    srcLang="en" 
    label="English captions"
    default
  />
</audio>
```

### Color Contrast Verification
```css
/* High contrast mode support */
@media (prefers-contrast: high) {
  .glass-card {
    background: var(--bg-solid);
    border: 2px solid currentColor;
    backdrop-filter: none;
  }
  
  .text-secondary {
    color: var(--text-primary);
  }
}

/* Focus indicators */
.focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Ensure 4.5:1 contrast minimum */
:root {
  --text-primary: #0f172a; /* 16.75:1 on white */
  --text-secondary: #475569; /* 7.23:1 on white */
  --text-tertiary: #64748b; /* 4.54:1 on white */
}

.dark {
  --text-primary: #f8fafc; /* 15.52:1 on dark */
  --text-secondary: #cbd5e1; /* 8.14:1 on dark */
  --text-tertiary: #94a3b8; /* 4.89:1 on dark */
}
```

## UX QA Matrix (Nielsen's 10 Heuristics)

| Heuristic | Landing | Dashboard | Module | Chat | CodeReview | BrandPackage | Settings | Status | Issues |
|-----------|---------|-----------|--------|------|------------|--------------|----------|--------|--------|
| **1. Visibility of System Status** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS | - |
| **2. Match System & Real World** | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | MINOR | Chat: Technical jargon needs glossary |
| **3. User Control & Freedom** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | FAIL | Chat: No undo for sent messages |
| **4. Consistency & Standards** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS | - |
| **5. Error Prevention** | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | MINOR | Chat: No confirmation for voice recording |
| **6. Recognition vs Recall** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS | - |
| **7. Flexibility & Efficiency** | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | MINOR | Chat: No keyboard shortcuts |
| **8. Aesthetic & Minimalist** | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | MINOR | CodeReview: Information density high |
| **9. Error Recognition & Recovery** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS | - |
| **10. Help & Documentation** | ⚠️ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ✅ | MINOR | Missing contextual help tooltips |

### Remediation Log Template
```markdown
## Issue #001: Chat Message Undo
- **Severity**: Medium
- **Heuristic**: User Control & Freedom
- **Description**: Users cannot retract sent messages
- **Solution**: Add 5-second undo window with toast notification
- **Assignee**: UX Team
- **Due**: Sprint 3
- **Status**: Open

## Issue #002: Voice Recording Confirmation
- **Severity**: Low  
- **Heuristic**: Error Prevention
- **Description**: No confirmation before sending voice message
- **Solution**: Add "Send recording?" modal with preview
- **Assignee**: Frontend Team
- **Due**: Sprint 4
- **Status**: Open
```

## Fallback Strategies

### Reduced Motion
```typescript
const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return reducedMotion;
};

// Hero fallback
const HeroSection = () => {
  const reducedMotion = useReducedMotion();
  
  if (reducedMotion) {
    return (
      <div className="hero-static bg-gradient-to-b from-blue-600 to-slate-900">
        <h1>Learning Accelerator</h1>
        <p>Multi-Agent Learning Platform</p>
      </div>
    );
  }
  
  return <Suspense fallback={<HeroFallback />}><HeroCanvas /></Suspense>;
};
```

### Network Resilience
```typescript
// Offline detection
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};

// Graceful degradation for API failures
const useAgentWithFallback = () => {
  const callAgent = async (prompt: string) => {
    try {
      return await apiCall(prompt);
    } catch (error) {
      // Fallback to cached response or static content
      return getCachedResponse(prompt) || getStaticFallback();
    }
  };
  
  return { callAgent };
};
```

## Performance Monitoring

### Real User Monitoring
```typescript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = (metric: any) => {
  // Send to your analytics service
  console.log(metric);
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Bundle Analysis
```bash
# Analyze bundle composition
npm run build -- --analyze

# Check for duplicate dependencies
npx webpack-bundle-analyzer build/static/js/*.js

# Monitor bundle size over time
npx bundlesize
```
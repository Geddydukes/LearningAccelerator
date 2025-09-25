# Figma ↔ Code Mapping

## Component Mapping Table

| Figma Component | React Component Path | Token References | Status |
|----------------|---------------------|------------------|---------|
| `Ripple / Hero / Canvas` | `design-system/components/HeroCanvas.tsx` | `motion.ripple.hero-sequence`, `color.primary.*` | ✅ Complete |
| `Ripple / Hero / Overlay` | `design-system/components/HeroCanvas.tsx` | `color.glass.*`, `motion.duration.hero-transition` | ✅ Complete |
| `Navigation / Glass` | `design-system/components/FluidNavigation.tsx` | `color.glass.*`, `borderRadius.2xl` | ✅ Complete |
| `Navigation / Progress Ring` | `design-system/components/FluidNavigation.tsx` | `color.primary.*`, `motion.duration.normal` | ✅ Complete |
| `Cards / Glass Elevated` | `design-system/components/GlassCard.tsx` | `boxShadow.glass`, `color.glass.*` | ✅ Complete |
| `Cards / Glass Default` | `design-system/components/GlassCard.tsx` | `boxShadow.ripple-md`, `color.glass.*` | ✅ Complete |
| `Cards / Glass Subtle` | `design-system/components/GlassCard.tsx` | `boxShadow.ripple-sm`, `color.glass.*` | ✅ Complete |
| `Buttons / Ripple Primary` | `design-system/components/RippleButton.tsx` | `color.primary.*`, `motion.micro-interactions.ripple-click` | ✅ Complete |
| `Buttons / Ripple Secondary` | `design-system/components/RippleButton.tsx` | `color.teal.*`, `motion.micro-interactions.ripple-click` | ✅ Complete |
| `Buttons / Glass` | `design-system/components/RippleButton.tsx` | `color.glass.*`, `motion.micro-interactions.button-hover` | ✅ Complete |
| `Chat / Bubble Ripple` | `components/agents/SocraticChat.tsx` | `borderRadius.2xl`, `color.primary.*` | 🔄 In Progress |
| `Diff / Monaco Wrapper` | `components/code/DiffViewer.tsx` | `color.slate.*`, `fontFamily.mono` | 📋 Planned |
| `KPI / Sparkline Widget` | `components/dashboard/KPIWidget.tsx` | `color.emerald.*`, `motion.duration.fast` | 📋 Planned |

## Design Token Usage

### Color Tokens
- **Primary Blues**: Used in hero canvas, navigation, primary buttons
- **Aqua/Teal**: Secondary actions, accent elements, progress indicators
- **Glass Colors**: Translucent surfaces, overlays, modal backgrounds
- **Semantic Colors**: Text hierarchy, borders, interactive states

### Typography Tokens
- **Display Fonts**: Hero headlines, major section titles
- **Heading Fonts**: Card titles, navigation labels, form headers
- **Body Fonts**: Content text, descriptions, form inputs
- **Mono Fonts**: Code blocks, technical content, diff viewers

### Motion Tokens
- **Hero Sequence**: Initial ripple animation, camera dolly, UI fade-in
- **Micro-interactions**: Button hovers, card lifts, ripple clicks
- **Page Transitions**: Route changes, modal appearances, drawer slides
- **Reduced Motion**: Static alternatives for accessibility

### Spacing Tokens
- **4pt Grid**: Consistent spacing throughout all components
- **Container Widths**: Max-width constraints for different breakpoints
- **Component Padding**: Internal spacing for cards, buttons, forms

## Figma File Structure

```
🎨 Wisely Design System
├── 📄 Cover & Overview
├── 🎯 Design Principles
├── 🎨 Color Palette
│   ├── Primary Blues (8 tints)
│   ├── Aqua/Teal Accents (8 tints)
│   ├── Semantic Colors (light/dark)
│   └── Glass/Translucent Colors
├── 📝 Typography Scale
│   ├── Display Fonts (2xl → sm)
│   ├── Heading Fonts (xl → sm)
│   ├── Body Fonts (lg → xs)
│   └── Code/Mono Fonts
├── 🧩 Components
│   ├── Hero Canvas Variants
│   ├── Navigation Components
│   ├── Card Components
│   ├── Button Components
│   ├── Form Components
│   └── Data Visualization
├── 🎬 Motion & Interactions
│   ├── Hero Ripple Sequence
│   ├── Micro-interactions
│   ├── Page Transitions
│   └── Reduced Motion Alternatives
└── 📱 Responsive Layouts
    ├── Desktop (1440px+)
    ├── Tablet (768px - 1439px)
    └── Mobile (320px - 767px)
```

## Implementation Notes

### Hero Canvas Integration
- WebGL shader requires Three.js and React Three Fiber
- Fallback to CSS animation for reduced motion preference
- Responsive sizing with clamp() functions

### Glass Morphism Implementation
- Uses backdrop-blur CSS property
- Requires browser support check
- Fallback to solid colors for unsupported browsers

### Ripple Effect System
- JavaScript-based click position detection
- CSS animations for ripple expansion
- Automatic cleanup after animation completion

### Accessibility Considerations
- All interactive elements have focus states
- Color contrast ratios meet WCAG AA standards
- Reduced motion alternatives provided
- Keyboard navigation support included

## Development Workflow

1. **Design Updates**: Changes made in Figma
2. **Token Sync**: Design tokens exported and updated
3. **Component Updates**: React components updated to match
4. **Testing**: Visual regression testing with Chromatic
5. **Documentation**: Storybook stories updated
6. **Release**: New version published to npm

## Quality Assurance

- **Visual Testing**: Automated screenshot comparison
- **Accessibility Testing**: axe-core integration
- **Performance Testing**: Lighthouse CI integration
- **Cross-browser Testing**: BrowserStack integration
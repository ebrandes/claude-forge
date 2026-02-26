import type { Section } from '../types/index.js'

export const responsiveDesignSection: Section = {
  id: 'responsive-design',
  title: 'Responsive Design Rules',
  emoji: '📱',
  order: 30,
  render(params) {
    const mode = params.responsiveMode ?? 'mobile-first'

    if (mode === 'context-aware') {
      return renderContextAware(
        params.mobileFirstRoutes ?? ['/field'],
        params.desktopFirstRoutes ?? ['/office'],
      )
    }

    if (mode === 'desktop-first') {
      return `## 📱 Responsive Design Rules — Desktop First

- Design and reason **for desktop first**
- Must work well on mobile, but desktop is the primary experience
- Take advantage of wider screens (multi-column grids, side panels)
- Touch-friendly on mobile but optimized for mouse/keyboard on desktop
- If there is a trade-off: **desktop experience wins**

\`\`\`typescript
// ✅ Desktop-first
<div className="grid grid-cols-4 lg:grid-cols-3 md:grid-cols-2">
\`\`\`

### Shared Rules
- Always use responsive layouts (\`sm:\`, \`md:\`, \`lg:\` breakpoints)
- Never use hover-only interactions (always have a tap/click fallback)
- Touch targets minimum 44px
- Test on both mobile and desktop viewports`
    }

    return `## 📱 Responsive Design Rules — Mobile First (MANDATORY)

- ALWAYS start CSS/Tailwind from mobile
- Use \`min-width\` media queries, NEVER \`max-width\` as base
- Test on mobile BEFORE desktop
- Breakpoint order: base → \`sm:\` → \`md:\` → \`lg:\` → \`xl:\`

\`\`\`typescript
// ✅ CORRECT — Mobile-first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
<div className="p-4 md:p-6 lg:p-8">
<div className="text-sm md:text-base lg:text-lg">

// ❌ WRONG — Desktop-first
<div className="grid grid-cols-4 md:grid-cols-3 sm:grid-cols-2">
\`\`\`

### Shared Rules
- Always use responsive layouts (\`sm:\`, \`md:\`, \`lg:\` breakpoints)
- Never use hover-only interactions (always have a tap/click fallback)
- Touch targets minimum 44px
- Test on both mobile and desktop viewports`
  },
}

function renderContextAware(mobileRoutes: string[], desktopRoutes: string[]): string {
  const mobileList = mobileRoutes.map((r) => `\`${r}\``).join(', ')
  const desktopList = desktopRoutes.map((r) => `\`${r}\``).join(', ')

  return `## 📱 Responsive Design Rules

This project has **two distinct UI contexts** with different design priorities:

### ${mobileList} routes — Mobile First
- ALWAYS start CSS/Tailwind from mobile
- Breakpoint order: base → \`sm:\` → \`md:\` → \`lg:\` → \`xl:\`
- Touch-friendly spacing (min 44px tap targets)
- If there is a trade-off: **mobile experience wins**

\`\`\`typescript
// ✅ Mobile-first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
\`\`\`

### ${desktopList} routes — Desktop First
- Desktop is the primary experience
- Take advantage of wider screens (multi-column grids, side panels)
- Optimized for mouse/keyboard on desktop
- If there is a trade-off: **desktop experience wins**

\`\`\`typescript
// ✅ Desktop-first
<div className="grid grid-cols-4 lg:grid-cols-3 md:grid-cols-2">
\`\`\`

### Shared Rules
- Always use responsive layouts (\`sm:\`, \`md:\`, \`lg:\` breakpoints)
- Never use hover-only interactions (always have a tap/click fallback)
- Touch targets minimum 44px
- Test on both mobile and desktop viewports`
}

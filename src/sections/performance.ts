import type { Section } from '../types/index.js'

export const performanceSection: Section = {
  id: 'performance',
  title: 'Performance First Rules',
  emoji: '⚡',
  order: 40,
  render(params) {
    const extras = (params.extras as string[] | undefined) ?? []

    let extrasBlock = ''
    if (extras.length > 0) {
      extrasBlock = '\n### Project-Specific Performance Rules\n' +
        extras.map(e => `- ${e}`).join('\n')
    }

    return `## ⚡ Performance First Rules

- Avoid unnecessary re-renders, effects, state and network requests
- Prefer Server Components (default in Next.js) — Client Components (\`'use client'\`) only for interactivity
- \`next/image\` for ALL images
- Lazy loading for components > 50KB
- Code splitting with \`dynamic()\` imports
- Memoization **only when justified** (lists, heavy computations)

\`\`\`typescript
// Lazy loading heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
})

// Justified memoization
const filtered = useMemo(() =>
  items.filter(i => i.status === 'active'),
  [items]
)
\`\`\`

If unsure:
> **Choose the simpler and more predictable solution**${extrasBlock}`
  },
}

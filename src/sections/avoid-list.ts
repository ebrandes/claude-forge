import type { Section } from '../types/index.js'

export const avoidListSection: Section = {
  id: 'avoid-list',
  title: 'Explicitly Avoid',
  emoji: '🚫',
  order: 130,
  render() {
    return `## 🚫 Explicitly Avoid

- Over-engineering and unnecessary abstractions
- Large refactors without request
- "God files" with multiple responsibilities
- Duplicated local utility functions
- \`any\` in TypeScript
- Console.logs and commented-out code
- Hover-only interactions
- Magic numbers without named constants
- Framework hype solutions
- Clever hacks that reduce readability

---

## ✅ Final Goal

The codebase must be:

- Easy to understand in 6 months
- Easy to delete and refactor
- Friendly for humans first, AI second
- Performant on low-end mobile devices

> **If in doubt, choose the simplest solution that works.**`
  },
}

import type { Section } from '../types/index.js'

export const accessibilitySection: Section = {
  id: 'accessibility',
  title: 'Accessibility',
  emoji: '♿',
  order: 110,
  render() {
    return `## ♿ Accessibility (a11y)

- Always consider accessibility
- Semantic HTML when possible
- Keyboard navigation matters
- Text contrast is not optional`
  },
}

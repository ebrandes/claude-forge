import type { Section } from '../types/index.js'

export const errorHandlingSection: Section = {
  id: 'error-handling',
  title: 'Error Handling',
  emoji: '🧪',
  order: 90,
  render() {
    return `## 🧪 Error Handling

- Handle errors explicitly
- Never silently fail
- Prefer early returns
- Fail fast when something is wrong

If an error is expected:
> Make it explicit in the code`
  },
}

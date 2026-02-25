import type { Section } from '../types/index.js'

export const componentsFunctionsSection: Section = {
  id: 'components-functions',
  title: 'Components & Functions',
  emoji: '🧩',
  order: 70,
  render() {
    return `## 🧩 Components & Functions

### React Component Structure (~100-300 lines ideal)
\`\`\`typescript
// 1. Imports
// 2. Types/Interfaces
// 3. Component
export function MetricCard({ title, value }: MetricCardProps) {
  // 3a. Hooks
  // 3b. Computed values (useMemo)
  // 3c. Handlers (useCallback if passed as prop)
  // 3d. Effects
  // 3e. Early returns (loading, error)
  // 3f. Render
  return (/* ... */)
}
\`\`\`

### CSS/Tailwind
\`\`\`typescript
// Use cn() for conditional classes
className={cn(
  'base-classes',
  condition && 'conditional-classes',
  className // props.className last
)}
\`\`\`

### Functions
- Do one thing, be readable without comments
- Extract hooks for logic > 50 lines
- If copy/paste > 3 lines → create function/component`
  },
}

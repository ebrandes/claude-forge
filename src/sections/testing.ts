import type { Section } from '../types/index.js'

export const testingSection: Section = {
  id: 'testing',
  title: 'Testing Rules',
  emoji: '🧪',
  order: 85,
  render() {
    return `## 🧪 Testing Rules

### What MUST be tested
- **UI primitive components** (Button, Input, Select, Modal, etc.) — each must have its own test file
- **Custom hooks** with business logic
- **Utility functions** (formatters, validators, parsers)
- **API service functions** (mock the HTTP layer)

### Test file convention
\`\`\`
components/button.tsx        → components/button.test.tsx
components/input.tsx         → components/input.test.tsx
hooks/use-cart.ts            → hooks/use-cart.test.ts
lib/format-price.ts          → lib/format-price.test.ts
\`\`\`

### What to test in UI components
\`\`\`typescript
// button.test.tsx
describe('Button', () => {
  it('renders with correct text', () => {})
  it('calls onClick when clicked', () => {})
  it('is disabled when disabled prop is true', () => {})
  it('applies variant classes correctly', () => {})
  it('renders loading state', () => {})
})
\`\`\`

### Testing principles
- Test **behavior**, not implementation details
- One assertion per test (when possible)
- Use descriptive test names: \`it('shows error message when email is invalid')\`
- Mock external dependencies (APIs, storage), never mock internal modules
- Prefer \`userEvent\` over \`fireEvent\` for user interactions
- Always test: happy path, error states, edge cases, loading states

### When NOT to test
- Pure layout/wrapper components with no logic
- Third-party library internals
- Implementation details (internal state, private methods)`
  },
}

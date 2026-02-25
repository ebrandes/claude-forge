import type { Section } from '../types/index.js'

export const bugPreventionSection: Section = {
  id: 'bug-prevention',
  title: 'Bug Prevention Rules',
  emoji: '🛡️',
  order: 95,
  render() {
    return `## 🛡️ Bug Prevention Rules

### Validate at system boundaries
- ALWAYS validate user input (forms, URL params, API bodies)
- NEVER trust external API responses — check for null/undefined
- Use Zod or similar for runtime validation at boundaries
- Parse, don't validate: transform unknown data into typed objects

\`\`\`typescript
// ❌ Trust external data
const user = await api.getUser(id) // might be null
return user.name // 💥 runtime error

// ✅ Validate at boundary
const user = await api.getUser(id)
if (!user) throw new NotFoundError('User not found')
return user.name
\`\`\`

### Prevent common bugs
- Always handle loading, error, and empty states in UI
- Never use \`!\` (non-null assertion) — use proper null checks
- Use optional chaining (\`?.\`) for potentially undefined chains
- Default to empty arrays/objects instead of null/undefined
- Provide fallback values for optional props

### Error handling at every level
- API calls: wrap in try/catch, show user-friendly error
- Async operations: always handle rejected promises
- State updates: validate before setting state
- Never silently swallow errors — at minimum, log them

### Type safety
- Zero \`any\` tolerance — use \`unknown\` if type is truly unknown
- Prefer discriminated unions over boolean flags
- Use \`as const\` for literal types
- Exhaustive switch/case with \`never\` default`
  },
}

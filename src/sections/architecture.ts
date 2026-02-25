import type { Section } from '../types/index.js'

export const architectureSection: Section = {
  id: 'architecture',
  title: 'Architecture & Structure',
  emoji: '🧱',
  order: 50,
  render(params) {
    const extras = (params.extras as string[] | undefined) ?? []

    let extrasBlock = ''
    if (extras.length > 0) {
      extrasBlock = '\n\n### Project Directory Convention\n' +
        extras.map(e => `- \`${e}\``).join('\n')
    }

    return `## 🧱 Architecture & Structure

| Location | Responsibility |
|----------|---------------|
| Components | UI, rendering, minimal logic |
| Hooks | State logic and side effects |
| Services | External communication (APIs) |
| Utils | Pure functions, no side effects |
| Types | Type definitions |

**Never mix responsibilities in the same file.**

### Reusable code locations
\`\`\`
/lib/utils.ts        → General utility functions
/lib/format.ts       → Formatting (currency, date, number)
/hooks/use-*.ts      → Custom hooks
/components/ui/*     → Primitive UI components
/types/*.ts          → Types and interfaces
\`\`\`

**Before creating any utility function, check if it already exists in the centralized locations above.**${extrasBlock}`
  },
}

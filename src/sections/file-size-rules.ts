import type { Section } from '../types/index.js'

export const fileSizeRulesSection: Section = {
  id: 'file-size-rules',
  title: 'File & Code Size Rules',
  emoji: '📏',
  order: 20,
  render(params) {
    const max = params.maxLinesPerFile ?? 400
    const [idealMin, idealMax] = params.idealLineRange ?? [100, 250]

    return `## 📏 File & Code Size Rules (VERY IMPORTANT)

- **Max ${max} lines per file** (hard limit)
- Ideal target: **${idealMin}–${idealMax} lines**
- Components React: ~300 lines max (including imports)
- Services/Utils: ~${max} lines max

**Splitting strategy:**
\`\`\`
Component grande → Extract sub-components
Service grande   → Split by responsibility
Hook complexo    → Split into smaller hooks
Types extensos   → Separate by domain
\`\`\`

❌ Never create "god files"
✅ Prefer many small, focused files`
  },
}

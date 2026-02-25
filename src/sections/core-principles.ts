import type { Section } from '../types/index.js'

export const corePrinciplesSection: Section = {
  id: 'core-principles',
  title: 'Core Principles',
  emoji: '🎯',
  order: 10,
  render() {
    return `## 🎯 Core Principles

1. **Performance first**
2. **Responsive design** (context-aware)
3. **Simplicity > cleverness**
4. **Readable code > short code**
5. **Explicit > implicit**
6. **Small files, small components**
7. **No premature abstractions**`
  },
}

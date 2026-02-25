import type { Section } from '../types/index.js'

export const namingConventionsSection: Section = {
  id: 'naming-conventions',
  title: 'Naming Conventions',
  emoji: '📝',
  order: 80,
  render() {
    return `## 📝 Naming Conventions

### Files
\`\`\`
components/product-card.tsx      # kebab-case
hooks/use-cart.ts                # use- prefix
lib/format-price.ts              # kebab-case
types/product.ts                 # singular
\`\`\`

### Variables & Functions
\`\`\`typescript
const productList = []            // camelCase
function calculateROAS() {}       // camelCase, descriptive

function MetricCard() {}          // PascalCase for components
interface CampaignData {}         // PascalCase for types

const MAX_RETRIES = 3             // UPPER_SNAKE_CASE for constants
\`\`\`

### Booleans must read like a sentence
\`isLoading\`, \`hasPermission\`, \`shouldRenderHeader\`, \`canEdit\`

### Descriptive names (MANDATORY)
❌ \`handleData()\`, \`processItems()\`, \`doStuff()\`
✅ \`calculateOrderTotal()\`, \`filterActiveCampaigns()\`, \`formatCurrencyBRL()\``
  },
}

import type { Section } from '../types/index.js'

export const stateManagementSection: Section = {
  id: 'state-management',
  title: 'State Management',
  emoji: '🧠',
  order: 60,
  render() {
    return `## 🧠 State Management

- Avoid global state unless necessary
- Prefer local state first
- Lift state **only when there is a real need**
- Keep state minimal and normalized

Rule of thumb:
> If it's not shared, it shouldn't be global`
  },
}

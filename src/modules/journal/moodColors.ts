// Maps known mood tag strings to a 3px left-border color for journal entry rows.
// Unknown tags fall back to --color-border-default.

const MOOD_COLORS: Record<string, string> = {
  happy: 'var(--color-success)',       // green
  great: 'var(--color-success)',
  good: 'var(--color-success)',
  sad: 'var(--color-text-muted)',      // muted
  down: 'var(--color-text-muted)',
  bad: 'var(--color-text-muted)',
  tired: 'var(--color-warning)',       // amber
  exhausted: 'var(--color-warning)',
  anxious: 'var(--color-warning)',
  focused: 'var(--color-accent)',      // accent blue
  productive: 'var(--color-accent)',
  motivated: 'var(--color-accent)',
  calm: 'var(--color-accent)',
}

export function getMoodColor(tag: string | null | undefined): string {
  if (!tag) return 'var(--color-border-default)'
  return MOOD_COLORS[tag.toLowerCase().trim()] ?? 'var(--color-border-default)'
}

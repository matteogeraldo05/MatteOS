import Button from './Button'

interface EmptyStateProps {
  message: string
  ctaLabel?: string
  onCta?: () => void
}

export default function EmptyState({ message, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="text-sm text-text-secondary">{message}</p>
      {ctaLabel && onCta && (
        <Button variant="secondary" size="sm" onClick={onCta}>
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}

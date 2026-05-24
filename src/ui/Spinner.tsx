interface SpinnerProps {
  size?: number
}

export default function Spinner({ size = 14 }: SpinnerProps) {
  return (
    <span
      className="matteos-spin inline-block rounded-full flex-shrink-0"
      style={{
        width: size,
        height: size,
        border: `2px solid var(--color-border-default)`,
        borderTopColor: `var(--color-accent)`,
      }}
      aria-label="Loading"
      role="status"
    />
  )
}

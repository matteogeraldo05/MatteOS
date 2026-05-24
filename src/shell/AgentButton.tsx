import Button from '../ui/Button'

interface AgentButtonProps {
  label: string
  onClick: () => void
  loading?: boolean
}

export default function AgentButton({ label, onClick, loading = false }: AgentButtonProps) {
  return (
    <Button
      variant="primary"
      size="sm"
      onClick={onClick}
      loading={loading}
      className="text-2xs tracking-[0.08em] uppercase"
    >
      {label}
    </Button>
  )
}

import Modal from './Modal'
import Button from './Button'

interface ConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  message: string
  confirmLabel?: string
  confirmVariant?: 'primary' | 'danger'
  loading?: boolean
}

export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title="Confirm">
      <p className="text-sm text-text-secondary mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant={confirmVariant === 'danger' ? 'primary' : 'primary'}
          onClick={onConfirm}
          loading={loading}
          className={confirmVariant === 'danger' ? '!bg-danger hover:!bg-danger/90' : ''}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

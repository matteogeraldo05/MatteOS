import { useRef, useEffect, useState } from 'react'
import Modal from '../../ui/Modal'
import Spinner from '../../ui/Spinner'
import Button from '../../ui/Button'
import { useUploadReceipt } from './queries'
import { useToast } from '../../ui/Toast'
import type { TransactionPrefill } from './TransactionForm'

const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB

interface ReceiptCaptureProps {
  open: boolean
  onClose: () => void
  /** Called with prefill data after a successful upload so the form can open. */
  onPrefill?: (data: TransactionPrefill) => void
}

type UploadStatus = 'idle' | 'uploading' | 'error'

export default function ReceiptCapture({ open, onClose, onPrefill }: ReceiptCaptureProps) {
  const { push } = useToast()
  const uploadReceipt = useUploadReceipt()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasTriggeredRef = useRef(false)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')

  // Trigger file picker once when opened
  useEffect(() => {
    if (open && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true
      // Small timeout lets the DOM render the input before triggering
      setTimeout(() => fileInputRef.current?.click(), 50)
    }
    if (!open) {
      hasTriggeredRef.current = false
      setFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setStatus('idle')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]

    // No file chosen — user cancelled
    if (!selected) {
      onClose()
      return
    }

    // Validate MIME type
    if (!ACCEPTED_MIME_TYPES.includes(selected.type)) {
      push({
        kind: 'danger',
        title: 'Unsupported file type',
        description: 'Please select a JPEG, PNG, WebP, or HEIC image.',
      })
      onClose()
      return
    }

    // Validate size
    if (selected.size > MAX_FILE_BYTES) {
      push({
        kind: 'danger',
        title: 'File too large',
        description: 'Maximum receipt image size is 5 MB.',
      })
      onClose()
      return
    }

    // Show preview + start upload
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
    setStatus('uploading')

    try {
      const result = await uploadReceipt.mutateAsync(selected)

      // Phase 4 — agent not wired yet; show informational toast and open form
      push({
        kind: 'info',
        title: 'Receipt saved',
        description: 'Add transaction details below. Automatic scanning becomes available after agent setup.',
      })

      // Pass the uploadId so TransactionForm can link receipt to the transaction
      onPrefill?.({ receiptUploadId: result.uploadId })
      onClose()
    } catch (err) {
      push({ kind: 'danger', title: 'Upload failed', description: String(err) })
      setStatus('error')
    }
  }

  // Only show the modal after a file is selected (while uploading or on error)
  const showModal = open && file !== null

  return (
    <>
      {/* Hidden file input — rendered in DOM while open */}
      {open && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          // capture="environment" enables rear camera on mobile
          capture="environment"
          className="hidden"
          aria-hidden="true"
          onChange={handleFileChange}
          // Reset value so the same file can be re-selected after an error
          onClick={(e) => {
            ;(e.currentTarget as HTMLInputElement).value = ''
          }}
        />
      )}

      {/* Preview modal while uploading */}
      <Modal open={showModal} onClose={onClose} title="Uploading receipt…">
        <div className="flex flex-col items-center gap-5 py-2">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Receipt preview"
              className="max-h-52 w-full rounded-lg border border-border-default object-contain"
            />
          )}

          {status === 'uploading' && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Spinner size={14} />
              <span>Uploading to secure storage…</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-3 w-full">
              <p className="text-sm text-danger">Upload failed. Please try again.</p>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

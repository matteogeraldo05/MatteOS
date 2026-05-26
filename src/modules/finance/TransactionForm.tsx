import { useState, useEffect } from 'react'
import Modal from '../../ui/Modal'
import Input from '../../ui/Input'
import NumberInput from '../../ui/NumberInput'
import DateInput from '../../ui/DateInput'
import Select from '../../ui/Select'
import Button from '../../ui/Button'
import ConfirmDialog from '../../ui/ConfirmDialog'
import { useUpsertTransaction, useDeleteTransaction, CATEGORY_OPTIONS } from './queries'
import type { Transaction, FinanceCategory } from './queries'
import { useToast } from '../../ui/Toast'
import { todayInTz } from '../../lib/dates'
import { useAuth } from '../../auth/AuthProvider'

export interface TransactionPrefill {
  merchant?: string
  amountDollars?: number
  date?: string
  category?: FinanceCategory
  receiptUploadId?: string
}

interface TransactionFormProps {
  open: boolean
  onClose: () => void
  initial?: Transaction | null
  prefill?: TransactionPrefill
}

export default function TransactionForm({ open, onClose, initial, prefill }: TransactionFormProps) {
  const { profile } = useAuth()
  const tz = profile?.timezone ?? 'UTC'
  const today = todayInTz(tz)

  const { push } = useToast()
  const upsert = useUpsertTransaction()
  const del = useDeleteTransaction()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  // Form state
  const [merchant, setMerchant] = useState('')
  const [date, setDate] = useState(today)
  const [amountDollars, setAmountDollars] = useState<number | ''>('')
  const [category, setCategory] = useState<FinanceCategory>('other')
  const [notes, setNotes] = useState('')
  const [receiptUploadId, setReceiptUploadId] = useState<string | null>(null)

  // Re-initialise when the modal opens
  useEffect(() => {
    if (!open) return
    if (initial) {
      setMerchant(initial.merchant)
      setDate(initial.transaction_date)
      setAmountDollars(initial.amount_cents / 100)
      setCategory(initial.category)
      setNotes(initial.notes ?? '')
      setReceiptUploadId(initial.receipt_upload_id)
    } else {
      setMerchant(prefill?.merchant ?? '')
      setDate(prefill?.date ?? today)
      setAmountDollars(prefill?.amountDollars ?? '')
      setCategory(prefill?.category ?? 'other')
      setNotes('')
      setReceiptUploadId(prefill?.receiptUploadId ?? null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSave = async () => {
    if (!merchant.trim()) {
      push({ kind: 'danger', title: 'Merchant name is required' })
      return
    }
    if (amountDollars === '' || Number(amountDollars) < 0) {
      push({ kind: 'danger', title: 'Enter a valid amount' })
      return
    }

    const payload = {
      merchant: merchant.trim(),
      transaction_date: date,
      amount_cents: Math.round(Number(amountDollars) * 100),
      category,
      notes: notes.trim() || null,
      receiptUploadId,
    }

    try {
      if (initial) {
        await upsert.mutateAsync({ ...payload, id: initial.id })
      } else {
        await upsert.mutateAsync(payload)
      }
      push({ kind: 'success', title: initial ? 'Transaction updated' : 'Transaction added' })
      onClose()
    } catch (err) {
      push({ kind: 'danger', title: 'Failed to save transaction', description: String(err) })
    }
  }

  const handleDelete = async () => {
    if (!initial) return
    try {
      await del.mutateAsync(initial.id)
      push({ kind: 'success', title: 'Transaction deleted' })
      setShowConfirmDelete(false)
      onClose()
    } catch (err) {
      push({ kind: 'danger', title: 'Failed to delete transaction', description: String(err) })
    }
  }

  const isSaving = upsert.isPending

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={initial ? 'Edit transaction' : 'New transaction'}
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Merchant"
            value={merchant}
            onChange={setMerchant}
            placeholder="e.g. Costco, Shell, Netflix…"
          />

          <div className="grid grid-cols-2 gap-3">
            <DateInput
              label="Date"
              value={date}
              onChange={setDate}
              max={today}
            />
            <NumberInput
              label="Amount ($)"
              value={amountDollars}
              onChange={setAmountDollars}
              min={0}
              step={0.01}
              placeholder="0.00"
            />
          </div>

          <Select
            label="Category"
            value={category}
            onChange={(v) => setCategory(v as FinanceCategory)}
            options={CATEGORY_OPTIONS}
          />

          <Input
            label="Notes (optional)"
            value={notes}
            onChange={setNotes}
            placeholder="Add a note…"
          />

          {receiptUploadId && (
            <p className="text-xs text-text-secondary">
              📎 Receipt attached
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            {initial ? (
              <Button
                variant="ghost"
                onClick={() => setShowConfirmDelete(true)}
                className="text-danger hover:text-danger"
              >
                Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={isSaving}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={showConfirmDelete}
        message="Delete this transaction? This can't be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
        loading={del.isPending}
      />
    </>
  )
}

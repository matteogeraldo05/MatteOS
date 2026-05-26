import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'

// ─── Types ───────────────────────────────────────────────────────────────────

export type FinanceCategory =
  | 'food'
  | 'groceries'
  | 'transport'
  | 'housing'
  | 'entertainment'
  | 'health'
  | 'shopping'
  | 'other'

export const CATEGORY_LABELS: Record<FinanceCategory, string> = {
  food: 'Food',
  groceries: 'Groceries',
  transport: 'Transport',
  housing: 'Housing',
  entertainment: 'Entertainment',
  health: 'Health',
  shopping: 'Shopping',
  other: 'Other',
}

export const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABELS) as FinanceCategory[]).map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}))

export type Transaction = {
  id: string
  user_id: string
  transaction_date: string
  merchant: string
  amount_cents: number
  category: FinanceCategory
  notes: string | null
  receipt_upload_id: string | null
  created_at: string
  updated_at: string
}

export type TransactionPayload = {
  transaction_date: string
  merchant: string
  amount_cents: number
  category: FinanceCategory
  notes?: string | null
  receipt_upload_id?: string | null
}

export type ReceiptUploadResult = {
  uploadId: string
  signedUrl: string
  storagePath: string
}

// ─── useMonthTransactions ─────────────────────────────────────────────────────

export function useMonthTransactions(year: number, month: number) {
  const { user } = useAuth()

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  // Last day of month: day=0 of next month rolls back
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return useQuery<Transaction[]>({
    queryKey: ['transactions', year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as Transaction[]
    },
    enabled: !!user,
  })
}

// ─── useUpsertTransaction ─────────────────────────────────────────────────────

export function useUpsertTransaction() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      receiptUploadId,
      ...payload
    }: TransactionPayload & { id?: string; receiptUploadId?: string | null }) => {
      if (id) {
        const { error } = await supabase
          .from('transactions')
          .update({ ...payload, receipt_upload_id: receiptUploadId ?? undefined })
          .eq('id', id)
          .eq('user_id', user!.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert({ ...payload, receipt_upload_id: receiptUploadId ?? null, user_id: user!.id })
        if (error) throw error
      }

      // If a receipt was linked, flip it to processed
      if (receiptUploadId) {
        await supabase
          .from('receipt_uploads')
          .update({ processed: true })
          .eq('id', receiptUploadId)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

// ─── useDeleteTransaction ─────────────────────────────────────────────────────

export function useDeleteTransaction() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

// ─── useUploadReceipt ─────────────────────────────────────────────────────────

export function useUploadReceipt() {
  const { user } = useAuth()

  return useMutation<ReceiptUploadResult, Error, File>({
    mutationFn: async (file: File) => {
      const userId = user!.id
      const now = new Date()
      const yyyy = now.getFullYear()
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const uuid = crypto.randomUUID()
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const storagePath = `${userId}/${yyyy}/${mm}/${uuid}.${ext}`

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(storagePath, file, { contentType: file.type })
      if (uploadError) throw uploadError

      // Insert receipt_uploads row
      const { data: uploadRow, error: insertError } = await supabase
        .from('receipt_uploads')
        .insert({ user_id: userId, storage_path: storagePath })
        .select('id')
        .single()
      if (insertError) throw insertError

      // Get signed URL (60s expiry)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('receipts')
        .createSignedUrl(storagePath, 60)
      if (signedError) throw signedError

      return {
        uploadId: uploadRow.id as string,
        signedUrl: signedData.signedUrl,
        storagePath,
      }
    },
  })
}

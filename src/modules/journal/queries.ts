import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'

// ─── Types ────────────────────────────────────────────────────────────────────

export type JournalEntry = {
  id: string
  user_id: string
  entry_date: string
  body: string
  mood_tag: string | null
  word_count: number
  created_at: string
  updated_at: string
}

export type Book = {
  id: string
  user_id: string
  title: string
  author: string
  cover_color: string
  cover_texture: 'solid' | 'lines' | 'dots' | 'gradient'
  created_at: string
  updated_at: string
}

export type BookSection = {
  id: string
  user_id: string
  book_id: string
  section_type: 'quote' | 'reflection' | 'note'
  body: string
  sort_order: number
  created_at: string
  updated_at: string
}

export type BookWithSections = Book & {
  book_sections: BookSection[]
}

export type JournalEntryUpsert = {
  entry_date: string
  body: string
  mood_tag?: string | null
}

export type BookUpsert = {
  id?: string
  title: string
  author: string
  cover_color: string
  cover_texture: 'solid' | 'lines' | 'dots' | 'gradient'
}

export type BookSectionUpsert = {
  id?: string
  book_id: string
  section_type: 'quote' | 'reflection' | 'note'
  body: string
  sort_order?: number
}

// ─── Journal Queries ──────────────────────────────────────────────────────────

export function useJournalEntry(date: string) {
  const { user } = useAuth()

  return useQuery<JournalEntry | null>({
    queryKey: ['journal_entry', date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user!.id)
        .eq('entry_date', date)
        .maybeSingle()
      if (error) throw error
      return data ?? null
    },
    enabled: !!user,
  })
}

export function useJournalList(limit = 50) {
  const { user } = useAuth()

  return useQuery<JournalEntry[]>({
    queryKey: ['journal_list', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user!.id)
        .order('entry_date', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as JournalEntry[]
    },
    enabled: !!user,
  })
}

export function useUpsertJournalEntry() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: JournalEntryUpsert) => {
      const { error } = await supabase
        .from('journal_entries')
        .upsert(
          { ...payload, user_id: user!.id },
          { onConflict: 'user_id,entry_date' },
        )
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journal_entry', variables.entry_date] })
      queryClient.invalidateQueries({ queryKey: ['journal_list'] })
    },
  })
}

// ─── Book Queries ─────────────────────────────────────────────────────────────

export function useBooks() {
  const { user } = useAuth()

  return useQuery<Book[]>({
    queryKey: ['books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Book[]
    },
    enabled: !!user,
  })
}

export function useBookDetail(id: string | null) {
  const { user } = useAuth()

  return useQuery<BookWithSections | null>({
    queryKey: ['book_detail', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('books')
        .select('*, book_sections(*)')
        .eq('id', id)
        .eq('user_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data as BookWithSections | null
    },
    enabled: !!user && !!id,
  })
}

export function useUpsertBook() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: BookUpsert) => {
      const { data, error } = await supabase
        .from('books')
        .upsert(
          { ...payload, user_id: user!.id },
          { onConflict: 'id' },
        )
        .select()
        .single()
      if (error) throw error
      return data as Book
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['book_detail', data.id] })
    },
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

// ─── Book Section Queries ─────────────────────────────────────────────────────

export function useUpsertBookSection() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: BookSectionUpsert) => {
      // If no sort_order, fetch current max for this book+type and add 1
      let sortOrder = payload.sort_order
      if (sortOrder === undefined) {
        const { data: existing } = await supabase
          .from('book_sections')
          .select('sort_order')
          .eq('book_id', payload.book_id)
          .eq('section_type', payload.section_type)
          .order('sort_order', { ascending: false })
          .limit(1)
        sortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0
      }

      const { error } = await supabase
        .from('book_sections')
        .upsert(
          { ...payload, sort_order: sortOrder, user_id: user!.id },
          { onConflict: 'id' },
        )
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['book_detail', variables.book_id] })
    },
  })
}

export function useDeleteBookSection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, bookId }: { id: string; bookId: string }) => {
      const { error } = await supabase
        .from('book_sections')
        .delete()
        .eq('id', id)
      if (error) throw error
      return bookId
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['book_detail', variables.bookId] })
    },
  })
}

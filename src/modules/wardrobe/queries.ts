import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'

// ─── Types ────────────────────────────────────────────────────────────────────

export type WardrobeCategory = 'tops' | 'bottoms' | 'outerwear' | 'shoes' | 'accessories'
export type WardrobeStatus = 'owned' | 'wishlist'
export type WardrobePriority = 'low' | 'medium' | 'high'
export type WardrobeTag = 'casual' | 'gym' | 'formal' | 'going-out' | 'work'

export const CATEGORY_LABELS: Record<WardrobeCategory, string> = {
  tops: 'Tops',
  bottoms: 'Bottoms',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessories: 'Accessories',
}

export const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABELS) as WardrobeCategory[]).map((v) => ({
  value: v,
  label: CATEGORY_LABELS[v],
}))

export const TAG_OPTIONS: { value: WardrobeTag; label: string }[] = [
  { value: 'casual', label: 'Casual' },
  { value: 'gym', label: 'Gym' },
  { value: 'formal', label: 'Formal' },
  { value: 'going-out', label: 'Going Out' },
  { value: 'work', label: 'Work' },
]

export const PRIORITY_OPTIONS: { value: WardrobePriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export type WardrobeItem = {
  id: string
  user_id: string
  name: string
  category: WardrobeCategory
  color: string
  tags: WardrobeTag[]
  image_url: string | null
  status: WardrobeStatus
  price_cents: number | null
  priority: WardrobePriority | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Outfit = {
  id: string
  user_id: string
  name: string
  occasion_tag: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type OutfitWithItems = Outfit & {
  outfit_items: {
    id: string
    outfit_id: string
    wardrobe_item_id: string
    created_at: string
    wardrobe_items: WardrobeItem
  }[]
}

export type WardrobeItemPayload = {
  name: string
  category: WardrobeCategory
  color: string
  tags: WardrobeTag[]
  image_url: string | null
  status: WardrobeStatus
  price_cents: number | null
  priority: WardrobePriority | null
  notes: string | null
}

// ─── useWardrobeItems ─────────────────────────────────────────────────────────

export function useWardrobeItems(status: WardrobeStatus) {
  const { user } = useAuth()

  return useQuery<WardrobeItem[]>({
    queryKey: ['wardrobe_items', user?.id, status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', status)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as WardrobeItem[]
    },
    enabled: !!user,
  })
}

// ─── useAllOwnedItems — for outfit builder ────────────────────────────────────

export function useAllOwnedItems() {
  return useWardrobeItems('owned')
}

// ─── useOutfits ───────────────────────────────────────────────────────────────

export function useOutfits() {
  const { user } = useAuth()

  return useQuery<OutfitWithItems[]>({
    queryKey: ['outfits', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outfits')
        .select('*, outfit_items(*, wardrobe_items(*))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as OutfitWithItems[]
    },
    enabled: !!user,
  })
}

// ─── useUpsertWardrobeItem ────────────────────────────────────────────────────

export function useUpsertWardrobeItem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: WardrobeItemPayload }) => {
      if (id) {
        const { error } = await supabase
          .from('wardrobe_items')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user!.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('wardrobe_items')
          .insert({ ...payload, user_id: user!.id })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardrobe_items'] })
    },
  })
}

// ─── useDeleteWardrobeItem ────────────────────────────────────────────────────

export function useDeleteWardrobeItem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('wardrobe_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardrobe_items'] })
    },
  })
}

// ─── useMarkAsOwned ───────────────────────────────────────────────────────────

export function useMarkAsOwned() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('wardrobe_items')
        .update({ status: 'owned', price_cents: null, priority: null, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardrobe_items'] })
    },
  })
}

// ─── useCreateOutfit ──────────────────────────────────────────────────────────

export function useCreateOutfit() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      name,
      occasion_tag,
      notes,
      itemIds,
    }: {
      name: string
      occasion_tag: string
      notes: string | null
      itemIds: string[]
    }) => {
      const { data: outfit, error: outfitError } = await supabase
        .from('outfits')
        .insert({ user_id: user!.id, name, occasion_tag, notes })
        .select('id')
        .single()
      if (outfitError) throw outfitError

      if (itemIds.length > 0) {
        const { error: itemsError } = await supabase.from('outfit_items').insert(
          itemIds.map((wardrobe_item_id) => ({
            outfit_id: (outfit as { id: string }).id,
            wardrobe_item_id,
          }))
        )
        if (itemsError) throw itemsError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] })
    },
  })
}

// ─── useDeleteOutfit ──────────────────────────────────────────────────────────

export function useDeleteOutfit() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('outfits')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] })
    },
  })
}

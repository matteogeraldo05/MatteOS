import ScreenHeader from '../../ui/ScreenHeader'
import EmptyState from '../../ui/EmptyState'

export default function FoodPage() {
  return (
    <>
      <ScreenHeader title="Food" />
      <EmptyState message="Food module coming soon — log daily meals and track calories vs TDEE." />
    </>
  )
}

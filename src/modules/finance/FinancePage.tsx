import ScreenHeader from '../../ui/ScreenHeader'
import EmptyState from '../../ui/EmptyState'

export default function FinancePage() {
  return (
    <>
      <ScreenHeader title="Finance" />
      <EmptyState message="Finance module coming soon — track transactions, scan receipts, and view category breakdowns." />
    </>
  )
}

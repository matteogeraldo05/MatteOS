import { useSearchParams } from 'react-router-dom'
import ClosetTab from './ClosetTab'
import WishlistTab from './WishlistTab'
import OutfitsTab from './OutfitsTab'

type WardrobeTab = 'closet' | 'wishlist' | 'outfits'

const TABS: { value: WardrobeTab; label: string }[] = [
  { value: 'closet', label: 'Closet' },
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'outfits', label: 'Outfits' },
]

function HangerIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Hook */}
      <path d="M12 3c1.5 0 3 1 3 3s-3 3-3 3" />
      {/* Shoulders + bar */}
      <path d="M12 9L3 19h18L12 9z" />
    </svg>
  )
}

export { HangerIcon }

export default function WardrobePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('tab')
  const tab: WardrobeTab = raw === 'wishlist' ? 'wishlist' : raw === 'outfits' ? 'outfits' : 'closet'

  function setTab(value: WardrobeTab) {
    if (value === 'closet') setSearchParams({}, { replace: true })
    else setSearchParams({ tab: value }, { replace: true })
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5">
          <span className="text-accent">
            <HangerIcon size={20} />
          </span>
          <h1 className="text-2xl font-medium text-text-primary">Wardrobe</h1>
        </div>

        {/* Tab strip */}
        <div className="flex mt-4 border-b border-border-subtle">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`
                pb-2 mr-6 text-sm font-medium border-b-2 -mb-px
                transition-colors duration-[120ms] ease-out
                ${tab === value
                  ? 'text-accent border-accent'
                  : 'text-text-muted border-transparent hover:text-text-secondary'}
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'closet' && <ClosetTab />}
      {tab === 'wishlist' && <WishlistTab />}
      {tab === 'outfits' && <OutfitsTab />}
    </>
  )
}

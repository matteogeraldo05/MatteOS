import { useAuth } from '../../auth/AuthProvider'

function getGreeting(tz: string): string {
  // Get current hour in user's timezone
  const hourStr = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    hour12: false,
  }).format(new Date())
  const hour = parseInt(hourStr, 10)

  if (hour >= 4 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 18) return 'Good afternoon'
  if (hour >= 18 && hour < 24) return 'Good evening'
  return 'Still up?'
}

function getTodayLabel(tz: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
}

export default function GreetingHeader() {
  const { profile } = useAuth()
  const tz = (profile?.timezone as string) ?? 'UTC'
  const displayName = (profile?.display_name as string) ?? ''

  const greeting = getGreeting(tz)
  const todayLabel = getTodayLabel(tz)

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-medium text-text-primary">
        {greeting}{displayName ? `, ${displayName}` : ''}
      </h1>
      <p className="text-sm text-text-secondary mt-1">{todayLabel}</p>
    </div>
  )
}

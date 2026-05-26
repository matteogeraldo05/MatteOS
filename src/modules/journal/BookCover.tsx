interface BookCoverProps {
  color: string
  texture: 'solid' | 'lines' | 'dots' | 'gradient'
  title: string
  author: string
  /** Size variant: 'card' for grid cards, 'detail' for book detail header */
  size?: 'card' | 'detail'
}

const TEXTURE_STYLES: Record<string, React.CSSProperties> = {
  solid: {},
  lines: {
    backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 6px, rgba(255,255,255,0.06) 6px 7px)',
  },
  dots: {
    backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1.5px)',
    backgroundSize: '10px 10px',
  },
  gradient: {
    // gradient is applied via the main background; use CSS var trick
  },
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

export default function BookCover({ color, texture, title, author, size = 'card' }: BookCoverProps) {
  const isGradient = texture === 'gradient'

  let background: string
  if (isGradient) {
    try {
      const rgb = hexToRgb(color)
      background = `linear-gradient(135deg, ${color} 0%, rgba(${rgb}, 0.5) 100%)`
    } catch {
      background = color
    }
  } else {
    background = color
  }

  const textureStyle = isGradient ? {} : TEXTURE_STYLES[texture] ?? {}

  const detailSize = size === 'detail' ? 'w-24 h-36' : 'w-full'
  const aspectClass = size === 'card' ? 'aspect-[2/3]' : ''

  return (
    <div
      className={`relative ${detailSize} ${aspectClass} rounded-md overflow-hidden flex-shrink-0`}
      style={{ background }}
    >
      {/* Texture overlay */}
      {!isGradient && texture !== 'solid' && (
        <div
          className="absolute inset-0"
          style={textureStyle}
          aria-hidden="true"
        />
      )}

      {/* Text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center gap-1">
        <span
          className="text-base font-bold leading-tight"
          style={{
            color: 'rgba(255,255,255,0.95)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </span>
        <span
          className="text-xs"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          {author}
        </span>
      </div>
    </div>
  )
}

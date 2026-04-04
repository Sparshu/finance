export function Skeleton({ width = '100%', height = 16, radius = 6, style = {} }) {
  return (
    <div style={{
      width, height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, var(--bg3) 25%, var(--card2) 50%, var(--bg3) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      ...style,
    }} />
  )
}

export function CardSkeleton({ lines = 2 }) {
  return (
    <div className="card" style={{ opacity: 0.6 }}>
      <Skeleton height={11} width={80} style={{ marginBottom: 12 }} />
      <Skeleton height={28} width={140} style={{ marginBottom: 8 }} />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} height={11} width={100} style={{ marginTop: 6 }} />
      ))}
    </div>
  )
}

export function RowSkeleton({ count = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
          <Skeleton width={38} height={38} radius={10} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <Skeleton height={13} width="60%" style={{ marginBottom: 6 }} />
            <Skeleton height={10} width="40%" />
          </div>
          <Skeleton height={14} width={80} />
        </div>
      ))}
    </div>
  )
}
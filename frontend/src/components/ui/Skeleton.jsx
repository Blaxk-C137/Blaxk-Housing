export default function Skeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={['animate-pulse rounded-lg bg-sand', className]
        .filter(Boolean)
        .join(' ')}
    />
  )
}

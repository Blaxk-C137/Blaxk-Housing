export default function EmptyState({ icon: Icon, title, body, action, className = '' }) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {Icon && (
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint text-brand">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </span>
      )}
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      {body && <p className="mt-1.5 max-w-xs text-sm text-stone">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

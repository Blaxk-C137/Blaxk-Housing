const TONES = {
  sage: 'bg-sage/10 text-sage-dark',
  brand: 'bg-brand-tint text-brand-dark',
  amber: 'bg-amber/10 text-amber-dark',
  stone: 'bg-sand text-stone-dark',
}

export default function StatCard({ icon: Icon, label, value, subValue, tone = 'stone', className = '' }) {
  return (
    <div
      className={[
        'rounded-card border border-line bg-white p-5 shadow-warm',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {Icon && (
        <span
          className={[
            'mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full',
            TONES[tone] || TONES.stone,
          ].join(' ')}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <p className="text-xs font-semibold uppercase tracking-wide text-stone">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
      {subValue && <p className="text-xs text-stone mt-0.5">{subValue}</p>}
    </div>
  )
}

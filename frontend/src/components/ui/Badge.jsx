const TONES = {
  sage: 'bg-sage/10 text-sage-dark border-sage/20',
  brand: 'bg-brand-tint text-brand-dark border-brand/20',
  amber: 'bg-amber/10 text-amber-dark border-amber/20',
  stone: 'bg-sand text-stone-dark border-line',
}

export default function Badge({ tone = 'stone', icon: Icon, className = '', children }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        TONES[tone] || TONES.stone,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </span>
  )
}

export function Chip({ active = false, onClick, className = '', children, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
        active
          ? 'bg-brand-tint text-brand-dark border-brand/30'
          : 'bg-white text-stone border-line hover:border-ink/30 hover:text-ink',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}

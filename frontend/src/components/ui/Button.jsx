import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary:
    'bg-brand text-white hover:bg-brand-dark active:scale-[0.98] rounded-full font-semibold transition-all shadow-warm',
  secondary:
    'bg-white text-ink border border-line hover:border-ink/30 rounded-full font-semibold transition-all',
  ghost: 'text-ink hover:bg-sand rounded-full font-medium transition-all',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] rounded-full font-semibold transition-all',
}

const SIZES = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-sm',
  lg: 'h-12 px-8 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={[
        'inline-flex items-center justify-center gap-2 transition-all',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        fullWidth ? 'w-full' : '',
        loading ? 'opacity-60 cursor-not-allowed' : '',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

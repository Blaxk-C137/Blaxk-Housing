import { useEffect, useState } from 'react'

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
}

function initialsFromName(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export default function Avatar({ name = '', src, size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [src])

  const showImage = src && !imgError

  return (
    <span
      className={[
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-tint font-semibold text-brand-dark',
        SIZES[size] || SIZES.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      title={name || undefined}
    >
      {showImage ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        (initialsFromName(name) || '?')
      )}
    </span>
  )
}

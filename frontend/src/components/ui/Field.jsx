import { useId } from 'react'
import { ChevronDown } from 'lucide-react'

const FIELD_BASE =
  'w-full rounded-xl border border-line bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-stone/70 transition-colors'

const FIELD_ERROR =
  'border-red-400 focus:border-red-500 focus:ring-red-200'

function FieldShell({ label, error, required, fieldId, className = '', children }) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
          {required && <span className="ml-0.5 text-brand">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p id={`${fieldId}-error`} className="mt-1.5 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

function fieldA11y(fieldId, error) {
  return {
    id: fieldId,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${fieldId}-error` : undefined,
  }
}

export function Input({ label, error, required, className = '', ...props }) {
  const fieldId = useId()
  return (
    <FieldShell label={label} error={error} required={required} fieldId={fieldId}>
      <input
        className={[
          FIELD_BASE,
          error ? FIELD_ERROR : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        required={required}
        {...fieldA11y(fieldId, error)}
        {...props}
      />
    </FieldShell>
  )
}

export function Textarea({ label, error, required, className = '', rows = 4, ...props }) {
  const fieldId = useId()
  return (
    <FieldShell label={label} error={error} required={required} fieldId={fieldId}>
      <textarea
        rows={rows}
        className={[
          FIELD_BASE,
          'resize-y',
          error ? FIELD_ERROR : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        required={required}
        {...fieldA11y(fieldId, error)}
        {...props}
      />
    </FieldShell>
  )
}

export function Select({ label, error, required, options = [], className = '', children, ...props }) {
  const fieldId = useId()
  return (
    <FieldShell label={label} error={error} required={required} fieldId={fieldId}>
      <div className="relative">
        <select
          className={[
            FIELD_BASE,
            'appearance-none pr-10',
            error ? FIELD_ERROR : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          required={required}
          {...fieldA11y(fieldId, error)}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone"
          aria-hidden="true"
        />
      </div>
    </FieldShell>
  )
}

const Field = { Input, Select, Textarea }

export default Field

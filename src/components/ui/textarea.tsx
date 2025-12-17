'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  charCount?: boolean
  maxLength?: number
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, charCount, maxLength, id, value, ...props }, ref) => {
    const textareaId = id || props.name
    const currentLength = typeof value === 'string' ? value.length : 0

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium">
            {label}
            {props.required && <span className="text-accent-red ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          maxLength={maxLength}
          className={cn(
            'w-full min-h-[100px]',
            error && 'border-accent-red',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...props}
        />
        <div className="flex justify-between text-xs">
          <div>
            {error && (
              <p id={`${textareaId}-error`} className="text-accent-red">
                {error}
              </p>
            )}
            {hint && !error && (
              <p id={`${textareaId}-hint`} className="text-text-muted">
                {hint}
              </p>
            )}
          </div>
          {charCount && maxLength && (
            <span className={cn('text-text-muted', currentLength > maxLength * 0.9 && 'text-accent-red')}>
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }

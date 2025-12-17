import { cn } from '@/lib/utils'

interface TechStackTagsProps {
  tags: string[]
  onRemove?: (tag: string) => void
  editable?: boolean
  className?: string
}

export function TechStackTags({ tags, onRemove, editable, className }: TechStackTagsProps) {
  if (tags.length === 0) return null

  return (
    <div className={cn('tech-tags', className)}>
      {tags.map((tag) => (
        <span key={tag} className="tech-tag">
          {tag}
          {editable && onRemove && (
            <button
              type="button"
              onClick={() => onRemove(tag)}
              className="ml-1 text-text-muted hover:text-accent-red"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          )}
        </span>
      ))}
    </div>
  )
}

// Compact inline version
export function TechStackInline({ tags, max = 3 }: { tags: string[]; max?: number }) {
  const visible = tags.slice(0, max)
  const remaining = tags.length - max

  return (
    <span className="font-mono text-xs text-text-muted">
      [{visible.join(', ')}
      {remaining > 0 && ` +${remaining}`}]
    </span>
  )
}

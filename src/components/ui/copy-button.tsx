'use client'

import { useState } from 'react'
import { Button } from './button'

interface CopyButtonProps {
  text: string
  className?: string
  label?: string
}

export function CopyButton({ text, className, label = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Button
      onClick={handleCopy}
      variant="secondary"
      size="sm"
      className={className}
    >
      {copied ? 'Copied!' : label}
    </Button>
  )
}

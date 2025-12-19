'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AccordionItemProps {
  question: string
  answer: React.ReactNode
  defaultOpen?: boolean
}

export function AccordionItem({ question, answer, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="card mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left font-medium p-4"
        aria-expanded={isOpen}
      >
        <span className="text-text-bone">{question}</span>
        <span
          className={cn(
            'text-text-muted transition-transform duration-200 ml-4 flex-shrink-0',
            isOpen && 'rotate-180'
          )}
        >
          ▼
        </span>
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[2000px]' : 'max-h-0'
        )}
      >
        <div className="px-4 pb-4 pt-0 border-t border-border-crypt">
          <div className="pt-4 text-text-secondary">{answer}</div>
        </div>
      </div>
    </div>
  )
}

interface AccordionProps {
  items: AccordionItemProps[]
}

export function Accordion({ items }: AccordionProps) {
  return (
    <div>
      {items.map((item, index) => (
        <AccordionItem key={index} {...item} />
      ))}
    </div>
  )
}

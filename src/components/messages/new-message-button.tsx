'use client'

import { useState } from 'react'
import { NewMessageModal } from './new-message-modal'

export function NewMessageButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary text-sm px-4 py-2"
      >
        + New Message
      </button>
      <NewMessageModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}

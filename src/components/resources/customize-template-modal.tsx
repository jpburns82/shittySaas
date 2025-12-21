'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'

interface Listing {
  id: string
  title: string
  category: { name: string } | string
  priceInCents: number
  status: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  isTemplate?: boolean
}

interface CustomizeTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  templateType: string
  templateName: string
}

export function CustomizeTemplateModal({
  isOpen,
  onClose,
  templateType,
  templateName,
}: CustomizeTemplateModalProps) {
  const [listings, setListings] = useState<Listing[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [fetchingListings, setFetchingListings] = useState(false)
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [generatedTemplate, setGeneratedTemplate] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasFetched = useRef(false)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch user's listings and show greeting when modal opens
  useEffect(() => {
    if (!isOpen || hasFetched.current) return
    hasFetched.current = true

    setFetchingListings(true)
    setMessages([{
      role: 'assistant',
      content: `I'll help you customize the "${templateName}" template. Which of your projects would you like to use this for?`
    }])
    setSelectedListingId(null)
    setGeneratedTemplate('')
    setInput('')

    fetch('/api/listings/my')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setListings(data.data)
          if (data.data.length === 0) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: "You don't have any listings yet. No problem! I can help you:\n\n• Create a generic template to use when you list your project\n• Answer questions about selling on UndeadList\n• Help you plan your listing\n\nClick 'Create generic template' below, or type a question!"
            }])
          }
        }
      })
      .catch(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I couldn't load your listings, but I can still help you create a generic template."
        }])
      })
      .finally(() => {
        setFetchingListings(false)
      })
  }, [isOpen, templateName])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasFetched.current = false
      setMessages([])
      setSelectedListingId(null)
      setGeneratedTemplate('')
      setInput('')
      setListings([])
    }
  }, [isOpen])

  const getCategoryName = (category: { name: string } | string): string => {
    return typeof category === 'object' ? category.name : category
  }

  const handleSelectListing = async (listing: Listing) => {
    setSelectedListingId(listing.id)
    const categoryName = getCategoryName(listing.category)
    const price = (listing.priceInCents / 100).toFixed(2)

    // Add user's selection to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: `I'd like to use "${listing.title}"`
    }])

    // Show Gemini's acknowledgment
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Great choice! "${listing.title}" is a ${categoryName} project listed at $${price}. Let me customize the ${templateType} template for you...`
    }])

    // Generate the template
    await generateTemplate(listing.id)
  }

  const handleNoListing = async () => {
    setMessages(prev => [...prev, {
      role: 'user',
      content: "I'll create a generic template without a specific listing"
    }])

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `No problem! I'll create a generic ${templateType} template that you can fill in with your project details...`
    }])

    await generateTemplate(null)
  }

  const generateTemplate = async (listingId: string | null) => {
    setIsLoading(true)

    try {
      const res = await fetch('/api/templates/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType,
          listingId,
          messages: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      })

      const data = await res.json()

      if (data.success) {
        setGeneratedTemplate(data.customizedTemplate)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.customizedTemplate,
          isTemplate: true
        }])
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "Here's your customized template! Items in [BRACKETS] still need your input. Feel free to ask if you'd like me to adjust anything."
        }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${data.error || 'Failed to customize template'}. Please try again.`
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't connect to the AI service. Please try again later."
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')

    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage
    }])

    setIsLoading(true)

    try {
      const res = await fetch('/api/templates/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType,
          listingId: selectedListingId,
          messages: [...messages, { role: 'user', content: userMessage }].map(m => ({
            role: m.role,
            content: m.content
          })),
          isFollowUp: true
        }),
      })

      const data = await res.json()

      if (data.success) {
        if (data.customizedTemplate) {
          setGeneratedTemplate(data.customizedTemplate)
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.customizedTemplate,
            isTemplate: true
          }])
        } else if (data.response) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.response
          }])
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "Sorry, I couldn't process that request. Please try again."
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, something went wrong. Please try again."
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Customize: ${templateName}`}
      size="lg"
    >
      <div className="flex flex-col h-[500px]">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-accent-electric/20 text-text-primary'
                    : message.isTemplate
                    ? 'bg-bg-crypt border border-border-crypt'
                    : 'bg-bg-accent text-text-primary'
                }`}
              >
                {message.isTemplate ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-text-muted">Generated Template</span>
                      <CopyButton text={message.content} label="Copy" />
                    </div>
                    <pre className="text-xs whitespace-pre-wrap font-mono overflow-x-auto max-h-64 overflow-y-auto">
                      {message.content}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-bg-accent rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-electric rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-accent-electric rounded-full animate-pulse delay-100" />
                  <div className="w-2 h-2 bg-accent-electric rounded-full animate-pulse delay-200" />
                </div>
              </div>
            </div>
          )}

          {/* Listing selection buttons - show after initial greeting */}
          {!fetchingListings && !selectedListingId && !generatedTemplate && (
            <div className="space-y-2 mt-4">
              {listings.length > 0 && (
                <>
                  <p className="text-sm text-text-muted mb-2">Select a project:</p>
                  {listings.map((listing) => (
                    <button
                      key={listing.id}
                      onClick={() => handleSelectListing(listing)}
                      disabled={isLoading}
                      className="w-full text-left p-3 bg-bg-crypt border border-border-crypt rounded-lg hover:border-accent-electric transition-colors disabled:opacity-50"
                    >
                      <div className="font-medium text-sm">{listing.title}</div>
                      <div className="text-xs text-text-muted">
                        {getCategoryName(listing.category)} • ${(listing.priceInCents / 100).toFixed(2)}
                      </div>
                    </button>
                  ))}
                  <div className="text-center text-text-muted text-xs my-2">or</div>
                </>
              )}
              <button
                onClick={handleNoListing}
                disabled={isLoading}
                className="w-full p-3 border border-accent-electric text-accent-electric rounded-lg hover:bg-accent-electric/10 transition-colors disabled:opacity-50"
              >
                {listings.length > 0 ? 'Create generic template (no specific listing)' : 'Create generic template'}
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - show after messages load */}
        {messages.length > 0 && !fetchingListings && (
          <div className="border-t border-border-light pt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={generatedTemplate ? "Ask me to adjust the template..." : "Type a question or click a button above..."}
                className="input flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                variant="primary"
                size="sm"
              >
                Send
              </Button>
            </div>
          </div>
        )}

        {/* Close button */}
        <div className="flex justify-end mt-4 pt-4 border-t border-border-light">
          <Button onClick={onClose}>
            {generatedTemplate ? 'Done' : 'Cancel'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

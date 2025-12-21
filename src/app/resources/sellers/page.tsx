'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CopyButton } from '@/components/ui/copy-button'
import { AccordionItem } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { CustomizeTemplateModal } from '@/components/resources/customize-template-modal'
import { RecommendedServices } from '@/components/resources/recommended-services'

const assetTransferTemplate = `ASSET TRANSFER AGREEMENT

Date: [DATE]
Seller: [SELLER NAME/USERNAME]
Buyer: [BUYER NAME/USERNAME]
Project: [PROJECT NAME]
Sale Price: $[AMOUNT]

ASSETS INCLUDED:
[ ] Source code repository
[ ] Domain name(s): [LIST]
[ ] Database and user data
[ ] Documentation
[ ] Trademarks/branding
[ ] Social media accounts
[ ] Other: [SPECIFY]

SELLER CONFIRMS:
- I am the legal owner of all assets listed above
- The code does not infringe on any third-party rights
- I will transfer all assets within [X] days of payment
- I will provide reasonable support for [X] days after transfer

BUYER CONFIRMS:
- I have reviewed the project and accept it as-is
- I understand this sale is final
- I will confirm receipt once transfer is complete

Seller Signature: ______________________ Date: ______
Buyer Signature: _______________________ Date: ______

---
This is a template only. For sales over $500, consider using a formal escrow service.`

const listingDescriptionTemplate = `## About This Project

[1-2 sentences: What does it do? What problem does it solve?]

## Features

- [Key feature 1]
- [Key feature 2]
- [Key feature 3]
- [Key feature 4]

## Tech Stack

- Frontend: [React/Vue/Svelte/etc.]
- Backend: [Node.js/Python/Go/etc.]
- Database: [PostgreSQL/MongoDB/etc.]
- Hosting: [Vercel/Railway/etc.]
- Other: [Auth, payments, etc.]

## What's Included

- Complete source code
- README with setup instructions
- Environment variables template
- Database schema/migrations
- [X] days of email support

## Current Status

[Be honest: Is it production-ready? MVP? Needs work?]

## Why I'm Selling

[Brief, honest explanation — "moved on", "no time", "building something else"]

## Demo

[Link to live demo if available, or screenshots]

## Questions?

Message me before buying if you have any questions.`

const pricingGuide = `PRICING YOUR PROJECT

Factors to consider:
- Hours spent building (but don't overvalue your time)
- Does it have users or revenue?
- How complete is it (MVP vs polished)?
- Market demand for this type of project
- What similar projects sell for

ROUGH GUIDE BY TYPE:

Scripts & Snippets .............. $5 - $50
  Small utilities, one-off scripts, code snippets

Templates & Boilerplates ....... $20 - $200
  Starter kits, UI templates, project scaffolds

Complete Apps (no users) ...... $100 - $1,000
  Full applications without traction

Browser Extensions ............. $50 - $500
  Chrome/Firefox extensions, depends on complexity

Apps with Users ............... $500 - $5,000
  Projects with active users but no/low revenue

Apps with Revenue ........... $1,000 - $10,000+
  Usually priced at 12-36x monthly revenue

TIPS:

1. Start lower than you think — you can always raise price
2. Consider "pay what you want" with a minimum for experimental projects
3. For high-value sales ($500+), expect buyers to ask questions first
4. Price based on VALUE to buyer, not TIME you spent
5. Look at similar listings on UndeadList for market rates`

const handoffChecklist = `HANDOFF CHECKLIST

What to provide when transferring your project:

SOURCE CODE
[ ] GitHub/GitLab repo access (transfer or invite)
[ ] Or: ZIP file with complete codebase
[ ] All branches (main, dev, etc.)
[ ] Remove any personal API keys from code

DOCUMENTATION
[ ] README with setup instructions
[ ] Architecture overview (if complex)
[ ] Known issues or limitations
[ ] Any important context about decisions made

CONFIGURATION
[ ] List of all environment variables
[ ] Example .env file (without real values)
[ ] Third-party service accounts needed
[ ] API keys that need to be created

DATABASE
[ ] Schema/migrations
[ ] Seed data (if applicable)
[ ] Database export (for existing data)
[ ] Connection instructions

DOMAINS & HOSTING
[ ] Domain transfer instructions
[ ] Current hosting setup details
[ ] DNS configuration
[ ] SSL certificate info

SUPPORT
[ ] Brief walkthrough call (Loom video works great)
[ ] Your contact for questions
[ ] Support period (30 days recommended)

BONUS (MAKES YOU LOOK GOOD)
[ ] Video walkthrough of the codebase
[ ] Deployment instructions
[ ] Common issues and solutions
[ ] Ideas for future features`

interface ModalState {
  templateType: string
  templateName: string
}

export default function SellersResourcesPage() {
  const [modalOpen, setModalOpen] = useState<ModalState | null>(null)

  const openModal = (templateType: string, templateName: string) => {
    setModalOpen({ templateType, templateName })
  }

  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link href="/resources" className="text-text-muted hover:text-text-primary text-sm mb-4 inline-block">
          &larr; Back to Resources
        </Link>

        <h1 className="font-display text-2xl mb-2 text-accent-pink">For Sellers</h1>
        <p className="text-text-muted mb-8">
          Templates and guides to help you list and sell your projects successfully.
        </p>

        {/* Asset Transfer Agreement */}
        <AccordionItem
          question="Asset Transfer Agreement"
          defaultOpen={false}
          answer={
            <div className="space-y-4">
              <p className="text-sm text-text-muted">
                A simple template for documenting project transfers. For $500+ sales,
                consider a formal escrow service.
              </p>
              <pre className="bg-bg-crypt p-4 text-xs overflow-x-auto border border-border-crypt whitespace-pre-wrap font-mono">
                {assetTransferTemplate}
              </pre>
              <div className="flex gap-2">
                <CopyButton text={assetTransferTemplate} label="Copy Template" />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openModal('Asset Transfer Agreement', 'Asset Transfer Agreement')}
                >
                  Customize with AI
                </Button>
              </div>
            </div>
          }
        />

        {/* Listing Description Template */}
        <AccordionItem
          question="Listing Description Template"
          defaultOpen={false}
          answer={
            <div className="space-y-4">
              <p className="text-sm text-text-muted">
                Structure your listing for maximum clarity. Lead with what it does, not how it&apos;s built.
              </p>
              <pre className="bg-bg-crypt p-4 text-xs overflow-x-auto border border-border-crypt whitespace-pre-wrap font-mono">
                {listingDescriptionTemplate}
              </pre>
              <div className="flex gap-2">
                <CopyButton text={listingDescriptionTemplate} label="Copy Template" />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openModal('Listing Description', 'Listing Description Template')}
                >
                  Customize with AI
                </Button>
              </div>
            </div>
          }
        />

        {/* Pricing Guide */}
        <AccordionItem
          question="Pricing Your Project"
          defaultOpen={false}
          answer={
            <div className="space-y-4">
              <p className="text-sm text-text-muted">
                A rough guide to pricing different types of projects.
              </p>
              <pre className="bg-bg-crypt p-4 text-xs overflow-x-auto border border-border-crypt whitespace-pre-wrap font-mono">
                {pricingGuide}
              </pre>
              <div className="flex gap-2">
                <CopyButton text={pricingGuide} label="Copy Template" />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openModal('Pricing Guide', 'Pricing Your Project')}
                >
                  Customize with AI
                </Button>
              </div>
            </div>
          }
        />

        {/* Handoff Checklist */}
        <AccordionItem
          question="Handoff Checklist"
          defaultOpen={false}
          answer={
            <div className="space-y-4">
              <p className="text-sm text-text-muted">
                What to include when transferring your project to a buyer.
              </p>
              <pre className="bg-bg-crypt p-4 text-xs overflow-x-auto border border-border-crypt whitespace-pre-wrap font-mono">
                {handoffChecklist}
              </pre>
              <div className="flex gap-2">
                <CopyButton text={handoffChecklist} label="Copy Template" />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openModal('Handoff Checklist', 'Handoff Checklist')}
                >
                  Customize with AI
                </Button>
              </div>
            </div>
          }
        />

        {/* AI Feature Note */}
        <div className="card bg-bg-crypt border-accent-electric mt-6">
          <p className="text-sm text-text-muted mb-0">
            <span className="text-accent-electric font-mono">NEW:</span>{' '}
            Click &quot;Customize with AI&quot; on any template to auto-fill it based on your listing details.
          </p>
        </div>

        <RecommendedServices />

        {/* Back Link */}
        <div className="mt-8">
          <Link href="/resources" className="text-text-muted hover:text-text-primary">
            &larr; Back to Resources
          </Link>
        </div>
      </div>

      {/* Customize Template Modal */}
      {modalOpen && (
        <CustomizeTemplateModal
          isOpen={true}
          onClose={() => setModalOpen(null)}
          templateType={modalOpen.templateType}
          templateName={modalOpen.templateName}
        />
      )}
    </div>
  )
}

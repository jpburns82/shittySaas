'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CopyButton } from '@/components/ui/copy-button'
import { AccordionItem } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { CustomizeTemplateModal } from '@/components/resources/customize-template-modal'
import { RecommendedServices } from '@/components/resources/recommended-services'

const dueDiligenceChecklist = `BUYER DUE DILIGENCE CHECKLIST

Before purchasing, verify:

BASICS
[ ] Did you message the seller with questions?
[ ] Is the price reasonable for what you're getting?
[ ] Do you understand what's included vs. not included?
[ ] Is the seller responsive and professional?

TECHNICAL
[ ] Can you actually run this tech stack?
[ ] Do you know the languages/frameworks used?
[ ] Are dependencies reasonably up to date?
[ ] Check for obvious security red flags
[ ] Is there a live demo you can test?

LEGAL
[ ] Does the seller own this code?
[ ] Are there any third-party licenses to consider?
[ ] Are you buying full rights or just a license?
[ ] For $500+ purchases: Consider escrow service

PRACTICAL
[ ] Do you have a plan for this project?
[ ] Can you maintain it yourself (or afford to hire)?
[ ] Is this a "bright shiny object" or genuine need?
[ ] What's your timeline to launch/use it?

RED FLAGS
[ ] Seller won't answer questions
[ ] No screenshots or demo
[ ] Price seems too good to be true
[ ] Vague about what's included
[ ] Listing copied from another site
[ ] Multiple "URGENT" or pressure tactics

REMEMBER: All sales are final. Do your homework.`

const buyerQuestionsTemplate = `QUESTIONS TO ASK BEFORE BUYING

About the Project:
[ ] Why are you selling this project?
[ ] How long have you been working on it?
[ ] What's the current state - MVP, beta, production?
[ ] Are there any known bugs or technical debt?
[ ] What would you do differently if starting over?

Technical Questions:
[ ] Can I see a live demo or staging environment?
[ ] What's required to run this locally?
[ ] Are all dependencies up to date?
[ ] Any third-party API keys I'll need to get myself?
[ ] Is there existing documentation?

Business Questions:
[ ] Does this have any existing users/customers?
[ ] Any recurring revenue or active subscriptions?
[ ] Are there any ongoing costs (hosting, APIs, etc.)?
[ ] Any legal considerations (licenses, terms, privacy policy)?

Support & Handoff:
[ ] What support do you offer after purchase?
[ ] How will the code/assets be transferred?
[ ] Will you be available for questions after the sale?
[ ] Can we do a video walkthrough of the codebase?

Red Flags to Watch For:
- Seller won't answer questions or is vague
- No screenshots or demo available
- Price seems too good to be true
- Pressure to buy quickly ("URGENT", "limited time")
- Listing copied from another site
- Seller has no other history on the platform`

const postPurchaseTemplate = `POST-PURCHASE CHECKLIST

Immediately After Purchase:
[ ] Download all files from the purchase
[ ] Verify you received everything listed (source code, docs, assets)
[ ] Save copies in multiple locations (local + cloud backup)

Security First:
[ ] Change all passwords and API keys
[ ] Rotate any secrets in environment files
[ ] Update database credentials
[ ] Check for hardcoded credentials in the code

Technical Setup:
[ ] Read the README and setup instructions
[ ] Install dependencies and run locally
[ ] Verify the project builds without errors
[ ] Test core functionality works

Account Transfers (if applicable):
[ ] Domain name transfer initiated
[ ] Hosting account access transferred
[ ] Third-party service accounts (Stripe, AWS, etc.)
[ ] Social media accounts
[ ] Email lists or newsletter subscribers

Documentation:
[ ] Review all provided documentation
[ ] Note any gaps or questions
[ ] Schedule walkthrough call with seller (if included)

Within 7 Days:
[ ] Confirm receipt with seller via messages
[ ] Report any missing items or issues
[ ] Leave feedback/rating for the seller
[ ] Reach out for support if included in purchase`

interface ModalState {
  templateType: string
  templateName: string
}

export default function BuyersResourcesPage() {
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

        <h1 className="font-display text-2xl mb-2 text-accent-cyan">For Buyers</h1>
        <p className="text-text-muted mb-8">
          Checklists and guides to help you make smart purchases and smooth transitions.
        </p>

        {/* Buyer Due Diligence */}
        <AccordionItem
          question="Buyer Due Diligence Checklist"
          defaultOpen={false}
          answer={
            <div className="space-y-4">
              <p className="text-sm text-text-muted">
                What to verify before purchasing any project.
              </p>
              <pre className="bg-bg-crypt p-4 text-xs overflow-x-auto border border-border-crypt whitespace-pre-wrap font-mono">
                {dueDiligenceChecklist}
              </pre>
              <div className="flex gap-2">
                <CopyButton text={dueDiligenceChecklist} label="Copy Template" />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openModal('Buyer Due Diligence', 'Buyer Due Diligence Checklist')}
                >
                  Customize with AI
                </Button>
              </div>
            </div>
          }
        />

        {/* Questions to Ask Sellers */}
        <AccordionItem
          question="Questions to Ask Sellers"
          defaultOpen={false}
          answer={
            <div className="space-y-4">
              <p className="text-sm text-text-muted">
                Important questions to ask before making a purchase decision.
              </p>
              <pre className="bg-bg-crypt p-4 text-xs overflow-x-auto border border-border-crypt whitespace-pre-wrap font-mono">
                {buyerQuestionsTemplate}
              </pre>
              <div className="flex gap-2">
                <CopyButton text={buyerQuestionsTemplate} label="Copy Template" />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openModal('Questions to Ask', 'Questions to Ask Sellers')}
                >
                  Customize with AI
                </Button>
              </div>
            </div>
          }
        />

        {/* Post-Purchase Checklist */}
        <AccordionItem
          question="Post-Purchase Checklist"
          defaultOpen={false}
          answer={
            <div className="space-y-4">
              <p className="text-sm text-text-muted">
                What to do after you&apos;ve bought a project to ensure a smooth transition.
              </p>
              <pre className="bg-bg-crypt p-4 text-xs overflow-x-auto border border-border-crypt whitespace-pre-wrap font-mono">
                {postPurchaseTemplate}
              </pre>
              <div className="flex gap-2">
                <CopyButton text={postPurchaseTemplate} label="Copy Template" />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openModal('Post-Purchase Checklist', 'Post-Purchase Checklist')}
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
            Click &quot;Customize with AI&quot; on any template to get personalized guidance.
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

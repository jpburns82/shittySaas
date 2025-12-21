'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select } from '../ui/select'
import { ImageUpload } from '../ui/image-upload'
import { TechStackTags } from './tech-stack-tags'
import { FileUpload } from './file-upload'
import { TECH_STACK_OPTIONS, LISTING_LIMITS } from '@/lib/constants'
import type { Category, ListingFile } from '@prisma/client'
import {
  Cloud, Smartphone, Puzzle, Zap, Package,
  Bot, Brain, FileText, Globe, Palette, Gamepad2,
  Users, Mail, MessageCircle, Folder, Monitor,
  Server, Terminal, Bitcoin, Gem, TrendingUp, FolderCode
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Map category slugs to Lucide icons
const categoryIconMap: Record<string, LucideIcon> = {
  'saas': Cloud,
  'desktop': Monitor,
  'mobile': Smartphone,
  'extensions': Puzzle,
  'apis': Server,
  'boilerplates': FolderCode,
  'scripts': Terminal,
  'ai': Brain,
  'cms': FileText,
  'domains': Globe,
  'design': Palette,
  'games': Gamepad2,
  'social-media': Users,
  'newsletters': Mail,
  'communities': MessageCircle,
  'crypto': Bitcoin,
  'nft': Gem,
  'defi': TrendingUp,
  'other': Folder,
}

// Helper to get icon component for a category
function getCategoryIcon(slug: string, size: number = 16) {
  const IconComponent = categoryIconMap[slug] || Folder
  return <IconComponent size={size} className="text-text-muted" />
}

// Custom CategorySelect with Lucide icons
interface CategorySelectProps {
  categories: Category[]
  value: string
  onChange: (value: string) => void
  error?: string
}

function CategorySelect({ categories, value, onChange, error }: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedCategory = categories.find(c => c.id === value)

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1.5">
        Category <span className="text-accent-pink">*</span>
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 bg-bg-grave border ${error ? 'border-accent-pink' : 'border-border-dark'} rounded text-left flex items-center gap-2 hover:border-border-light transition-colors`}
      >
        {selectedCategory ? (
          <>
            {getCategoryIcon(selectedCategory.slug)}
            <span>{selectedCategory.name}</span>
          </>
        ) : (
          <span className="text-text-muted">Select a category</span>
        )}
        <span className="ml-auto text-text-muted">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-bg-grave border border-border-dark rounded shadow-lg max-h-60 overflow-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                onChange(category.id)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-bg-tombstone transition-colors ${value === category.id ? 'bg-bg-tombstone' : ''}`}
            >
              {getCategoryIcon(category.slug)}
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-accent-pink mt-1">{error}</p>}
    </div>
  )
}

interface FormErrorResponse {
  success: false
  errors: Record<string, string[]>
  message: string
}

interface ListingFormProps {
  categories: Category[]
  initialData?: Partial<ListingFormData>
  existingFiles?: ListingFile[]
  listingId?: string
  onSubmit: (data: ListingFormData) => Promise<FormErrorResponse | void>
  submitLabel?: string
  loading?: boolean
}

export interface ListingFormData {
  title: string
  shortDescription: string
  description: string
  categoryId: string
  priceType: 'FREE' | 'FIXED' | 'PAY_WHAT_YOU_WANT' | 'CONTACT'
  priceInCents?: number
  minPriceInCents?: number
  techStack: string[]
  thumbnailUrl?: string
  screenshots: string[]
  liveUrl?: string
  repoUrl?: string
  videoUrl?: string
  deliveryMethod: 'INSTANT_DOWNLOAD' | 'REPOSITORY_ACCESS' | 'MANUAL_TRANSFER' | 'DOMAIN_TRANSFER'
  deliveryTimeframeDays: number
  includesSourceCode: boolean
  includesDatabase: boolean
  includesDocs: boolean
  includesDeployGuide: boolean
  includesSupport: boolean
  supportDays?: number
  includesUpdates: boolean
  includesCommercialLicense: boolean
  includesWhiteLabel: boolean
  whatsIncludedCustom?: string
}

const defaultFormData: ListingFormData = {
  title: '',
  shortDescription: '',
  description: '',
  categoryId: '',
  priceType: 'FIXED',
  priceInCents: 0,
  techStack: [],
  thumbnailUrl: '',
  screenshots: [],
  deliveryMethod: 'INSTANT_DOWNLOAD',
  deliveryTimeframeDays: 0,
  includesSourceCode: true,
  includesDatabase: false,
  includesDocs: false,
  includesDeployGuide: false,
  includesSupport: false,
  includesUpdates: false,
  includesCommercialLicense: true,
  includesWhiteLabel: false,
}

export function ListingForm({
  categories,
  initialData,
  existingFiles = [],
  listingId,
  onSubmit,
  submitLabel = 'Create Listing',
  loading,
}: ListingFormProps) {
  const [formData, setFormData] = useState<ListingFormData>({
    ...defaultFormData,
    ...initialData,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<ListingFile[]>(existingFiles)

  const handleChange = (field: keyof ListingFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when field changes
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
    // Clear general error when user makes changes
    if (generalError) {
      setGeneralError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})
    setGeneralError('')

    try {
      const result = await onSubmit(formData)

      // Check if we got an error response
      if (result && !result.success) {
        // Map field errors
        const fieldErrors: Record<string, string> = {}
        for (const [field, messages] of Object.entries(result.errors)) {
          if (messages?.[0]) {
            fieldErrors[field] = messages[0]
          }
        }
        setErrors(fieldErrors)

        // Set general error message
        if (result.message) {
          setGeneralError(result.message)
        }
      }
      // Success = redirect happens automatically via server action
    } catch (err) {
      // Handle unexpected errors
      setGeneralError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTechTag = (tag: string) => {
    if (formData.techStack.length < LISTING_LIMITS.MAX_TECH_STACK_TAGS && !formData.techStack.includes(tag)) {
      handleChange('techStack', [...formData.techStack, tag])
    }
  }

  const removeTechTag = (tag: string) => {
    handleChange('techStack', formData.techStack.filter((t) => t !== tag))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Error Banner */}
      {generalError && (
        <div className="p-3 bg-accent-red/10 border border-accent-red text-accent-red text-sm">
          {generalError}
        </div>
      )}

      {/* Basic Info */}
      <fieldset className="space-y-4">
        <legend className="font-display text-lg border-b border-border-dark pb-2 mb-4">
          Basic Info
        </legend>

        <Input
          label="Title"
          name="title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          maxLength={LISTING_LIMITS.TITLE_MAX_LENGTH}
          placeholder="My Awesome SaaS"
          error={errors.title}
          required
        />

        <Textarea
          label="Short Description"
          name="shortDescription"
          value={formData.shortDescription}
          onChange={(e) => handleChange('shortDescription', e.target.value)}
          maxLength={LISTING_LIMITS.SHORT_DESC_MAX_LENGTH}
          placeholder="A brief summary that appears in listing cards..."
          error={errors.shortDescription}
          charCount
          required
        />

        <Textarea
          label="Full Description"
          name="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          maxLength={LISTING_LIMITS.DESCRIPTION_MAX_LENGTH}
          placeholder="Full details about your project. Markdown supported..."
          hint="Supports Markdown"
          error={errors.description}
          className="min-h-[200px]"
          required
        />

        <CategorySelect
          categories={categories}
          value={formData.categoryId}
          onChange={(value) => handleChange('categoryId', value)}
          error={errors.categoryId}
        />
      </fieldset>

      {/* Images */}
      <fieldset className="space-y-4">
        <legend className="font-display text-lg border-b border-border-dark pb-2 mb-4">
          Images
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Thumbnail Image
            </label>
            <p className="text-xs text-text-muted mb-3">
              Main image for listing cards. 16:9 ratio.
            </p>
            <ImageUpload
              value={formData.thumbnailUrl}
              onChange={(url) => handleChange('thumbnailUrl', url as string)}
              uploadEndpoint="/api/listings/screenshots"
              aspectRatio="16:9"
              maxSize={5 * 1024 * 1024}
              placeholder="Drop thumbnail or click"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Screenshots ({formData.screenshots.length}/6)
            </label>
            <p className="text-xs text-text-muted mb-3">
              Additional images. Max 6.
            </p>
            <ImageUpload
              value={formData.screenshots}
              onChange={(urls) => handleChange('screenshots', urls as string[])}
              uploadEndpoint="/api/listings/screenshots"
              multiple
              maxFiles={6}
              maxSize={5 * 1024 * 1024}
              placeholder="Drop screenshots or click"
            />
          </div>
        </div>
      </fieldset>

      {/* Pricing */}
      <fieldset className="space-y-4">
        <legend className="font-display text-lg border-b border-border-dark pb-2 mb-4">
          Pricing
        </legend>

        <Select
          label="Price Type"
          name="priceType"
          value={formData.priceType}
          onChange={(e) => handleChange('priceType', e.target.value as ListingFormData['priceType'])}
          options={[
            { value: 'FREE', label: 'Free' },
            { value: 'FIXED', label: 'Fixed Price' },
            { value: 'PAY_WHAT_YOU_WANT', label: 'Pay What You Want' },
            { value: 'CONTACT', label: 'Contact Me' },
          ]}
          required
        />

        {formData.priceType === 'FIXED' && (
          <Input
            label="Price (USD)"
            name="price"
            type="number"
            min="0"
            step="1"
            value={formData.priceInCents ? formData.priceInCents / 100 : ''}
            onChange={(e) => handleChange('priceInCents', Math.round(parseFloat(e.target.value) * 100))}
            placeholder="49"
            error={errors.priceInCents}
          />
        )}

        {formData.priceType === 'PAY_WHAT_YOU_WANT' && (
          <Input
            label="Minimum Price (USD, 0 for free)"
            name="minPrice"
            type="number"
            min="0"
            step="1"
            value={formData.minPriceInCents ? formData.minPriceInCents / 100 : ''}
            onChange={(e) => handleChange('minPriceInCents', Math.round(parseFloat(e.target.value) * 100))}
            placeholder="0"
          />
        )}
      </fieldset>

      {/* Tech Stack */}
      <fieldset className="space-y-4">
        <legend className="font-display text-lg border-b border-border-dark pb-2 mb-4">
          Tech Stack
        </legend>

        <div>
          <label className="block text-sm font-medium mb-2">
            Technologies ({formData.techStack.length}/{LISTING_LIMITS.MAX_TECH_STACK_TAGS})
          </label>

          <TechStackTags tags={formData.techStack} onRemove={removeTechTag} editable />

          <Select
            name="addTech"
            value=""
            onChange={(e) => {
              if (e.target.value) addTechTag(e.target.value)
            }}
            options={TECH_STACK_OPTIONS.filter((t) => !formData.techStack.includes(t)).map((t) => ({
              value: t,
              label: t,
            }))}
            placeholder="+ Add technology..."
            className="mt-2"
          />
        </div>
      </fieldset>

      {/* Links */}
      <fieldset className="space-y-4">
        <legend className="font-display text-lg border-b border-border-dark pb-2 mb-4">
          Links
        </legend>

        <Input
          label="Live Demo URL"
          name="liveUrl"
          type="url"
          value={formData.liveUrl || ''}
          onChange={(e) => handleChange('liveUrl', e.target.value)}
          placeholder="https://demo.yourproject.com"
        />

        <Input
          label="Repository URL"
          name="repoUrl"
          type="url"
          value={formData.repoUrl || ''}
          onChange={(e) => handleChange('repoUrl', e.target.value)}
          placeholder="https://github.com/you/project"
        />

        <Input
          label="Video URL"
          name="videoUrl"
          type="url"
          value={formData.videoUrl || ''}
          onChange={(e) => handleChange('videoUrl', e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
        />
      </fieldset>

      {/* What's Included */}
      <fieldset className="space-y-4">
        <legend className="font-display text-lg border-b border-border-dark pb-2 mb-4">
          What&apos;s Included
        </legend>

        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'includesSourceCode', label: 'Full Source Code' },
            { key: 'includesDatabase', label: 'Database Schema' },
            { key: 'includesDocs', label: 'Documentation' },
            { key: 'includesDeployGuide', label: 'Deployment Guide' },
            { key: 'includesSupport', label: 'Email Support' },
            { key: 'includesUpdates', label: 'Future Updates' },
            { key: 'includesCommercialLicense', label: 'Commercial License' },
            { key: 'includesWhiteLabel', label: 'White-label Rights' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData[key as keyof ListingFormData] as boolean}
                onChange={(e) => handleChange(key as keyof ListingFormData, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>

        {formData.includesSupport && (
          <Input
            label="Support Duration (days)"
            name="supportDays"
            type="number"
            min="1"
            max="365"
            value={formData.supportDays || ''}
            onChange={(e) => handleChange('supportDays', parseInt(e.target.value))}
            placeholder="30"
          />
        )}

        <Textarea
          label="Additional Items (optional)"
          name="whatsIncludedCustom"
          value={formData.whatsIncludedCustom || ''}
          onChange={(e) => handleChange('whatsIncludedCustom', e.target.value)}
          maxLength={LISTING_LIMITS.WHATS_INCLUDED_MAX_LENGTH}
          placeholder="List any additional items included..."
        />
      </fieldset>

      {/* Delivery */}
      <fieldset className="space-y-4">
        <legend className="font-display text-lg border-b border-border-dark pb-2 mb-4">
          Delivery
        </legend>

        <Select
          label="Delivery Method"
          name="deliveryMethod"
          value={formData.deliveryMethod}
          onChange={(e) => handleChange('deliveryMethod', e.target.value as ListingFormData['deliveryMethod'])}
          options={[
            { value: 'INSTANT_DOWNLOAD', label: 'Instant Download (files on platform)' },
            { value: 'REPOSITORY_ACCESS', label: 'Repository Access (add to repo)' },
            { value: 'MANUAL_TRANSFER', label: 'Manual Transfer (send via email)' },
            { value: 'DOMAIN_TRANSFER', label: 'Domain/Asset Transfer' },
          ]}
          required
        />

        {formData.deliveryMethod !== 'INSTANT_DOWNLOAD' && (
          <Select
            label="Delivery Timeframe"
            name="deliveryTimeframeDays"
            value={String(formData.deliveryTimeframeDays)}
            onChange={(e) => handleChange('deliveryTimeframeDays', parseInt(e.target.value))}
            options={[
              { value: '1', label: 'Within 24 hours' },
              { value: '2', label: 'Within 48 hours' },
              { value: '7', label: 'Within 7 days' },
            ]}
          />
        )}

        {/* Project Files - only for instant download and when editing */}
        {formData.deliveryMethod === 'INSTANT_DOWNLOAD' && listingId && (
          <div className="mt-4 pt-4 border-t border-border-dark">
            <label className="block text-sm font-medium mb-2">
              Project Files
            </label>
            <p className="text-xs text-text-muted mb-3">
              Upload files buyers will receive. Max 50MB per file. ZIP, RAR, PDF, TXT, MD supported.
            </p>
            <FileUpload
              listingId={listingId}
              files={files}
              onFilesChange={setFiles}
            />
          </div>
        )}

        {formData.deliveryMethod === 'INSTANT_DOWNLOAD' && !listingId && (
          <p className="text-xs text-text-muted mt-2 p-2 bg-bg-accent border border-border-light">
            Save the listing first, then edit to upload project files.
          </p>
        )}
      </fieldset>

      {/* Submit */}
      <div className="flex gap-4 pt-4 border-t border-border-dark">
        <Button type="submit" variant="primary" loading={loading || isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
        <Button type="button" onClick={() => window.history.back()} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

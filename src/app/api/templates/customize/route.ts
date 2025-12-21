import { GoogleGenerativeAI } from '@google/generative-ai'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { templateType, listingId, messages, isFollowUp } = await req.json()

    // Fetch listing data if provided
    let listingData = null
    if (listingId) {
      listingData = await prisma.listing.findUnique({
        where: { id: listingId, sellerId: session.user.id },
        select: {
          title: true,
          description: true,
          priceInCents: true,
          category: true,
          techStack: true,
          deliveryMethod: true,
          includesSourceCode: true,
          includesDatabase: true,
          includesDocs: true,
          seller: { select: { username: true, displayName: true } }
        }
      })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    if (isFollowUp && messages?.length > 0) {
      // Handle follow-up conversation
      const conversationContext = buildConversationPrompt(templateType, listingData, session.user, messages)
      const result = await model.generateContent(conversationContext)
      const text = result.response.text()

      // Check if the response looks like a template (contains brackets or is long)
      const isTemplate = text.includes('[') && text.includes(']') && text.length > 200

      return NextResponse.json({
        success: true,
        ...(isTemplate ? { customizedTemplate: text } : { response: text })
      })
    } else {
      // Initial template generation
      const prompt = buildPrompt(templateType, listingData, session.user)
      const result = await model.generateContent(prompt)
      const text = result.response.text()

      return NextResponse.json({ success: true, customizedTemplate: text })
    }
  } catch (error) {
    console.error('Gemini API error:', error)
    return NextResponse.json({ error: 'Failed to customize template' }, { status: 500 })
  }
}

interface ListingData {
  title: string
  description: string | null
  priceInCents: number | null
  category: { name: string; slug: string }
  techStack: string[] | null
  deliveryMethod: string
  includesSourceCode: boolean
  includesDatabase: boolean
  includesDocs: boolean
  seller: { username: string; displayName: string | null }
}

interface SessionUser {
  id: string
  username?: string | null
  name?: string | null
}

function buildPrompt(templateType: string, listingData: ListingData | null, user: SessionUser) {
  const projectDetails = listingData ? `
Project Details:
- Title: ${listingData.title}
- Description: ${listingData.description?.slice(0, 500) || 'Not provided'}
- Price: ${listingData.priceInCents ? `$${(listingData.priceInCents / 100).toFixed(2)}` : 'Free'}
- Category: ${listingData.category?.name}
- Tech Stack: ${listingData.techStack?.join(', ') || 'Not specified'}
- Delivery: ${listingData.deliveryMethod}
- Includes: ${[
    listingData.includesSourceCode && 'Source Code',
    listingData.includesDatabase && 'Database',
    listingData.includesDocs && 'Documentation'
  ].filter(Boolean).join(', ') || 'Not specified'}
- Seller: @${listingData.seller.username}
` : 'No specific project selected.'

  return `You are helping fill out a template for a software marketplace transaction.

Template Type: ${templateType}
Seller: @${user.username || user.name || 'User'}

${projectDetails}

IMPORTANT RULES:
1. Use the ACTUAL project data provided - do NOT use [placeholders] for information I gave you
2. Only use [BRACKETS] for information that genuinely wasn't provided
3. The seller username is @${listingData?.seller?.username || user.username || 'User'} - use it directly
4. The price is ${listingData?.priceInCents ? `$${(listingData.priceInCents / 100).toFixed(2)}` : 'not set'} - use it directly
5. The tech stack is ${listingData?.techStack?.join(', ') || 'not specified'} - use it directly
6. Fill in as much as possible from the provided data
7. Be concise - this is a marketplace listing, not an essay

Fill out the ${templateType} template with realistic, helpful content based on the project details above.
Use [BRACKETS] ONLY for information that still needs user input (like dates, signatures, specific terms that weren't provided).
Keep formatting clean - use plain text, not markdown.
Output ONLY the filled template, no explanations or preamble.`
}

function buildConversationPrompt(
  templateType: string,
  listingData: ListingData | null,
  user: SessionUser,
  messages: ConversationMessage[]
) {
  const projectDetails = listingData ? `
Project Details:
- Title: ${listingData.title}
- Description: ${listingData.description?.slice(0, 500) || 'Not provided'}
- Price: ${listingData.priceInCents ? `$${(listingData.priceInCents / 100).toFixed(2)}` : 'Free'}
- Category: ${listingData.category?.name}
- Tech Stack: ${listingData.techStack?.join(', ') || 'Not specified'}
- Delivery: ${listingData.deliveryMethod}
- Includes: ${[
    listingData.includesSourceCode && 'Source Code',
    listingData.includesDatabase && 'Database',
    listingData.includesDocs && 'Documentation'
  ].filter(Boolean).join(', ') || 'Not specified'}
- Seller: @${listingData.seller.username}
` : 'No specific project selected.'

  const conversationHistory = messages
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n')

  return `You are a helpful assistant for a software marketplace. You're helping customize a ${templateType} template.

Seller: @${user.username || user.name || 'User'}
${projectDetails}

Previous conversation:
${conversationHistory}

Respond to the user's latest message. If they're asking you to modify the template, output the complete updated template.
If they're asking a question or for clarification, provide a helpful response.
Keep responses concise and helpful.
Use [BRACKETS] for any information that still needs user input.
Use plain text formatting, not markdown.`
}

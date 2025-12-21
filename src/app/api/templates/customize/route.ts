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
    const { templateType, listingId, messages, isFollowUp, userMessage } = await req.json()

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
      // Initial template generation or single-turn request
      const prompt = buildPrompt(templateType, listingData, session.user, userMessage)
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

function buildPrompt(templateType: string, listingData: ListingData | null, user: SessionUser, userMessage?: string) {
  const projectInfo = listingData ? `
PROJECT DATA:
- Title: ${listingData.title}
- Seller: @${listingData.seller?.username}
- Price: ${listingData.priceInCents ? '$' + (listingData.priceInCents / 100).toFixed(2) : 'Free'}
- Category: ${typeof listingData.category === 'object' ? listingData.category.name : listingData.category}
- Tech Stack: ${listingData.techStack?.join(', ') || 'Not specified'}
- Delivery: ${listingData.deliveryMethod || 'Not specified'}
- Seller's Description: "${listingData.description || 'None provided'}"
- Includes: ${[
    listingData.includesSourceCode && 'Source Code',
    listingData.includesDatabase && 'Database',
    listingData.includesDocs && 'Documentation'
  ].filter(Boolean).join(', ') || 'Not specified'}
` : 'No project selected yet.'

  return `You are a helpful assistant on UndeadList, a marketplace for indie software projects and abandoned SaaS.

Your job is to help sellers create compelling listings and documentation. You're friendly, knowledgeable about software sales, and understand the indie dev community.

${projectInfo}

TEMPLATE BEING WORKED ON: ${templateType}

YOUR CAPABILITIES:
- Generate templates using the project data
- Enhance/improve existing descriptions (make them more compelling)
- Suggest better pricing strategies
- Help write technical documentation
- Offer marketing tips for the listing
- Answer questions about best practices for selling software
- Rewrite content in different tones (professional, casual, technical)

GUIDELINES:
- If the seller has a description, offer to enhance it rather than replacing it
- Ask clarifying questions if you need more info to help better
- Be concise but helpful
- Keep the indie/startup vibe - not corporate speak
- Today's date is ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
- Use actual data when available, [BRACKETS] only for genuinely missing info

${userMessage ? `USER'S REQUEST: ${userMessage}` : `Generate the ${templateType} template for this project.`}

Respond helpfully:`
}

function buildConversationPrompt(
  templateType: string,
  listingData: ListingData | null,
  user: SessionUser,
  messages: ConversationMessage[]
) {
  const projectInfo = listingData ? `
PROJECT DATA:
- Title: ${listingData.title}
- Seller: @${listingData.seller?.username}
- Price: ${listingData.priceInCents ? '$' + (listingData.priceInCents / 100).toFixed(2) : 'Free'}
- Category: ${typeof listingData.category === 'object' ? listingData.category.name : listingData.category}
- Tech Stack: ${listingData.techStack?.join(', ') || 'Not specified'}
- Delivery: ${listingData.deliveryMethod || 'Not specified'}
- Seller's Description: "${listingData.description || 'None provided'}"
- Includes: ${[
    listingData.includesSourceCode && 'Source Code',
    listingData.includesDatabase && 'Database',
    listingData.includesDocs && 'Documentation'
  ].filter(Boolean).join(', ') || 'Not specified'}
` : 'No project selected yet.'

  const conversationHistory = messages
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n')

  return `You are a helpful assistant on UndeadList, a marketplace for indie software projects and abandoned SaaS.

Your job is to help sellers create compelling listings and documentation. You're friendly, knowledgeable about software sales, and understand the indie dev community.

${projectInfo}

TEMPLATE BEING WORKED ON: ${templateType}

YOUR CAPABILITIES:
- Generate templates using the project data
- Enhance/improve existing descriptions (make them more compelling)
- Suggest better pricing strategies
- Help write technical documentation
- Offer marketing tips for the listing
- Answer questions about best practices for selling software
- Rewrite content in different tones (professional, casual, technical)

CONVERSATION SO FAR:
${conversationHistory}

GUIDELINES:
- If modifying a template, output the complete updated version
- Be concise but helpful
- Keep the indie/startup vibe - not corporate speak
- Today's date is ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
- Use actual data when available, [BRACKETS] only for genuinely missing info
- Use plain text formatting, not markdown

Respond to the user's latest message:`
}

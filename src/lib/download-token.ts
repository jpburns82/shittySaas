import jwt from 'jsonwebtoken'

const SECRET = process.env.NEXTAUTH_SECRET!

interface DownloadTokenPayload {
  purchaseId: string
  email: string
}

export function generateDownloadToken(purchaseId: string, email: string): string {
  return jwt.sign(
    { purchaseId, email },
    SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyDownloadToken(token: string): DownloadTokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as DownloadTokenPayload
  } catch {
    return null
  }
}

export function generateDownloadUrl(purchaseId: string, email: string): string {
  const token = generateDownloadToken(purchaseId, email)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://undeadlist.com'
  return `${baseUrl}/download/${purchaseId}?token=${token}`
}

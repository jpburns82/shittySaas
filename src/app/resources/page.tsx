import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { APP_NAME } from '@/lib/constants'
import { ResourcesContent } from './resources-content'

export const metadata: Metadata = {
  title: `Seller Resources & Templates | ${APP_NAME}`,
  description: 'Templates and guides to help you sell your project successfully on UndeadList.',
}

export default async function ResourcesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=/resources')
  }

  return <ResourcesContent />
}

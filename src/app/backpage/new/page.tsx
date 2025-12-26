import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { NewPostForm } from '@/components/backpage/new-post-form'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'New Post | バックページ | UndeadList',
  robots: { index: false },
}

export default async function NewPostPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=/backpage/new')
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/backpage"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-white mb-6"
        >
          <ArrowLeft size={16} />
          Back to バックページ
        </Link>

        <h1 className="text-2xl font-bold text-white mb-6">New Post</h1>
        <NewPostForm />
      </div>
    </div>
  )
}

import { Metadata } from 'next'
import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Contact Us | ${APP_NAME}`,
  description: 'Get in touch with the UndeadList team for questions, feedback, or support.',
}

export default function ContactPage() {
  return (
    <>
      <h1 className="font-display">Contact Us</h1>
      <p className="text-text-muted mb-8">Questions, feedback, or just want to say hi?</p>

      <h2>Get In Touch</h2>
      <ul>
        <li>
          <strong>Email:</strong>{' '}
          <a href="mailto:undeadlist1@gmail.com">undeadlist1@gmail.com</a>
        </li>
        <li>
          <strong>Twitter/X:</strong>{' '}
          <a href="https://x.com/undeadlistshop" target="_blank" rel="noopener noreferrer">
            @undeadlistshop
          </a>
        </li>
      </ul>

      <div className="mt-8 p-4 border border-border-default rounded bg-bg-secondary">
        <p className="text-text-muted mb-0">
          <strong className="text-text-primary">Note:</strong> For account issues, use{' '}
          <Link href="/dashboard/settings">Dashboard → Settings</Link>. For transaction
          disputes, contact the other party first via{' '}
          <Link href="/dashboard/messages">Messages</Link>.
        </p>
      </div>
    </>
  )
}

import { Metadata } from 'next'
import { APP_NAME } from '@/lib/constants'
import { FAQContent } from './faq-content'

export const metadata: Metadata = {
  title: `FAQ | ${APP_NAME}`,
  description: 'Frequently asked questions about buying and selling on UndeadList.',
}

export default function FAQPage() {
  return <FAQContent />
}

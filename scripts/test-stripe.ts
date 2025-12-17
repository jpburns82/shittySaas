/**
 * Test Stripe integration
 *
 * Run with: pnpm tsx scripts/test-stripe.ts
 *
 * Make sure STRIPE_SECRET_KEY is set in your .env.local
 */

import Stripe from 'stripe'

async function testStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    console.error('❌ STRIPE_SECRET_KEY is not set')
    console.log('Please add it to your .env.local file')
    process.exit(1)
  }

  console.log('🔑 Testing Stripe connection...')

  const stripe = new Stripe(secretKey, {
    apiVersion: '2024-12-18.acacia',
  })

  try {
    // Test basic API access
    const balance = await stripe.balance.retrieve()
    console.log('✅ Stripe connection successful!')
    console.log('📊 Account balance:', {
      available: balance.available.map((b) => `${b.amount / 100} ${b.currency.toUpperCase()}`),
      pending: balance.pending.map((b) => `${b.amount / 100} ${b.currency.toUpperCase()}`),
    })

    // Check if Connect is enabled
    console.log('\n🔗 Checking Stripe Connect...')
    try {
      const accounts = await stripe.accounts.list({ limit: 1 })
      console.log('✅ Stripe Connect is enabled')
      console.log(`📊 Connected accounts: ${accounts.data.length > 0 ? 'Found' : 'None yet'}`)
    } catch (connectError) {
      console.log('⚠️  Stripe Connect may not be enabled for this account')
      console.log('    Enable it at: https://dashboard.stripe.com/connect/accounts/overview')
    }

    // Check webhook endpoints
    console.log('\n🪝 Checking webhooks...')
    try {
      const webhooks = await stripe.webhookEndpoints.list({ limit: 5 })
      if (webhooks.data.length > 0) {
        console.log('✅ Webhook endpoints configured:')
        webhooks.data.forEach((wh) => {
          console.log(`   - ${wh.url} (${wh.status})`)
        })
      } else {
        console.log('⚠️  No webhook endpoints configured')
        console.log('    Create one at: https://dashboard.stripe.com/webhooks')
      }
    } catch {
      console.log('⚠️  Could not check webhooks')
    }

    console.log('\n✅ Stripe integration test complete!')
  } catch (error) {
    console.error('❌ Stripe connection failed:', error)
    process.exit(1)
  }
}

testStripe()

import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

export interface PricingPlan {
  id: string
  name: string
  priceMonthly: number
  priceYearly: number
  maxEmployees: number
  features: string[]
}

export const PRICING_PLANS: Record<string, PricingPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 49,
    priceYearly: 490,
    maxEmployees: 10,
    features: ['Up to 10 employees', 'Basic payroll', 'Transaction history', 'Email support'],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    priceMonthly: 149,
    priceYearly: 1490,
    maxEmployees: 50,
    features: ['Up to 50 employees', 'Advanced payroll', 'Treasury management', 'Priority support', 'API access'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 499,
    priceYearly: 4990,
    maxEmployees: 999999,
    features: ['Unlimited employees', 'Custom integrations', 'Dedicated support', 'SLA guarantee', 'White-label option'],
  },
}

export class StripeService {
  // Create checkout session for organization registration
  async createCheckoutSession(
    organizationId: string,
    planId: string,
    billingCycle: 'monthly' | 'yearly',
    customerEmail: string
  ) {
    try {
      const plan = PRICING_PLANS[planId]
      if (!plan) {
        throw new Error('Invalid plan ID')
      }

      const amount = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly
      const interval = billingCycle === 'monthly' ? 'month' : 'year'

      // Create or retrieve customer
      let customer
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      })

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0]
      } else {
        customer = await stripe.customers.create({
          email: customerEmail,
          metadata: {
            organizationId,
          },
        })
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `TrustNet ${plan.name} Plan`,
                description: `${plan.features.join(', ')}`,
              },
              unit_amount: amount * 100, // Convert to cents
              recurring: {
                interval,
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${FRONTEND_URL}/organization/register/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${FRONTEND_URL}/organization/register/payment?canceled=true`,
        metadata: {
          organizationId,
          planId,
          billingCycle,
        },
      })

      // Store session in database
      await prisma.$executeRaw`
        UPDATE organizations 
        SET stripe_session_id = ${session.id},
            stripe_customer_id = ${customer.id}
        WHERE id = ${organizationId}
      `

      return {
        success: true,
        sessionId: session.id,
        sessionUrl: session.url,
      }
    } catch (error: any) {
      console.error('Stripe checkout session creation failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Verify checkout session
  async verifyCheckoutSession(sessionId: string) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)

      if (session.payment_status === 'paid') {
        const organizationId = session.metadata?.organizationId

        if (organizationId) {
          // Update organization payment status
          await prisma.$executeRaw`
            UPDATE organizations 
            SET payment_status = 'paid',
                subscription_status = 'active',
                stripe_subscription_id = ${session.subscription}
            WHERE id = ${organizationId}
          `
        }

        return {
          success: true,
          paid: true,
          organizationId,
          subscriptionId: session.subscription,
        }
      }

      return {
        success: true,
        paid: false,
      }
    } catch (error: any) {
      console.error('Checkout session verification failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Handle webhook events
  async handleWebhook(body: Buffer, signature: string) {
    try {
      const event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
          break

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice)
          break

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice)
          break

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      return { success: true, received: true }
    } catch (error: any) {
      console.error('Webhook handling failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Handle checkout completed
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const organizationId = session.metadata?.organizationId

    if (organizationId) {
      await prisma.$executeRaw`
        UPDATE organizations 
        SET payment_status = 'paid',
            subscription_status = 'active',
            stripe_subscription_id = ${session.subscription}
        WHERE id = ${organizationId}
      `
      console.log(`✅ Payment completed for organization: ${organizationId}`)
    }
  }

  // Handle subscription updated
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string

    await prisma.$executeRaw`
      UPDATE organizations 
      SET subscription_status = ${subscription.status}
      WHERE stripe_customer_id = ${customerId}
    `
    console.log(`📝 Subscription updated: ${subscription.id} - ${subscription.status}`)
  }

  // Handle subscription deleted
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string

    await prisma.$executeRaw`
      UPDATE organizations 
      SET subscription_status = 'canceled'
      WHERE stripe_customer_id = ${customerId}
    `
    console.log(`❌ Subscription canceled: ${subscription.id}`)
  }

  // Handle payment succeeded
  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string

    await prisma.$executeRaw`
      UPDATE organizations 
      SET payment_status = 'paid',
          last_payment_date = ${new Date()}
      WHERE stripe_customer_id = ${customerId}
    `
    console.log(`💰 Payment succeeded for invoice: ${invoice.id}`)
  }

  // Handle payment failed
  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string

    await prisma.$executeRaw`
      UPDATE organizations 
      SET payment_status = 'failed',
          subscription_status = 'past_due'
      WHERE stripe_customer_id = ${customerId}
    `
    console.log(`⚠️ Payment failed for invoice: ${invoice.id}`)
  }

  // Cancel subscription
  async cancelSubscription(organizationId: string) {
    try {
      const org = await prisma.$queryRaw<any[]>`
        SELECT stripe_subscription_id 
        FROM organizations 
        WHERE id = ${organizationId}
      `

      if (org.length === 0 || !org[0].stripe_subscription_id) {
        return { success: false, error: 'No active subscription found' }
      }

      await stripe.subscriptions.cancel(org[0].stripe_subscription_id)

      await prisma.$executeRaw`
        UPDATE organizations 
        SET subscription_status = 'canceled'
        WHERE id = ${organizationId}
      `

      return { success: true, message: 'Subscription canceled successfully' }
    } catch (error: any) {
      console.error('Subscription cancellation failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Get subscription details
  async getSubscriptionDetails(organizationId: string) {
    try {
      const org = await prisma.$queryRaw<any[]>`
        SELECT stripe_subscription_id, stripe_customer_id 
        FROM organizations 
        WHERE id = ${organizationId}
      `

      if (org.length === 0 || !org[0].stripe_subscription_id) {
        return { success: false, error: 'No subscription found' }
      }

      const subscription = await stripe.subscriptions.retrieve(org[0].stripe_subscription_id)

      return {
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      }
    } catch (error: any) {
      console.error('Failed to get subscription details:', error)
      return { success: false, error: error.message }
    }
  }
}

// Singleton instance
let stripeService: StripeService | null = null

export function getStripeService(): StripeService {
  if (!stripeService) {
    stripeService = new StripeService()
  }
  return stripeService
}

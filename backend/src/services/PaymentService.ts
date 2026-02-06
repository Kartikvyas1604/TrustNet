import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import logger from '../utils/logger';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_', {
  apiVersion: '2023-10-16',
});

class PaymentService {
  /**
   * Create Stripe checkout session for organization subscription
   */
  async createCheckoutSession(organizationId: string, billingCycle: 'MONTHLY' | 'ANNUAL') {
    try {
      const organization = await prisma.organization.findUnique({
        where: { organizationId },
      });

      if (!organization) {
        throw new Error('Organization not found');
      }

      const amount = billingCycle === 'ANNUAL' 
        ? parseFloat(organization.annualPrice || '0')
        : parseFloat(organization.monthlyPrice || '0');

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `TrustNet ${organization.subscriptionTier} Plan`,
                description: `${organization.employeeLimit} employee licenses`,
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
              recurring: billingCycle === 'MONTHLY' ? {
                interval: 'month',
              } : {
                interval: 'year',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/organization/register/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/organization/register/payment`,
        client_reference_id: organizationId,
        metadata: {
          organizationId,
          employeeLimit: organization.employeeLimit.toString(),
          billingCycle,
        },
      });

      return session;
    } catch (error: any) {
      logger.error('Failed to create Stripe checkout session', { error: error.message });
      throw error;
    }
  }

  /**
   * Handle Stripe webhook for payment confirmation
   */
  async handleWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
          break;
        
        default:
          logger.info('Unhandled Stripe event type', { type: event.type });
      }
    } catch (error: any) {
      logger.error('Failed to handle Stripe webhook', { error: error.message });
      throw error;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const organizationId = session.client_reference_id;
    if (!organizationId) {
      logger.error('Missing organizationId in checkout session');
      return;
    }

    await prisma.organization.update({
      where: { organizationId },
      data: {
        paymentStatus: 'PAID',
        subscriptionStatus: 'ACTIVE',
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
      },
    });

    logger.info('Checkout session completed', { organizationId });
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;
    
    const organization = await prisma.organization.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (organization) {
      await prisma.organization.update({
        where: { organizationId: organization.organizationId },
        data: {
          paymentStatus: 'PAID',
          subscriptionStatus: 'ACTIVE',
        },
      });

      logger.info('Invoice payment succeeded', { organizationId: organization.organizationId });
    }
  }

  private async handleSubscriptionCancelled(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    
    const organization = await prisma.organization.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (organization) {
      await prisma.organization.update({
        where: { organizationId: organization.organizationId },
        data: {
          subscriptionStatus: 'CANCELLED',
        },
      });

      logger.info('Subscription cancelled', { organizationId: organization.organizationId });
    }
  }

  /**
   * Create a customer portal session for managing subscriptions
   */
  async createPortalSession(organizationId: string) {
    try {
      const organization = await prisma.organization.findUnique({
        where: { organizationId },
      });

      if (!organization || !organization.stripeCustomerId) {
        throw new Error('Organization or Stripe customer not found');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: organization.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/organization/dashboard`,
      });

      return session;
    } catch (error: any) {
      logger.error('Failed to create portal session', { error: error.message });
      throw error;
    }
  }
}

export default new PaymentService();

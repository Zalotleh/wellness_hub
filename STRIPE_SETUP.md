# Stripe Integration Setup

## Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook secret from Stripe Dashboard

# Stripe Product Price IDs (create these in Stripe Dashboard)
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_premium_monthly
STRIPE_PREMIUM_ANNUAL_PRICE_ID=price_premium_annual
STRIPE_FAMILY_MONTHLY_PRICE_ID=price_family_monthly
STRIPE_FAMILY_ANNUAL_PRICE_ID=price_family_annual

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3002 # Your app URL
```

## Stripe Dashboard Setup

### 1. Create Products and Prices

In your Stripe Dashboard, create the following products and prices:

#### Premium Plan
- **Product Name**: "Premium Plan"
- **Monthly Price**: $9.99 USD (recurring monthly)
- **Annual Price**: $99.99 USD (recurring yearly)

#### Family Plan
- **Product Name**: "Family Plan"
- **Monthly Price**: $14.99 USD (recurring monthly)
- **Annual Price**: $149.99 USD (recurring yearly)

### 2. Configure Webhooks

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Set endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 3. Test Webhooks Locally

Use Stripe CLI to forward webhooks to your local development server:

```bash
# Install Stripe CLI
npm install -g stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3002/api/webhooks/stripe
```

## Database Schema Updates

You'll need to add these fields to your User model in `prisma/schema.prisma`:

```prisma
model User {
  // ... existing fields

  // Stripe Integration
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique
  subscriptionTier     String    @default("FREE") // FREE, PREMIUM, FAMILY
  subscriptionStatus   String?   // active, canceled, past_due, etc.
  currentPeriodEnd     DateTime?
  trialEndsAt          DateTime?

  // Usage Tracking (for limits)
  mealPlansThisMonth   Int       @default(0)
  aiQuestionsThisMonth Int       @default(0)
  lastResetDate        DateTime?

  // ... rest of your model
}
```

After updating the schema, run:

```bash
npx prisma generate
npx prisma db push
```

## Testing

### Test Credit Cards (Stripe Test Mode)

- **Success**: 4242 4242 4242 4242
- **Declined**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0000 0000 3220
- **Insufficient Funds**: 4000 0000 0000 9995

### API Endpoints

- **GET** `/api/checkout` - Get pricing information
- **POST** `/api/checkout` - Create checkout session
- **POST** `/api/webhooks/stripe` - Handle Stripe webhooks
- **GET** `/api/webhooks/stripe` - Webhook health check

### Pages

- `/pricing` - Pricing and plan selection
- `/subscription/success` - Post-checkout success page
- `/subscription/manage` - Subscription management
- `/payment/error` - Payment error handling

## Error Handling

The system includes comprehensive error handling for:

- **Authentication errors**: User not logged in
- **Payment failures**: Card declined, insufficient funds, etc.
- **Webhook processing errors**: Invalid signatures, processing failures
- **Network errors**: Stripe API unavailable
- **Validation errors**: Invalid plan selection, malformed requests

## Security Considerations

1. **Webhook Signatures**: Always verify webhook signatures
2. **Environment Variables**: Keep Stripe keys secure
3. **User Validation**: Verify user ownership before operations
4. **HTTPS**: Use HTTPS in production for webhooks
5. **Rate Limiting**: Implement rate limiting for API endpoints

## Production Deployment

1. Update `NEXT_PUBLIC_APP_URL` to your production domain
2. Create production Stripe webhook endpoint
3. Use production Stripe keys
4. Set up proper logging and monitoring
5. Test webhook delivery in production

## Troubleshooting

### Common Issues

1. **Webhook signature verification fails**
   - Check that `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure webhook URL matches exactly

2. **Checkout session creation fails**
   - Verify price IDs exist in Stripe
   - Check that user has valid email address

3. **Subscription not updating**
   - Check webhook events are being sent
   - Verify webhook endpoint is accessible
   - Check server logs for processing errors

### Debugging

Enable debug mode in development:

```bash
# Add to .env.local
DEBUG=stripe:*
NODE_ENV=development
```

This will show detailed Stripe API logs in your console.
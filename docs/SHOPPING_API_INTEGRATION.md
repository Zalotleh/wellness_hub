# Shopping API Integration Guide

## Overview
Integration plan for connecting Wellness Hub shopping lists with grocery delivery APIs and e-commerce platforms.

## Current Infrastructure ✅

Your app already has foundational support for e-commerce integration:

1. **Database Fields** (ShoppingListItem):
   - `retailQuantity`: Standardized quantity for retail ordering
   - `retailUnit`: Retail-friendly unit (bottles, bags, packages)
   - `retailDescription`: Product description for API matching

2. **Utility Functions** (`lib/utils/sharing.ts`):
   - `generateInstacartLink()`: Creates Instacart shopping links
   - `generateAmazonFreshLink()`: Creates Amazon Fresh links

3. **Item Structure**:
   - Ingredient name
   - Quantity & unit
   - Category (Produce, Proteins, Dairy, etc.)
   - Estimated cost tracking

---

## Available Shopping APIs & Services

### 1. **Instacart API** ⭐ RECOMMENDED
**Why It's Great:**
- Largest grocery delivery network in US/Canada
- Partners with 1,400+ retailers (Kroger, Costco, Whole Foods, etc.)
- Best product matching algorithms
- Real-time inventory & pricing

**Integration Type:** Instacart Connect API
**Cost:** Free for basic integration, revenue sharing for deep integration
**Documentation:** https://www.instacart.com/company/connect

**Features:**
- Product search & matching
- Real-time availability
- Dynamic pricing
- Order placement
- Multi-retailer support
- Delivery scheduling

**Implementation Effort:** Medium (2-3 days)

---

### 2. **Amazon Fresh / Whole Foods API**
**Why It's Good:**
- Large user base with Prime
- Whole Foods integration for organic/health foods
- Same-day delivery in major cities

**Integration Type:** Amazon Product Advertising API + Amazon Pay
**Cost:** Free API, transaction fees apply
**Documentation:** https://webservices.amazon.com/paapi5/documentation/

**Limitations:**
- US only (limited international)
- Requires Amazon account
- Product matching less accurate than Instacart

**Implementation Effort:** Medium (2-3 days)

---

### 3. **Walmart Grocery API**
**Why It's Good:**
- Lowest prices
- Wide availability (4,700+ stores)
- Curbside pickup option

**Integration Type:** Walmart Open API
**Cost:** Free
**Documentation:** https://developer.walmart.com/

**Features:**
- Product search
- Store inventory
- Pickup & delivery
- Price comparison

**Implementation Effort:** Medium (2-3 days)

---

### 4. **Shipt API**
**Why It's Good:**
- Target partnership
- Quality product matching
- Personal shopper service

**Integration Type:** Shipt Platform API
**Cost:** Commission-based
**Documentation:** https://www.shipt.com/platform

**Implementation Effort:** Medium-Hard (3-4 days)

---

### 5. **Uber Eats Grocery**
**Why It's Good:**
- Fast delivery (30-60 min)
- Growing network
- Uber account integration

**Integration Type:** Uber Direct API
**Cost:** Per-delivery fee
**Documentation:** https://developer.uber.com/docs/eats

**Implementation Effort:** Hard (4-5 days)

---

### 6. **Kroger API**
**Why It's Good:**
- Direct retailer integration
- 2,800+ stores (Kroger, Fred Meyer, Ralphs, etc.)
- Loyalty program integration

**Integration Type:** Kroger Developer API
**Cost:** Free
**Documentation:** https://developer.kroger.com/

**Implementation Effort:** Easy-Medium (1-2 days)

---

### 7. **FreshDirect API** (NY Metro)
**Why It's Good:**
- Quality organic/health foods
- Strong in NYC area
- Good for health-conscious users

**Integration Type:** Custom integration (contact required)
**Implementation Effort:** Hard (requires partnership)

---

### 8. **Peapod API** (by Stop & Shop)
**Why It's Good:**
- East Coast coverage
- Long-standing service
- Good produce quality

**Integration Type:** Limited API (contact required)
**Implementation Effort:** Hard (requires partnership)

---

## Recommended Integration Strategy

### Phase 1: Deep Links (Quick Win - 1 Day) ✅ PARTIALLY DONE
**Status:** You already have this partially implemented!

**What You Have:**
```typescript
// lib/utils/sharing.ts
generateInstacartLink(items)
generateAmazonFreshLink(items)
```

**Enhanced Implementation:**
```typescript
// Add to shopping list detail page
<button onClick={() => window.open(generateInstacartLink(items), '_blank')}>
  🛒 Shop on Instacart
</button>
<button onClick={() => window.open(generateAmazonFreshLink(items), '_blank')}>
  📦 Shop on Amazon Fresh
</button>
<button onClick={() => window.open(generateWalmartLink(items), '_blank')}>
  🏪 Shop at Walmart
</button>
```

**Pros:**
- No API keys needed
- Works immediately
- No maintenance
- User completes order on partner site

**Cons:**
- No order tracking
- User leaves your app
- No commission/revenue
- Manual product matching by user

---

### Phase 2: Product Matching API (Recommended - 2-3 Days)
**Goal:** Auto-match ingredients to real products with images, prices, and "Add to Cart" buttons

**Best Choice:** Instacart Connect API

**Implementation:**

1. **Product Search & Matching**
```typescript
// lib/api/instacart.ts
export async function searchInstacartProducts(
  ingredient: string,
  quantity: number,
  unit: string,
  zipCode: string
) {
  const response = await fetch('https://connect.instacart.com/v2/catalog/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.INSTACART_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: ingredient,
      quantity: quantity,
      unit: unit,
      retailer_id: 'preferred_retailer',
      location: zipCode,
    }),
  });
  
  return response.json();
}
```

2. **Enhanced Shopping List Item**
```typescript
interface EnhancedShoppingListItem extends ShoppingListItem {
  // Product matching
  matchedProducts?: {
    id: string;
    name: string;
    brand: string;
    image: string;
    price: number;
    size: string;
    unit: string;
    inStock: boolean;
    retailer: string;
    storeId: string;
  }[];
  selectedProduct?: string; // Product ID user chose
}
```

3. **Smart Matching Algorithm**
```typescript
// lib/utils/product-matcher.ts
export function scoreProductMatch(
  ingredient: string,
  product: InstacartProduct
): number {
  let score = 0;
  
  // Exact name match
  if (product.name.toLowerCase().includes(ingredient.toLowerCase())) {
    score += 50;
  }
  
  // Brand quality (organic, natural)
  if (/organic|natural|fresh/i.test(product.name)) {
    score += 20;
  }
  
  // Price per unit efficiency
  score += calculatePriceEfficiency(product);
  
  // Defense system alignment
  score += matchDefenseSystemPreferences(product, userPreferences);
  
  return score;
}
```

4. **UI Component**
```tsx
// components/shopping/ProductMatchCard.tsx
<div className="product-match">
  <img src={product.image} alt={product.name} />
  <div>
    <h4>{product.name}</h4>
    <p className="brand">{product.brand}</p>
    <p className="price">${product.price}</p>
    <p className="size">{product.size}</p>
    {!product.inStock && <span className="badge">Out of Stock</span>}
  </div>
  <button 
    onClick={() => addToInstacartCart(product.id)}
    disabled={!product.inStock}
  >
    Add to Cart
  </button>
</div>
```

**Benefits:**
- Products displayed in your app
- User selects preferred items
- Real pricing & availability
- Better UX (no leaving app until checkout)

**API Costs:**
- Instacart Connect: Free for basic, revenue share for conversions
- Rate limits: ~1000 requests/hour

---

### Phase 3: Full Order Placement (Advanced - 4-5 Days)
**Goal:** Users checkout entirely within your app

**Implementation:**

1. **Cart Management**
```typescript
// lib/api/instacart-cart.ts
export async function createInstacartCart(userId: string) {
  return await fetch('https://connect.instacart.com/v2/carts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
    body: JSON.stringify({
      user_id: userId,
      retailer_id: 'selected_retailer',
      delivery_address: userAddress,
    }),
  });
}

export async function addItemToCart(cartId: string, productId: string, quantity: number) {
  return await fetch(`https://connect.instacart.com/v2/carts/${cartId}/items`, {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, quantity }),
  });
}

export async function placeOrder(cartId: string, paymentMethod: string) {
  return await fetch(`https://connect.instacart.com/v2/carts/${cartId}/checkout`, {
    method: 'POST',
    body: JSON.stringify({
      payment_method: paymentMethod,
      delivery_window: selectedWindow,
      tip_amount: tipAmount,
    }),
  });
}
```

2. **Order Tracking**
```typescript
// Track order status
export async function getOrderStatus(orderId: string) {
  return await fetch(`https://connect.instacart.com/v2/orders/${orderId}`);
}
```

3. **Payment Integration**
```typescript
// Use Stripe or similar
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent for order
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalAmount * 100,
  currency: 'usd',
  metadata: { instacart_order_id: orderId },
});
```

**Benefits:**
- Complete experience in your app
- Revenue share opportunities
- Order history tracking
- User never leaves platform

**Challenges:**
- Requires partnership agreement
- Payment processing complexity
- Customer support burden
- Higher development cost

---

## Multi-Platform Aggregation (Advanced)

**Goal:** Compare prices across multiple services

```typescript
// lib/api/shopping-aggregator.ts
export async function findBestPrices(items: ShoppingListItem[]) {
  const results = await Promise.all([
    searchInstacart(items),
    searchAmazonFresh(items),
    searchWalmart(items),
    searchKroger(items),
  ]);
  
  return {
    byPrice: sortByTotalPrice(results),
    byDeliveryTime: sortByDeliverySpeed(results),
    byQuality: sortByProductQuality(results),
    recommendations: {
      cheapest: results[0],
      fastest: results[1],
      healthiest: analyzeHealthScore(results),
    },
  };
}
```

**UI:**
```tsx
<PriceComparison>
  <Card>
    <h3>🏆 Best Price</h3>
    <p>Walmart - $87.42</p>
    <p className="savings">Save $12.30 vs others</p>
  </Card>
  <Card>
    <h3>⚡ Fastest Delivery</h3>
    <p>Instacart - 1 hour</p>
  </Card>
  <Card>
    <h3>🌱 Healthiest Options</h3>
    <p>Whole Foods - 95% organic</p>
  </Card>
</PriceComparison>
```

---

## Revenue Models

### 1. Affiliate Commissions
- Instacart: 1-3% of order value
- Amazon: 1-4% commission
- Walmart: Varies

### 2. Premium Features
```typescript
// PREMIUM tier users get:
- Price comparison across all platforms
- Auto-reorder based on meal plans
- Bulk discount finder
- Organic/quality prioritization
- Delivery scheduling
```

### 3. Sponsored Products
- Brands pay to feature their products
- "Recommended for Immunity Defense System"

---

## Implementation Checklist

### Phase 1: Enhanced Deep Links (1 Day) ✅ Easy
- [ ] Improve existing `generateInstacartLink()` function
- [ ] Add `generateWalmartLink()` function  
- [ ] Add `generateKrogerLink()` function
- [ ] Create "Shop Now" button component with platform selection
- [ ] Add analytics tracking for clicks
- [ ] Store user's preferred platform in their profile

### Phase 2: Product Matching (2-3 Days) ⭐ RECOMMENDED START
- [ ] Sign up for Instacart Connect API
- [ ] Create `/lib/api/instacart.ts` integration
- [ ] Build product search endpoint: `/api/shopping/search-products`
- [ ] Create product matching algorithm with scoring
- [ ] Add matched products to shopping list items (DB migration)
- [ ] Build `<ProductMatchCard>` component
- [ ] Add "Find Products" button to shopping lists
- [ ] Implement product selection & cart preview
- [ ] Add price tracking over time
- [ ] Set up error handling & fallbacks

### Phase 3: Direct Cart Integration (4-5 Days)
- [ ] Apply for Instacart Partner program
- [ ] Implement OAuth for Instacart user accounts
- [ ] Create cart management API endpoints
- [ ] Build checkout flow UI
- [ ] Integrate payment processing (Stripe)
- [ ] Add order tracking
- [ ] Implement customer support system
- [ ] Set up webhooks for order updates
- [ ] Add order history to user profile

### Phase 4: Multi-Platform (1-2 Weeks)
- [ ] Integrate 2-3 additional platforms
- [ ] Build price comparison engine
- [ ] Create aggregator UI
- [ ] Add smart recommendations
- [ ] Implement caching & performance optimization

---

## Technical Requirements

### Environment Variables
```bash
# .env.local
INSTACART_API_KEY=your_api_key
INSTACART_API_SECRET=your_secret
AMAZON_PA_ACCESS_KEY=your_amazon_key
AMAZON_PA_SECRET_KEY=your_amazon_secret
WALMART_API_KEY=your_walmart_key
KROGER_CLIENT_ID=your_kroger_client
KROGER_CLIENT_SECRET=your_kroger_secret

# For Phase 3
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_PUBLISHABLE_KEY=your_stripe_pub_key
```

### Database Migration
```prisma
// Add to ShoppingListItem JSON structure
model ShoppingList {
  // ... existing fields
  items Json // Update structure to include:
  /*
  {
    ingredient: string,
    quantity: number,
    unit: string,
    category: string,
    checked: boolean,
    // NEW FIELDS:
    matchedProducts: [
      {
        platform: string, // 'instacart', 'amazon', 'walmart'
        productId: string,
        name: string,
        brand: string,
        image: string,
        price: number,
        size: string,
        inStock: boolean,
        retailerId: string,
        lastUpdated: string,
      }
    ],
    selectedProduct: {
      platform: string,
      productId: string,
    },
    priceHistory: [
      { date: string, price: number, platform: string }
    ],
  }
  */
}

// Track orders
model ShoppingOrder {
  id             String   @id @default(cuid())
  userId         String
  shoppingListId String
  platform       String   // 'instacart', 'amazon', 'walmart'
  externalOrderId String
  status         String   // 'pending', 'confirmed', 'delivered', 'cancelled'
  totalAmount    Float
  deliveryFee    Float?
  tip            Float?
  estimatedDelivery DateTime?
  actualDelivery DateTime?
  items          Json
  trackingUrl    String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  user           User     @relation(fields: [userId], references: [id])
  shoppingList   ShoppingList @relation(fields: [shoppingListId], references: [id])
  
  @@index([userId])
  @@index([shoppingListId])
}
```

---

## Cost Estimates

### Development Time
- **Phase 1 (Enhanced Links):** 1 day = $400-800
- **Phase 2 (Product Matching):** 3 days = $1,200-2,400
- **Phase 3 (Full Integration):** 5 days = $2,000-4,000
- **Phase 4 (Multi-Platform):** 10 days = $4,000-8,000

### Ongoing Costs
- **API Fees:** Mostly free tiers, commission-based
- **Stripe Fees:** 2.9% + $0.30 per transaction
- **Server Costs:** +$20-50/month for caching & processing

### Potential Revenue
- **Affiliate Commissions:** 1-3% of GMV (Gross Merchandise Value)
- Example: If users order $50k/month → $500-1,500/month revenue
- **Premium Subscriptions:** $19.99/month with shopping features

---

## Recommendation

### Start with Phase 2: Product Matching via Instacart Connect API

**Why:**
1. Best ROI for effort invested
2. Instacart has the best coverage & matching algorithms
3. No payment/legal complexity of Phase 3
4. Much better UX than just deep links
5. Allows you to track which products users prefer
6. Opens door to revenue via conversions

**Next Steps:**
1. Apply for Instacart Connect API (1 week approval)
2. Build product search & matching (2 days)
3. Create UI for product selection (1 day)
4. Test with real users
5. Iterate based on feedback
6. Expand to Amazon Fresh & Walmart (Phase 4)

**Quick Win Option:**
If you want something live TODAY, enhance your existing deep link implementation with better UI and platform choice. Then work on Phase 2 in parallel.

---

## Questions to Consider

1. **Target Geography:** US only, or international? (Affects platform choice)
2. **User Demographics:** Premium/health-conscious (Whole Foods) or budget (Walmart)?
3. **Business Model:** Affiliate commissions or premium features?
4. **Support Capacity:** Can you handle order issues in Phase 3?
5. **Legal:** Terms with each platform, especially for full checkout

---

## Support & Resources

- **Instacart Connect:** connect@instacart.com
- **Amazon Product API:** https://webservices.amazon.com/
- **Walmart Developer:** developer@walmart.com
- **Kroger API:** https://developer.kroger.com/

---

Let me know which phase you want to start with, and I can begin implementation! 🚀

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const INSTACART_API_KEY = process.env.INSTACART_API_KEY;
const INSTACART_ENV = process.env.INSTACART_ENV || 'development'; // 'development' | 'production'

const INSTACART_BASE_URL =
  INSTACART_ENV === 'production'
    ? 'https://connect.instacart.com'
    : 'https://connect.dev.instacart.tools';

interface InstacartIngredient {
  name: string;
  display_text?: string;
  measurements: Array<{
    quantity: number;
    unit: string;
  }>;
}

interface ShoppingListItem {
  ingredient: string;
  quantity: number | string;
  unit: string;
  checked?: boolean;
}

/**
 * POST /api/instacart/create-cart
 *
 * Sends shopping list items to the Instacart Developer Platform API and
 * returns a hosted shopping page URL with all items pre-loaded.
 *
 * Docs: https://docs.instacart.com/developer_platform_api/guide/tutorials/create_a_recipe_page
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!INSTACART_API_KEY) {
      return NextResponse.json(
        { error: 'Instacart API key is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      items,                  // ShoppingListItem[]
      title = 'Shopping List', // Shopping list / recipe name
      linkbackUrl,            // URL to return users to (our app)
      onlyUnchecked = true,   // Filter out already-checked items
    }: {
      items: ShoppingListItem[];
      title?: string;
      linkbackUrl?: string;
      onlyUnchecked?: boolean;
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

    // Filter checked items if requested
    const filteredItems = onlyUnchecked
      ? items.filter((item) => !item.checked)
      : items;

    if (filteredItems.length === 0) {
      return NextResponse.json(
        { error: 'No unchecked items to order. All items are already checked.' },
        { status: 400 }
      );
    }

    // Map our shopping list items to Instacart ingredient format
    const ingredients: InstacartIngredient[] = filteredItems.map((item) => {
      const qty = typeof item.quantity === 'string'
        ? parseFloat(item.quantity) || 1
        : item.quantity || 1;

      const unit = item.unit?.trim() || 'piece';

      return {
        name: item.ingredient.trim().toLowerCase(),
        display_text: item.ingredient.trim(),
        measurements: [
          {
            quantity: qty,
            unit: unit,
          },
        ],
      };
    });

    // Build the Instacart API request payload
    const payload = {
      title: title,
      link_type: 'shopping_list',
      instructions: [],    // Not a recipe, no instructions
      ingredients,
      landing_page_configuration: {
        partner_linkback_url: linkbackUrl || 'https://wellness-hub.com/shopping-lists',
        enable_pantry_items: true,
      },
    };

    console.log(`🛒 [Instacart] Calling ${INSTACART_ENV} API with ${ingredients.length} items`);
    console.log(`🛒 [Instacart] URL: ${INSTACART_BASE_URL}/idp/v1/products/recipe`);

    // Call the Instacart API
    const instacartResponse = await fetch(
      `${INSTACART_BASE_URL}/idp/v1/products/recipe`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INSTACART_API_KEY}`,
          'Accept-Language': 'en-US',
        },
        body: JSON.stringify(payload),
      }
    );

    const responseText = await instacartResponse.text();
    console.log(`🛒 [Instacart] Response status: ${instacartResponse.status}`);
    console.log(`🛒 [Instacart] Response body: ${responseText}`);

    if (!instacartResponse.ok) {
      let errorMessage = `Instacart API error: ${instacartResponse.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Keep default message
      }

      return NextResponse.json(
        {
          error: errorMessage,
          status: instacartResponse.status,
          details: responseText,
          env: INSTACART_ENV,
        },
        { status: instacartResponse.status >= 500 ? 502 : 400 }
      );
    }

    let data: { products_link_url: string };
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON response from Instacart' },
        { status: 502 }
      );
    }

    if (!data.products_link_url) {
      return NextResponse.json(
        { error: 'No products_link_url in Instacart response', raw: data },
        { status: 502 }
      );
    }

    console.log(`✅ [Instacart] Cart created: ${data.products_link_url}`);

    return NextResponse.json({
      success: true,
      url: data.products_link_url,
      itemCount: ingredients.length,
      env: INSTACART_ENV,
    });
  } catch (error) {
    console.error('Error creating Instacart cart:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create Instacart cart' },
      { status: 500 }
    );
  }
}

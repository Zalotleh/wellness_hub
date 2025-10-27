import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import jsPDF from 'jspdf';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mealPlanId = params.id;
    const { searchParams } = new URL(request.url);
    const includeRecipes = searchParams.get('includeRecipes') === 'true';
    const includeShoppingList = searchParams.get('includeShoppingList') === 'true';

    // Verify user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Mock meal plan data
    const mockMealPlan = {
      id: mealPlanId,
      title: 'Weekly Meal Plan',
      weekStart: new Date().toISOString(),
      weekEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      defaultServings: 4,
      description: 'A healthy meal plan focusing on defense system foods',
      dailyMenus: [
        {
          date: new Date().toISOString(),
          meals: [
            {
              type: 'BREAKFAST',
              name: 'Green Smoothie Bowl',
              description: 'Antioxidant-rich breakfast',
              prepTime: '10 mins',
              defenseSystems: ['Immune Support'],
            },
            {
              type: 'LUNCH',
              name: 'Mediterranean Quinoa Salad',
              description: 'Heart-healthy lunch',
              prepTime: '15 mins',
              defenseSystems: ['Heart Health', 'Anti-inflammatory'],
            },
          ],
        },
      ],
    };

    // Generate PDF using jsPDF
    const pdfBuffer = await generateJsPDF(mockMealPlan, {
      includeRecipes,
      includeShoppingList,
    });

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(mockMealPlan.title)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF with jsPDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

async function generateJsPDF(
  mealPlan: any,
  options: { includeRecipes: boolean; includeShoppingList: boolean }
): Promise<Buffer> {
  const doc = new jsPDF();
  
  // Set up fonts and colors
  doc.setFont('helvetica');
  const primaryColor = '#16a34a';
  const secondaryColor = '#15803d';
  
  let yPosition = 20;
  
  // Title Page
  doc.setFontSize(24);
  doc.setTextColor(primaryColor);
  doc.text(mealPlan.title, 105, yPosition, { align: 'center' });
  yPosition += 15;
  
  // Date range
  doc.setFontSize(12);
  doc.setTextColor('#666666');
  const startDate = new Date(mealPlan.weekStart).toLocaleDateString();
  const endDate = new Date(mealPlan.weekEnd).toLocaleDateString();
  doc.text(`${startDate} - ${endDate}`, 105, yPosition, { align: 'center' });
  yPosition += 20;
  
  // Info section
  doc.setFontSize(11);
  doc.setTextColor('#000000');
  doc.text(`Default Servings: ${mealPlan.defaultServings}`, 20, yPosition);
  yPosition += 10;
  
  if (mealPlan.description) {
    doc.text('Description:', 20, yPosition);
    yPosition += 7;
    
    // Split long text into multiple lines
    const splitDescription = doc.splitTextToSize(mealPlan.description, 170);
    doc.text(splitDescription, 20, yPosition);
    yPosition += splitDescription.length * 5;
  }
  
  yPosition += 10;
  
  // Meal Plan Section
  doc.setFontSize(16);
  doc.setTextColor(primaryColor);
  doc.text('Weekly Meal Plan', 20, yPosition);
  yPosition += 15;
  
  // Days and meals
  mealPlan.dailyMenus.forEach((dayMenu: any, dayIndex: number) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    const date = new Date(dayMenu.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = date.toLocaleDateString();
    
    doc.setFontSize(14);
    doc.setTextColor(secondaryColor);
    doc.text(`${dayName}, ${dateStr}`, 20, yPosition);
    yPosition += 10;
    
    // Meals table header
    doc.setFontSize(10);
    doc.setTextColor('#000000');
    doc.setFont('helvetica', 'bold');
    doc.text('Meal', 25, yPosition);
    doc.text('Name', 55, yPosition);
    doc.text('Prep Time', 120, yPosition);
    doc.text('Systems', 150, yPosition);
    yPosition += 7;
    
    // Draw header line
    doc.line(20, yPosition - 2, 190, yPosition - 2);
    
    doc.setFont('helvetica', 'normal');
    
    dayMenu.meals.forEach((meal: any) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(meal.type, 25, yPosition);
      
      // Wrap meal name if too long
      const mealNameLines = doc.splitTextToSize(meal.name, 60);
      doc.text(mealNameLines, 55, yPosition);
      
      doc.text(meal.prepTime || 'N/A', 120, yPosition);
      
      // Defense systems
      const systems = meal.defenseSystems?.slice(0, 2).join(', ') || '';
      const systemLines = doc.splitTextToSize(systems, 35);
      doc.text(systemLines, 150, yPosition);
      
      yPosition += Math.max(mealNameLines.length, systemLines.length) * 5 + 3;
    });
    
    yPosition += 10;
  });
  
  // Recipes section
  if (options.includeRecipes) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFontSize(16);
    doc.setTextColor(primaryColor);
    doc.text('Recipes', 20, yPosition);
    yPosition += 15;
    
    // Add sample recipe
    doc.setFontSize(14);
    doc.setTextColor(secondaryColor);
    doc.text('Green Smoothie Bowl', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setTextColor('#000000');
    doc.text('Servings: 2 | Prep: 10 mins | Cook: 0 mins | Total: 10 mins', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Ingredients:', 20, yPosition);
    yPosition += 7;
    
    doc.setFont('helvetica', 'normal');
    const ingredients = [
      '• 2 cups fresh spinach',
      '• 1 large frozen banana',
      '• 1/2 cup fresh or frozen blueberries',
      '• 1 cup almond milk',
      '• 1 tbsp chia seeds',
    ];
    
    ingredients.forEach(ingredient => {
      doc.text(ingredient, 25, yPosition);
      yPosition += 5;
    });
    
    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Instructions:', 20, yPosition);
    yPosition += 7;
    
    doc.setFont('helvetica', 'normal');
    const instructions = [
      '1. Blend all ingredients until smooth (2 mins)',
      '2. Pour into bowl and add desired toppings (1 min)',
      '3. Serve immediately for best texture',
    ];
    
    instructions.forEach(instruction => {
      const instLines = doc.splitTextToSize(instruction, 170);
      doc.text(instLines, 25, yPosition);
      yPosition += instLines.length * 5 + 2;
    });
  }
  
  // Shopping list section
  if (options.includeShoppingList) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFontSize(16);
    doc.setTextColor(primaryColor);
    doc.text('Shopping List', 20, yPosition);
    yPosition += 15;
    
    // Sample shopping items
    const shoppingItems = {
      'Produce': [
        { name: 'Spinach', quantity: '2 cups' },
        { name: 'Banana', quantity: '1 large' },
        { name: 'Blueberries', quantity: '1/2 cup' },
      ],
      'Pantry': [
        { name: 'Almond milk', quantity: '1 cup' },
        { name: 'Chia seeds', quantity: '1 tbsp' },
      ],
    };
    
    Object.entries(shoppingItems).forEach(([category, items]) => {
      doc.setFontSize(12);
      doc.setTextColor(secondaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text(category, 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setTextColor('#000000');
      doc.setFont('helvetica', 'normal');
      
      items.forEach(item => {
        doc.text(`☐ ${item.name} - ${item.quantity}`, 25, yPosition);
        yPosition += 6;
      });
      
      yPosition += 5;
    });
  }
  
  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor('#666666');
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
  }
  
  // Return PDF as buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(new Uint8Array(pdfOutput));
}

export const runtime = 'nodejs';
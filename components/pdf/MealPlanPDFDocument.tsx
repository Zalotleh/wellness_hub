import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Roboto',
  src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.ttf',
});

Font.register({
  family: 'Roboto-Bold',
  src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.ttf',
});

// Define styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 11,
    paddingTop: 30,
    paddingLeft: 60,
    paddingRight: 60,
    paddingBottom: 60,
    lineHeight: 1.5,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#16a34a',
  },
  heading: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#16a34a',
  },
  subheading: {
    fontSize: 14,
    fontFamily: 'Roboto-Bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#15803d',
  },
  text: {
    fontSize: 11,
    marginBottom: 5,
    lineHeight: 1.4,
  },
  dateRange: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
  },
  infoContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontFamily: 'Roboto-Bold',
    width: 120,
  },
  infoValue: {
    flex: 1,
  },
  dayContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fafafa',
    borderRadius: 5,
  },
  dayHeader: {
    fontSize: 14,
    fontFamily: 'Roboto-Bold',
    marginBottom: 10,
    color: '#15803d',
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 5,
  },
  mealContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 3,
    border: '1 solid #e5e7eb',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  mealType: {
    fontSize: 12,
    fontFamily: 'Roboto-Bold',
    color: '#374151',
    textTransform: 'uppercase',
    backgroundColor: '#e5e7eb',
    padding: '2 6',
    borderRadius: 2,
  },
  mealName: {
    fontSize: 12,
    fontFamily: 'Roboto-Bold',
    flex: 1,
    marginLeft: 10,
  },
  mealTime: {
    fontSize: 10,
    color: '#6b7280',
  },
  mealDescription: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 3,
  },
  systemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  systemTag: {
    fontSize: 9,
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '2 6',
    borderRadius: 2,
    marginRight: 5,
    marginBottom: 2,
  },
  recipeContainer: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#ffffff',
    border: '1 solid #e5e7eb',
    borderRadius: 5,
  },
  recipeTitle: {
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    marginBottom: 8,
    color: '#16a34a',
  },
  recipeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    fontSize: 10,
    color: '#6b7280',
  },
  recipeSection: {
    marginBottom: 12,
  },
  recipeSectionTitle: {
    fontSize: 12,
    fontFamily: 'Roboto-Bold',
    marginBottom: 5,
    color: '#374151',
  },
  ingredientItem: {
    fontSize: 10,
    marginBottom: 3,
    paddingLeft: 10,
  },
  instructionItem: {
    fontSize: 10,
    marginBottom: 5,
    paddingLeft: 10,
    lineHeight: 1.4,
  },
  shoppingContainer: {
    marginBottom: 20,
  },
  categoryContainer: {
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 12,
    fontFamily: 'Roboto-Bold',
    marginBottom: 8,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 3,
  },
  shoppingItem: {
    fontSize: 10,
    marginBottom: 3,
    paddingLeft: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  checkbox: {
    width: 8,
    height: 8,
    border: '1 solid #6b7280',
    marginRight: 8,
    marginTop: 1,
  },
  nutritionContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 3,
  },
  nutritionTitle: {
    fontSize: 10,
    fontFamily: 'Roboto-Bold',
    marginBottom: 5,
    color: '#0369a1',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    marginBottom: 2,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#6b7280',
  },
});

interface MealPlanPDFProps {
  mealPlan: any;
  user: any;
  shoppingList?: any;
  options: {
    includeRecipes: boolean;
    includeShoppingList: boolean;
    includeNutrition: boolean;
  };
}

const MealPlanPDFDocument: React.FC<MealPlanPDFProps> = ({
  mealPlan,
  user,
  shoppingList,
  options,
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <Document>
      {/* Title Page */}
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.title}>{mealPlan.title}</Text>
          <Text style={styles.dateRange}>
            {formatDateRange(mealPlan.weekStart, mealPlan.weekEnd)}
          </Text>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created by:</Text>
              <Text style={styles.infoValue}>{user.name || user.email}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Default Servings:</Text>
              <Text style={styles.infoValue}>{mealPlan.defaultServings}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={styles.infoValue}>{mealPlan.status}</Text>
            </View>
            
            {mealPlan.description && (
              <View style={[styles.infoRow, { marginTop: 10 }]}>
                <Text style={styles.infoLabel}>Description:</Text>
                <Text style={styles.infoValue}>{mealPlan.description}</Text>
              </View>
            )}
          </View>

          {mealPlan.dietaryRestrictions && mealPlan.dietaryRestrictions.length > 0 && (
            <View style={styles.infoContainer}>
              <Text style={styles.subheading}>Dietary Restrictions</Text>
              <Text style={styles.text}>
                {mealPlan.dietaryRestrictions.join(', ')}
              </Text>
            </View>
          )}

          {mealPlan.focusSystems && mealPlan.focusSystems.length > 0 && (
            <View style={styles.infoContainer}>
              <Text style={styles.subheading}>Focus Systems</Text>
              <Text style={styles.text}>
                {mealPlan.focusSystems.join(', ')}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>

      {/* Meal Plan Overview */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>Weekly Meal Plan</Text>
        
        {mealPlan.dailyMenus.map((dayMenu: any, index: number) => (
          <View key={index} style={styles.dayContainer}>
            <Text style={styles.dayHeader}>
              {formatDate(dayMenu.date)}
            </Text>
            
            {dayMenu.meals.map((meal: any, mealIndex: number) => (
              <View key={mealIndex} style={styles.mealContainer}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealType}>{meal.type}</Text>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  {meal.prepTime && (
                    <Text style={styles.mealTime}>Prep: {meal.prepTime}</Text>
                  )}
                </View>
                
                {meal.description && (
                  <Text style={styles.mealDescription}>{meal.description}</Text>
                )}
                
                {meal.defenseSystems && meal.defenseSystems.length > 0 && (
                  <View style={styles.systemsContainer}>
                    {meal.defenseSystems.map((system: string, sysIndex: number) => (
                      <Text key={sysIndex} style={styles.systemTag}>
                        {system}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>

      {/* Recipes Section */}
      {options.includeRecipes && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.heading}>Recipes</Text>
          
          {mealPlan.dailyMenus.map((dayMenu: any) =>
            dayMenu.meals.map((meal: any) =>
              meal.generatedRecipes?.map((recipe: any, recipeIndex: number) => (
                <View key={recipeIndex} style={styles.recipeContainer}>
                  <Text style={styles.recipeTitle}>{recipe.name}</Text>
                  
                  <View style={styles.recipeInfo}>
                    <Text>Servings: {recipe.servings}</Text>
                    <Text>Prep: {recipe.prepTime}</Text>
                    <Text>Cook: {recipe.cookTime}</Text>
                    <Text>Total: {recipe.totalTime}</Text>
                  </View>
                  
                  {recipe.description && (
                    <Text style={styles.text}>{recipe.description}</Text>
                  )}
                  
                  <View style={styles.recipeSection}>
                    <Text style={styles.recipeSectionTitle}>Ingredients</Text>
                    {recipe.ingredients?.map((ingredient: any, ingIndex: number) => (
                      <Text key={ingIndex} style={styles.ingredientItem}>
                        • {ingredient.quantity} {ingredient.unit} {ingredient.item}
                        {ingredient.notes && ` (${ingredient.notes})`}
                      </Text>
                    ))}
                  </View>
                  
                  <View style={styles.recipeSection}>
                    <Text style={styles.recipeSectionTitle}>Instructions</Text>
                    {recipe.instructions?.map((instruction: any, instIndex: number) => (
                      <Text key={instIndex} style={styles.instructionItem}>
                        {instruction.step}. {instruction.instruction}
                        {instruction.time && ` (${instruction.time})`}
                      </Text>
                    ))}
                  </View>

                  {options.includeNutrition && (recipe.calories || recipe.protein) && (
                    <View style={styles.nutritionContainer}>
                      <Text style={styles.nutritionTitle}>Nutrition Information</Text>
                      {recipe.calories && (
                        <View style={styles.nutritionRow}>
                          <Text>Calories:</Text>
                          <Text>{recipe.calories}</Text>
                        </View>
                      )}
                      {recipe.protein && (
                        <View style={styles.nutritionRow}>
                          <Text>Protein:</Text>
                          <Text>{recipe.protein}g</Text>
                        </View>
                      )}
                      {recipe.carbs && (
                        <View style={styles.nutritionRow}>
                          <Text>Carbohydrates:</Text>
                          <Text>{recipe.carbs}g</Text>
                        </View>
                      )}
                      {recipe.fat && (
                        <View style={styles.nutritionRow}>
                          <Text>Fat:</Text>
                          <Text>{recipe.fat}g</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))
            )
          )}

          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            fixed
          />
        </Page>
      )}

      {/* Shopping List Section */}
      {options.includeShoppingList && shoppingList && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.heading}>Shopping List</Text>
          
          <View style={styles.shoppingContainer}>
            {/* Group items by category */}
            {Object.entries(
              (shoppingList.items || []).reduce((acc: any, item: any) => {
                const category = item.category || 'Other';
                if (!acc[category]) acc[category] = [];
                acc[category].push(item);
                return acc;
              }, {})
            ).map(([category, items]: [string, any]) => (
              <View key={category} style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {items.map((item: any, itemIndex: number) => (
                  <View key={itemIndex} style={styles.shoppingItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={styles.checkbox} />
                      <Text>
                        {item.ingredient} - {item.quantity} {item.unit}
                      </Text>
                    </View>
                    {item.estimatedCost && (
                      <Text>${item.estimatedCost.toFixed(2)}</Text>
                    )}
                  </View>
                ))}
              </View>
            ))}
            
            {shoppingList.totalCost && (
              <View style={[styles.infoContainer, { marginTop: 20 }]}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Total Items:</Text>
                  <Text style={styles.infoValue}>{shoppingList.totalItems}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Estimated Total:</Text>
                  <Text style={styles.infoValue}>${shoppingList.totalCost.toFixed(2)}</Text>
                </View>
              </View>
            )}
          </View>

          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            fixed
          />
        </Page>
      )}
    </Document>
  );
};

export default MealPlanPDFDocument;
import PDFExportButton from '@/components/pdf/PDFExportButton';

export default function PDFTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              PDF Export Test
            </h1>
            <p className="text-gray-600 dark:text-gray-200">
              Test the PDF export functionality with different formats and options
            </p>
          </div>

          <div className="space-y-6">
            {/* Meal Plan Info */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                Sample Meal Plan
              </h2>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Title:</strong> Weekly Wellness Plan</p>
                <p><strong>Duration:</strong> 7 days</p>
                <p><strong>Servings:</strong> 4 people</p>
                <p><strong>Focus:</strong> Defense system foods & nutrition</p>
              </div>
            </div>

            {/* Export Options */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Export Options
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">React PDF</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Professional styling</li>
                    <li>• Custom fonts & layouts</li>
                    <li>• High-quality output</li>
                    <li>• Server-side generation</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-2">jsPDF</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Fast generation</li>
                    <li>• Client-side processing</li>
                    <li>• Good compatibility</li>
                    <li>• Basic formatting</li>
                  </ul>
                </div>
              </div>

              {/* Export Button */}
              <div className="flex justify-center">
                <PDFExportButton
                  mealPlanId="test-meal-plan-001"
                  mealPlanTitle="Weekly Wellness Plan"
                  className="mx-auto"
                  onExportStart={() => console.log('Export started')}
                  onExportComplete={() => console.log('Export completed')}
                  onExportError={(error) => console.error('Export error:', error)}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">How to Test</h4>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                <li>Click the "Export PDF" button above</li>
                <li>Choose "Options" to customize export settings</li>
                <li>Select the PDF format (React PDF or jsPDF)</li>
                <li>Toggle content options (recipes, shopping list, nutrition)</li>
                <li>Click "Export with Options" to generate</li>
                <li>Check the console for any errors</li>
              </ol>
            </div>

            {/* Technical Notes */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h4 className="font-medium text-yellow-900 mb-2">Technical Notes</h4>
              <div className="text-sm text-yellow-800 space-y-1">
                <p><strong>React PDF Route:</strong> <code>/api/meal-planner/[id]/export/pdf</code></p>
                <p><strong>jsPDF Route:</strong> <code>/api/meal-planner/[id]/export/pdf-jspdf</code></p>
                <p><strong>Mock Data:</strong> Uses sample meal plan data for testing</p>
                <p><strong>Authentication:</strong> Requires valid session</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
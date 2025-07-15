import React, { useState, useEffect } from 'react';
import { squareService } from '../services/squareService';

const SquareAPITest: React.FC = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceResults, setServiceResults] = useState<any>(null);

  const accessToken = process.env.REACT_APP_SQUARE_ACCESS_TOKEN || '';
  const baseUrl = 'https://connect.squareupsandbox.com/v2';

  // Test using the actual service methods
  const testSquareService = async () => {
    setLoading(true);
    setError(null);
    setServiceResults(null);

    try {
      console.log('Testing Square Service methods...');
      
      const [products, categories, locations] = await Promise.all([
        squareService.getProducts().catch(err => ({ error: err.message })),
        squareService.getCategories().catch(err => ({ error: err.message })),
        squareService.getSquareLocations().catch(err => ({ error: err.message }))
      ]);

      setServiceResults({
        products: Array.isArray(products) ? { count: products.length, data: products.slice(0, 3) } : products,
        categories: Array.isArray(categories) ? { count: categories.length, data: categories } : categories,
        locations: Array.isArray(locations) ? { count: locations.length, data: locations } : locations
      });

    } catch (err: any) {
      console.error('Error testing Square Service:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Auto-run service test on component mount
  useEffect(() => {
    testSquareService();
  }, []);

  const testSquareAPI = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('Testing Square API with token:', accessToken ? 'Token present' : 'No token');
      console.log('Base URL:', baseUrl);

      // Test 1: Check locations
      console.log('Testing locations endpoint...');
      const locationsResponse = await fetch(`${baseUrl}/locations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18'
        }
      });

      console.log('Locations response status:', locationsResponse.status);
      const locationsData = await locationsResponse.json();
      console.log('Locations data:', locationsData);

      // Test 2: Check catalog items
      console.log('Testing catalog items endpoint...');
      const catalogResponse = await fetch(`${baseUrl}/catalog/list`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18'
        },
        body: JSON.stringify({
          types: ['ITEM']
        })
      });

      console.log('Catalog response status:', catalogResponse.status);
      const catalogData = await catalogResponse.json();
      console.log('Catalog data:', catalogData);

      // Test 3: Check categories
      console.log('Testing catalog categories endpoint...');
      const categoriesResponse = await fetch(`${baseUrl}/catalog/list`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18'
        },
        body: JSON.stringify({
          types: ['CATEGORY']
        })
      });

      console.log('Categories response status:', categoriesResponse.status);
      const categoriesData = await categoriesResponse.json();
      console.log('Categories data:', categoriesData);

      setResults({
        locations: {
          status: locationsResponse.status,
          data: locationsData
        },
        catalog: {
          status: catalogResponse.status,
          data: catalogData
        },
        categories: {
          status: categoriesResponse.status,
          data: categoriesData
        }
      });

    } catch (err: any) {
      console.error('Error testing Square API:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Square API Diagnostic Tool</h2>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Environment Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><strong>Access Token:</strong> {accessToken ? `${accessToken.substring(0, 10)}...` : 'Not configured'}</div>
          <div><strong>Environment:</strong> {process.env.REACT_APP_SQUARE_ENVIRONMENT || 'Not set'}</div>
          <div><strong>Application ID:</strong> {process.env.REACT_APP_SQUARE_APPLICATION_ID ? 'Configured' : 'Not configured'}</div>
          <div><strong>Base URL:</strong> {baseUrl}</div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={testSquareService}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Square Service'}
        </button>
        
        <button
          onClick={testSquareAPI}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Direct API'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Service Test Results */}
      {serviceResults && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">Square Service Test Results</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-bold mb-2 text-green-700">Products</h4>
              {serviceResults.products.error ? (
                <div className="text-red-600">
                  <strong>Error:</strong> {serviceResults.products.error}
                </div>
              ) : (
                <div>
                  <p><strong>Count:</strong> {serviceResults.products.count}</p>
                  <pre className="mt-2 text-xs overflow-auto max-h-40">
                    {JSON.stringify(serviceResults.products.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-bold mb-2 text-blue-700">Categories</h4>
              {serviceResults.categories.error ? (
                <div className="text-red-600">
                  <strong>Error:</strong> {serviceResults.categories.error}
                </div>
              ) : (
                <div>
                  <p><strong>Count:</strong> {serviceResults.categories.count}</p>
                  <pre className="mt-2 text-xs overflow-auto max-h-40">
                    {JSON.stringify(serviceResults.categories.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-bold mb-2 text-purple-700">Locations</h4>
              {serviceResults.locations.error ? (
                <div className="text-red-600">
                  <strong>Error:</strong> {serviceResults.locations.error}
                </div>
              ) : (
                <div>
                  <p><strong>Count:</strong> {serviceResults.locations.count}</p>
                  <pre className="mt-2 text-xs overflow-auto max-h-40">
                    {JSON.stringify(serviceResults.locations.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Direct API Test Results */}
      {results && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Direct API Test Results</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-100 rounded">
              <h4 className="font-bold mb-2 text-orange-700">Locations API</h4>
              <p><strong>Status:</strong> <span className={results.locations.status === 200 ? 'text-green-600' : 'text-red-600'}>{results.locations.status}</span></p>
              <pre className="mt-2 text-xs overflow-auto max-h-40">
                {JSON.stringify(results.locations.data, null, 2)}
              </pre>
            </div>

            <div className="p-4 bg-gray-100 rounded">
              <h4 className="font-bold mb-2 text-orange-700">Catalog Items API</h4>
              <p><strong>Status:</strong> <span className={results.catalog.status === 200 ? 'text-green-600' : 'text-red-600'}>{results.catalog.status}</span></p>
              <pre className="mt-2 text-xs overflow-auto max-h-40">
                {JSON.stringify(results.catalog.data, null, 2)}
              </pre>
            </div>

            <div className="p-4 bg-gray-100 rounded">
              <h4 className="font-bold mb-2 text-orange-700">Categories API</h4>
              <p><strong>Status:</strong> <span className={results.categories.status === 200 ? 'text-green-600' : 'text-red-600'}>{results.categories.status}</span></p>
              <pre className="mt-2 text-xs overflow-auto max-h-40">
                {JSON.stringify(results.categories.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Summary and Recommendations */}
      {(serviceResults || results) && (
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-xl font-bold mb-4 text-yellow-800">Diagnostic Summary</h3>
          <div className="space-y-2 text-sm">
            {!accessToken && (
              <div className="text-red-600">❌ <strong>Critical:</strong> Square access token is not configured</div>
            )}
            {serviceResults?.products?.error && (
              <div className="text-red-600">❌ <strong>Products Error:</strong> {serviceResults.products.error}</div>
            )}
            {serviceResults?.categories?.error && (
              <div className="text-red-600">❌ <strong>Categories Error:</strong> {serviceResults.categories.error}</div>
            )}
            {serviceResults?.locations?.error && (
              <div className="text-red-600">❌ <strong>Locations Error:</strong> {serviceResults.locations.error}</div>
            )}
            {serviceResults && !serviceResults.products?.error && serviceResults.products?.count === 0 && (
              <div className="text-orange-600">⚠️ <strong>Warning:</strong> No products found in Square catalog</div>
            )}
            {serviceResults && !serviceResults.categories?.error && serviceResults.categories?.count === 0 && (
              <div className="text-orange-600">⚠️ <strong>Warning:</strong> No categories found in Square catalog</div>
            )}
            {serviceResults && !serviceResults.locations?.error && serviceResults.locations?.count === 0 && (
              <div className="text-orange-600">⚠️ <strong>Warning:</strong> No locations found in Square</div>
            )}
            {serviceResults && !serviceResults.products?.error && serviceResults.products?.count > 0 && (
              <div className="text-green-600">✅ <strong>Success:</strong> Found {serviceResults.products.count} products</div>
            )}
            {serviceResults && !serviceResults.categories?.error && serviceResults.categories?.count > 0 && (
              <div className="text-green-600">✅ <strong>Success:</strong> Found {serviceResults.categories.count} categories</div>
            )}
            {serviceResults && !serviceResults.locations?.error && serviceResults.locations?.count > 0 && (
              <div className="text-green-600">✅ <strong>Success:</strong> Found {serviceResults.locations.count} locations</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SquareAPITest;
// Test script to verify CSV upload API
// Run this in browser console on the deployed site to test the API

async function testCSVUploadAPI() {
  console.log('🧪 Testing CSV upload API...');
  
  // Create a simple test CSV
  const csvContent = `Title,Pinterest URL,Image URL,Description
Test Recipe,https://pinterest.com/pin/123456789,https://example.com/image.jpg,Test description`;
  
  // Create a test file
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const file = new File([blob], 'test.csv', { type: 'text/csv' });
  
  // Create form data
  const formData = new FormData();
  formData.append('csvFile', file);
  formData.append('website', JSON.stringify({
    domain: 'test.com',
    name: 'Test Website',
    active: true
  }));
  
  try {
    console.log('📤 Sending test request...');
    const response = await fetch('/api/recipes/upload-csv', {
      method: 'POST',
      body: formData
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.text();
    console.log('📊 Response body:', result);
    
    if (!response.ok) {
      console.error('❌ API test failed:', response.status, result);
    } else {
      console.log('✅ API test successful!');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Run the test
testCSVUploadAPI();

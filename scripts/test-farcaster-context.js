// scripts/test-farcaster-context.js

// This is a simple test to see what the Farcaster context contains
// Run this in the browser console when the Farcaster Mini App is loaded

console.log('🔍 Testing Farcaster context...');

// Test if we can access the Farcaster SDK
if (typeof window !== 'undefined' && window.miniapp) {
  console.log('✅ Farcaster SDK available:', window.miniapp);
  
  // Try to get context
  window.miniapp.sdk.context.then(context => {
    console.log('📋 Farcaster context:', context);
    
    // Check for user information
    if (context && typeof context === 'object') {
      console.log('🔍 Context keys:', Object.keys(context));
      
      if ('user' in context) {
        console.log('👤 User info:', context.user);
      }
      
      if ('fid' in context) {
        console.log('🆔 FID:', context.fid);
      }
      
      if ('handle' in context) {
        console.log('🏷️ Handle:', context.handle);
      }
    }
  }).catch(error => {
    console.error('❌ Error getting context:', error);
  });
  
  // Try to get wallet info
  window.miniapp.sdk.wallet.ethProvider.request({ method: 'eth_accounts' }).then(accounts => {
    console.log('💰 Connected accounts:', accounts);
  }).catch(error => {
    console.error('❌ Error getting accounts:', error);
  });
  
} else {
  console.log('❌ Farcaster SDK not available');
}

// Test handle resolution API
async function testHandleResolution(address) {
  try {
    const response = await fetch(`/api/user-stats/${address}`);
    const data = await response.json();
    console.log(`📊 Handle resolution for ${address}:`, {
      handle: data.handle,
      displayName: data.displayName,
      handleSource: data.handleSource
    });
  } catch (error) {
    console.error('❌ Error testing handle resolution:', error);
  }
}

// Test with a known address
testHandleResolution('0x5e2e23CF4D3BE0E6e8770c55E462eebf047EC09e');

console.log('🧪 Test script loaded. Check console for results.');

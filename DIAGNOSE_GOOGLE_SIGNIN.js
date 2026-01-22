// Run this in browser console (F12) on http://localhost:3000/login
// This will diagnose the Google Sign-In issue

console.log('=== Google Sign-In Diagnostic ===');
console.log('');

// 1. Check Client ID
const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
console.log('1. Client ID from .env:', clientId);
console.log('   Expected: 299924190094-sgqlqeoc6fa0mt70g1s6j6kbht2sn2u7.apps.googleusercontent.com');
console.log('   Match:', clientId === '299924190094-sgqlqeoc6fa0mt70g1s6j6kbht2sn2u7.apps.googleusercontent.com');
console.log('');

// 2. Check Origin
const origin = window.location.origin;
console.log('2. Current Origin:', origin);
console.log('   Expected: http://localhost:3000');
console.log('   Match:', origin === 'http://localhost:3000');
console.log('');

// 3. Check Google Script
console.log('3. Google Script Loaded:');
console.log('   window.google:', !!window.google);
console.log('   window.google.accounts:', !!(window.google && window.google.accounts));
console.log('   window.google.accounts.id:', !!(window.google && window.google.accounts && window.google.accounts.id));
console.log('');

// 4. Test Google API directly
if (window.google && window.google.accounts) {
  console.log('4. Testing Google API:');
  try {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: () => {},
    });
    console.log('   ✅ Initialize successful');
  } catch (error) {
    console.log('   ❌ Initialize failed:', error);
  }
  
  // Try to get status
  fetch(`https://accounts.google.com/gsi/status?client_id=${clientId}`)
    .then(response => {
      console.log('   Status check response:', response.status, response.statusText);
      return response.text();
    })
    .then(text => {
      console.log('   Status response:', text);
    })
    .catch(error => {
      console.log('   Status check error:', error);
    });
} else {
  console.log('4. Google API not available');
}
console.log('');

// 5. Check for multiple origins
console.log('5. Recommendations:');
console.log('   - Verify in Google Cloud Console that http://localhost:3000 is in Authorized JavaScript origins');
console.log('   - Make sure there are no spaces or trailing slashes');
console.log('   - Wait 15-20 minutes after making changes');
console.log('   - Try in Incognito window');
console.log('   - Check if you have multiple OAuth clients');


require('dotenv').config();

// Read integration key from .env
const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;

// Try several redirect URIs that might work
const redirectOptions = [
  'http://localhost:3000/callback',
  'http://localhost:3000/docusign/callback',
  'http://localhost:3000', 
  'http://localhost'
];

console.log('\nTry these DocuSign JWT Consent URLs one by one:');
console.log('----------------------------------------------');

// Generate multiple consent URLs to try
redirectOptions.forEach((redirect, index) => {
  const scopes = encodeURIComponent('signature impersonation');
  const encodedRedirect = encodeURIComponent(redirect);
  const consentUrl = `https://account-d.docusign.com/oauth/auth?response_type=code&scope=${scopes}&client_id=${integrationKey}&redirect_uri=${encodedRedirect}`;
  
  console.log(`\nOption ${index + 1}: ${redirect}`);
  console.log(consentUrl);
});

console.log('\nVisit these URLs one by one in your browser while logged in as admin.');
console.log('If one works, your browser will be redirected to your callback URL with a code parameter.');
#!/usr/bin/env node

import { getAuth, validateToken, testAuth, getTokenScopes } from './lib/auth.mjs';
import { formatError } from './utils/errors.mjs';

async function debugAuth() {
  console.log('GitHub Authentication Debugging\n');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Get token
    const token = getAuth();
    
    if (!token) {
      console.error('❌ No authentication token found!');
      console.log('\nPlease set one of these environment variables:');
      console.log('  - GITHUB_TOKEN');
      console.log('  - GH_TOKEN');
      console.log('  - GITHUB_PERSONAL_ACCESS_TOKEN');
      console.log('  - GITHUB_PAT');
      process.exit(1);
    }
    
    console.log('✅ Token found in environment');
    
    // Step 2: Validate token format
    console.log('\nValidating token format...');
    const tokenPreview = token.substring(0, 10) + '...' + token.substring(token.length - 4);
    console.log(`  Token preview: ${tokenPreview}`);
    console.log(`  Token length: ${token.length}`);
    
    const isValid = validateToken(token);
    if (!isValid) {
      console.error('❌ Token format is invalid!');
      console.log('\nValid formats:');
      console.log('  - Classic PAT: ghp_ followed by 36 characters');
      console.log('  - Fine-grained PAT: github_pat_ followed by alphanumeric');
      console.log('  - Legacy: 40 hexadecimal characters');
      process.exit(1);
    }
    
    console.log('✅ Token format is valid');
    
    // Step 3: Test authentication with GitHub API
    console.log('\nTesting authentication with GitHub API...');
    const user = await testAuth(token);
    
    console.log('✅ Authentication successful!');
    console.log(`  User: ${user.login}`);
    console.log(`  Name: ${user.name || 'N/A'}`);
    console.log(`  Email: ${user.email || 'N/A'}`);
    console.log(`  ID: ${user.id}`);
    
    // Step 4: Check token scopes
    console.log('\nChecking token permissions/scopes...');
    const scopes = await getTokenScopes(token);
    
    if (scopes.length > 0) {
      console.log('✅ Token scopes:');
      scopes.forEach(scope => console.log(`  - ${scope}`));
    } else {
      console.log('⚠️  No scopes detected (might be a fine-grained PAT)');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Authentication is working correctly!');
    
  } catch (error) {
    console.error('\n❌ Authentication failed!');
    console.error('Error:', formatError(error));
    
    if (error.name === 'AuthError') {
      console.log('\nPossible causes:');
      console.log('  1. Token has expired');
      console.log('  2. Token has been revoked');
      console.log('  3. Token is incorrect/malformed');
      console.log('  4. Network issues connecting to GitHub');
      
      console.log('\nTo fix:');
      console.log('  1. Generate a new token at: https://github.com/settings/tokens');
      console.log('  2. Update your environment variable');
      console.log('  3. Ensure the token has the necessary permissions');
    }
    
    process.exit(1);
  }
}

// Only run the debug function when this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  debugAuth().catch(console.error);
}
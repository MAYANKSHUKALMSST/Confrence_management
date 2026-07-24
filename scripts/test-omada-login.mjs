import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const {
  OMADA_BASE_URL,
  OMADA_USERNAME,
  OMADA_PASSWORD
} = process.env;

async function testLogin() {
  console.log(`Testing Omada login for ${OMADA_USERNAME} at ${OMADA_BASE_URL}...`);

  // Create a custom agent to allow self-signed certificates
  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  try {
    // Note: In Node.js, to use a custom agent with global fetch, 
    // you have to pass it differently or use a library. 
    // However, for testing purposes, we can set an environment variable 
    // to allow unauthorized certs globally if needed, 
    // but passing agent is preferred.
    // In Node 18+ global fetch, passing an agent is NOT directly supported via options.
    // Instead, we might need to use node-fetch or undici if we want agent control.
    // OR we can use the NODE_TLS_REJECT_UNAUTHORIZED=0 env var.

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const response = await fetch(`${OMADA_BASE_URL}/api/v2/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: OMADA_USERNAME,
        password: OMADA_PASSWORD
      })
    });

    const data = await response.json();

    if (data.errorCode === 0) {
      console.log('✅ Log in successfully.');
      console.log('Result:', JSON.stringify(data.result, null, 2));
    } else {
      console.error('❌ Login failed.');
      console.error('Error:', data.msg || 'Unknown error');
      console.error('Full response:', data);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testLogin();

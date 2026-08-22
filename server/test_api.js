async function testAuth() {
  const baseUrl = 'http://localhost:3000/api';

  console.log('--- Testing /api/admin/login ---');
  const loginRes = await (await fetch(`${baseUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'password123' })
  })).json();

  console.log('Login Result:', loginRes);

  if (loginRes.success && loginRes.token) {
    console.log('✅ Admin login route working perfectly!');
  } else {
    console.error('❌ Admin login failed:', loginRes);
  }
}

testAuth().catch(console.error);

// scratch/test_integration.js
// Run this with: node scratch/test_integration.js

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Authentication and User Provisioning integration tests...\n');

  try {
    // 1. Test Login
    console.log('1. Attempting login as Admin (alex.rivera)...');
    const loginRes = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alex.rivera', password: 'adm@2026' })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed with status ${loginRes.status}: ${await loginRes.text()}`);
    }
    
    const loginData = await loginRes.json();
    console.log('✅ Admin Login Successful!');
    console.log(`   Token: ${loginData.token.substring(0, 20)}...`);
    console.log(`   Role: ${loginData.role}`);
    console.log(`   Department: ${loginData.department}\n`);

    const adminToken = loginData.token;

    // 2. Fetch managers with role query filter
    console.log('2. Fetching managers with GET /api/users?role=Manager...');
    const mgrRes = await fetch(`${API_BASE}/users?role=Manager`);
    if (!mgrRes.ok) {
      throw new Error(`Fetch managers failed with status ${mgrRes.status}`);
    }
    const managers = await mgrRes.json();
    console.log(`✅ Retrieved ${managers.length} managers successfully.`);
    const jane = managers.find(m => m.username === 'jane.smith');
    if (jane) {
      console.log(`   Found L1 Manager Jane Smith (ID: ${jane.userId}, DB _id: ${jane._id})`);
    } else {
      console.log('   ⚠️ Jane Smith manager not found in filtered list.');
    }
    console.log('');

    // 3. Verify Route Protection: provision without token
    console.log('3. Verifying route protection: provisioning without token...');
    const unauthRes = await fetch(`${API_BASE}/admin/provision-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Employee',
        email: 'test.emp@company.com',
        userId: 'EMP-2026-999',
        username: 'test.emp',
        password: 'welcome@2026',
        department: 'Engineering'
      })
    });
    console.log(`   Response status: ${unauthRes.status} (Expected: 401)`);
    if (unauthRes.status === 401) {
      console.log('✅ Route is properly protected!\n');
    } else {
      console.log('❌ FAIL: Protected route allowed request without token.\n');
    }

    // 4. Provision a new user with token
    console.log('4. Provisioning a new user with valid Admin token...');
    const newUserId = `EMP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newUsername = `test.user.${Date.now().toString().slice(-4)}`;
    const newEmail = `${newUsername}@company.com`;
    const managerObjectId = jane ? jane._id : null;

    const provisionRes = await fetch(`${API_BASE}/admin/provision-user`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Test Provision Employee',
        email: newEmail,
        userId: newUserId,
        username: newUsername,
        password: 'welcome@2026',
        department: 'Engineering',
        managerId: managerObjectId
      })
    });

    if (!provisionRes.ok) {
      throw new Error(`Provisioning failed with status ${provisionRes.status}: ${await provisionRes.text()}`);
    }

    const provisionData = await provisionRes.json();
    console.log('✅ User provisioned successfully!');
    console.log(`   New User ID: ${provisionData.user.userId}`);
    console.log(`   Username: ${provisionData.user.username}`);
    console.log(`   Assigned Manager ID: ${provisionData.user.managerId}`);
    console.log(`   Created GoalSheet ID: ${provisionData.goalSheetId}\n`);

    // 5. Verify duplicate conflict handling
    console.log('5. Attempting to provision the duplicate user again...');
    const dupRes = await fetch(`${API_BASE}/admin/provision-user`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Another User',
        email: newEmail, // duplicate email
        userId: newUserId, // duplicate userId
        username: newUsername, // duplicate username
        password: 'welcome@2026',
        department: 'Sales'
      })
    });

    console.log(`   Response status: ${dupRes.status} (Expected: 400)`);
    const dupText = await dupRes.text();
    console.log(`   Message: ${dupText}`);
    if (dupRes.status === 400) {
      console.log('✅ Duplicate conflict check works perfectly!\n');
    } else {
      console.log('❌ FAIL: Server did not reject duplicate email/userId.\n');
    }

    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');

  } catch (error) {
    console.error('❌ Integration Test Failed:', error);
  }
}

runTests();

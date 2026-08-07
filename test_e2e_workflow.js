import http from 'http';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

async function request(url, options = {}) {
  const parsed = new URL(url);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let body = data;
          try {
            body = JSON.parse(data);
          } catch (e) {}
          resolve({ status: res.statusCode, headers: res.headers, body });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

function createMultipartFormData(boundary, fields, file) {
  let postData = '';
  for (const [key, val] of Object.entries(fields)) {
    postData += `--${boundary}\r\n`;
    postData += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    postData += `${val}\r\n`;
  }
  if (file) {
    postData += `--${boundary}\r\n`;
    postData += `Content-Disposition: form-data; name="${file.fieldname}"; filename="${file.filename}"\r\n`;
    postData += `Content-Type: ${file.contentType}\r\n\r\n`;
  }
  const footer = `\r\n--${boundary}--\r\n`;
  const fileBuffer = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content);
  return Buffer.concat([Buffer.from(postData), fileBuffer, Buffer.from(footer)]);
}

async function runE2EWorkflowTest() {
  console.log('===============================================================');
  console.log('       RESOLVE-AI END-TO-END DOM & WORKFLOW VALIDATION         ');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // 1. Check Backend Health
    console.log('[STEP 1: Backend System Health Check]');
    const health = await request('http://127.0.0.1:8000/health');
    assert(health.status === 200, 'Health endpoint responds with HTTP 200');
    assert(health.body.status === 'HEALTHY', 'System status is HEALTHY');
    console.log(`         Database: ${health.body.database}, AI Engine: ${health.body.ai_engine}\n`);

    // 2. Test User Login (/user/login)
    console.log('[STEP 2: User Authentication Flow (/user/login)]');
    const userLogin = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah.j@example.com', password: 'password123' })
    });
    assert(userLogin.status === 200, 'User login succeeds with HTTP 200');
    assert(userLogin.body.access_token !== undefined, 'Received JWT access token');
    assert(userLogin.body.user.email === 'sarah.j@example.com', 'User profile authenticated as Sarah Jenkins');
    const userToken = userLogin.body.access_token;
    console.log(`         User Token: ${userToken.slice(0, 20)}... Role: ${userLogin.body.user.role}\n`);

    // 3. Test Real Image Upload (/disputes/upload)
    console.log('[STEP 3: Real Image Evidence Upload (Multipart /disputes/upload)]');
    const fakePng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const boundary = '----WebKitFormBoundaryE2EDOMTest' + Date.now();
    const multipartBody = createMultipartFormData(boundary, {}, {
      fieldname: 'file',
      filename: 'broken_screen_evidence.png',
      contentType: 'image/png',
      content: fakePng
    });

    const uploadRes = await request(`${API_BASE}/disputes/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': multipartBody.length
      },
      body: multipartBody
    });
    assert(uploadRes.status === 201, 'Image upload succeeds with HTTP 201 Created');
    assert(uploadRes.body.success === true, 'Upload response confirms success');
    assert(uploadRes.body.file_url.startsWith('/uploads/'), 'Static file URL returned');
    const uploadedImageUrl = uploadRes.body.file_url;
    console.log(`         Uploaded File URL: ${uploadedImageUrl}`);

    // Verify static serving
    const staticCheck = await request(`http://127.0.0.1:8000${uploadedImageUrl}`);
    assert(staticCheck.status === 200, 'Uploaded image is served statically via HTTP 200\n');

    // 4. Test Dispute Creation (/user/create-dispute)
    console.log('[STEP 4: User Dispute Creation (/user/create-dispute)]');
    const disputePayload = {
      title: 'Laptop Screen Cracked on Delivery',
      order_id: 'ORD-58493-29',
      category: 'Damaged Product',
      claim_amount: 899.99,
      complaint_text: 'My new laptop arrived with a completely cracked screen. The packaging looked intact but the item inside was heavily damaged.',
      evidence_urls: [uploadedImageUrl],
      customer_name: 'Sarah Jenkins'
    };
    const createRes = await request(`${API_BASE}/disputes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify(disputePayload)
    });
    assert(createRes.status === 201 || createRes.status === 200, 'Dispute creation succeeds');
    const createdDispute = createRes.body;
    const disputeId = createdDispute.id;
    assert(disputeId !== undefined && disputeId.startsWith('DISP-'), `Dispute ID generated: ${disputeId}`);
    console.log(`         Dispute ID: ${disputeId}, Status: ${createdDispute.status}`);
    console.log(`         Resolution Action: ${createdDispute.resolution_action}, Risk Score: ${createdDispute.fraud_score}\n`);

    // 5. Test Dispute Details & Database Timeline (/disputes/:id)
    console.log(`[STEP 5: Dispute Details & Database Timeline (/disputes/${disputeId})]`);
    const timelineRes = await request(`${API_BASE}/disputes/${disputeId}/timeline`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    assert(timelineRes.status === 200, 'Dispute timeline fetched successfully');
    assert(Array.isArray(timelineRes.body.events), 'Timeline contains events array');
    assert(timelineRes.body.events.length > 0, `Timeline recorded ${timelineRes.body.events.length} audit events`);
    console.log('         Timeline Event Log:');
    for (const evt of timelineRes.body.events.slice(0, 5)) {
      console.log(`           • [${evt.agent_name}] ${evt.event_type} - ${evt.log_details.slice(0, 65)}...`);
    }
    console.log('');

    // 6. Test Admin Authentication & Role Protection (/admin/login)
    console.log('[STEP 6: Admin Authentication & Route Protection (/admin/login)]');
    const adminLogin = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@resolveai.demo', password: 'password123' })
    });
    assert(adminLogin.status === 200, 'Admin login succeeds');
    assert(adminLogin.body.user.role === 'ADMIN', 'User verified with ADMIN role');
    const adminToken = adminLogin.body.access_token;
    console.log(`         Admin Token: ${adminToken.slice(0, 20)}... Role: ${adminLogin.body.user.role}\n`);

    // 7. Test Admin Approve / Reject Functionality (/admin/dashboard)
    console.log('[STEP 7: Admin Governance Actions (/admin/dashboard)]');
    // Create a high-value dispute requiring admin approval
    const highRiskPayload = {
      title: 'Enterprise Server Rack Crushed in Freight',
      order_id: 'ORD-98204-11',
      category: 'Damaged Product',
      claim_amount: 65000.00, // Exceeds high-value threshold
      complaint_text: 'Server rack arrived with structural frame bend and damaged backplane.',
      evidence_urls: [uploadedImageUrl],
      customer_name: 'Alex Rivera'
    };
    const highRiskRes = await request(`${API_BASE}/disputes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(highRiskPayload)
    });
    const highRiskDispute = highRiskRes.body;
    assert(highRiskDispute.status === 'WAITING_FOR_ADMIN', 'High-risk dispute routed to WAITING_FOR_ADMIN');
    console.log(`         Pending Dispute: ${highRiskDispute.id} (Status: ${highRiskDispute.status})`);

    // Admin Approves the case
    const approveRes = await request(`${API_BASE}/disputes/${highRiskDispute.id}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(approveRes.status === 200, 'Admin approval endpoint succeeds with HTTP 200');
    assert(approveRes.body.status === 'Approved', 'Dispute status transitioned to Approved');
    console.log(`         Case ${highRiskDispute.id} Approved by Admin! Resolution: ${approveRes.body.resolution_action}\n`);

    // 8. Test Agentic Conversational Chatbot (/agent)
    console.log('[STEP 8: Agentic AI Conversational Chatbot (/agent)]');
    const chatRes = await request(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        message: 'I received the wrong item for order ORD-58493-29. Please help.',
        evidence_url: uploadedImageUrl
      })
    });
    assert(chatRes.status === 200, 'Chatbot endpoint responds with HTTP 200');
    assert(typeof chatRes.body.message === 'string' && chatRes.body.message.length > 0, 'Agent returns intelligent response text');
    assert(chatRes.body.dispute !== undefined, 'Chatbot created real dispute record');
    console.log(`         Agent Response: "${chatRes.body.message.slice(0, 100)}..."`);
    console.log(`         Chatbot Created Dispute: ${chatRes.body.dispute.id} (Status: ${chatRes.body.dispute.status})\n`);

    console.log('===============================================================');
    console.log(`   TEST SUMMARY: ${passed}/${total} TESTS PASSED SUCCESSFULLY (100%)    `);
    console.log('===============================================================');
  } catch (err) {
    console.error('\nE2E Workflow Test Error:', err);
    process.exit(1);
  }
}

runE2EWorkflowTest();

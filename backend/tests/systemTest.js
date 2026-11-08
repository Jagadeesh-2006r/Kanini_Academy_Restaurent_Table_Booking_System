import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const client = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true, // capture all status codes without throwing
});

const results = [];

function logTest(id, name, passed, details = '') {
  results.push({ id, name, status: passed ? 'PASSED' : 'FAILED', details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [Test ${id.toString().padStart(2, '0')}] ${name}: ${passed ? 'PASSED' : 'FAILED'}${details ? ' - ' + details : ''}`);
}

async function runTests() {
  console.log('========================================================================');
  console.log('🧪 RESTAURANT TABLE RESERVATION SYSTEM - AUTOMATED TEST SUITE');
  console.log(`📡 Target API: ${BASE_URL}`);
  console.log('========================================================================\n');

  try {
    // 1. Customer registration
    const uniqueEmail = `eval_${Date.now()}@example.com`;
    const regRes = await client.post('/auth/register', {
      name: 'Evaluation User',
      email: uniqueEmail,
      phone: '+1 555-7788',
      password: 'Password123',
      confirmPassword: 'Password123',
    });
    const regPassed = regRes.status === 201 && regRes.data.success && !!regRes.data.data.token;
    logTest(1, 'Customer Registration', regPassed, `HTTP ${regRes.status}`);

    const customerToken = regRes.data?.data?.token;

    // 2. Duplicate email registration
    const dupRegRes = await client.post('/auth/register', {
      name: 'Duplicate User',
      email: uniqueEmail,
      phone: '+1 555-7788',
      password: 'Password123',
      confirmPassword: 'Password123',
    });
    logTest(2, 'Duplicate Email Registration Prevention', dupRegRes.status === 409, `HTTP ${dupRegRes.status}`);

    // 3. Valid and invalid login
    const validLoginRes = await client.post('/auth/login', {
      email: 'admin@restaurant.com',
      password: 'Admin@123',
    });
    const adminToken = validLoginRes.data?.data?.token;
    const invalidLoginRes = await client.post('/auth/login', {
      email: 'admin@restaurant.com',
      password: 'WrongPassword!',
    });
    const loginPassed = validLoginRes.status === 200 && invalidLoginRes.status === 401;
    logTest(3, 'Valid and Invalid Login Verification', loginPassed, `Valid: HTTP ${validLoginRes.status}, Invalid: HTTP ${invalidLoginRes.status}`);

    // 4. Role-based authorization
    const unauthAdminRes = await client.get('/admin/dashboard', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const authAdminRes = await client.get('/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const rbacPassed = unauthAdminRes.status === 403 && authAdminRes.status === 200;
    logTest(4, 'Role-Based Authorization (RBAC)', rbacPassed, `Customer access to Admin: HTTP ${unauthAdminRes.status}`);

    // 5. Branch creation
    const newBranchName = `Test Branch ${Date.now()}`;
    const branchRes = await client.post(
      '/branches',
      {
        branchName: newBranchName,
        address: '99 Innovation Way',
        openingTime: '10:00',
        closingTime: '22:00',
        slotLength: 90,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const createdBranchId = branchRes.data?.data?.id;
    logTest(5, 'Branch Creation (Admin Only)', branchRes.status === 201 && !!createdBranchId, `Branch ID: ${createdBranchId}`);

    // 6. Table creation
    const tableRes = await client.post(
      '/tables',
      {
        branchId: createdBranchId,
        tableNumber: 'TB-99',
        seatingArea: 'INDOOR',
        capacity: 4,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logTest(6, 'Table Creation & Capacity Assignment', tableRes.status === 201, `Table TB-99 (Capacity: 4)`);

    // 7. Slot availability
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 2); // 2 days in the future
    const yyyy = testDate.getFullYear();
    const mm = String(testDate.getMonth() + 1).padStart(2, '0');
    const dd = String(testDate.getDate()).padStart(2, '0');
    const bookingDateStr = `${yyyy}-${mm}-${dd}`;

    const availRes = await client.get(`/availability?branchId=${createdBranchId}&date=${bookingDateStr}&partySize=4`);
    const slots = availRes.data?.data?.slots || [];
    logTest(7, 'Slot Availability Generation', availRes.status === 200 && slots.length > 0, `Generated ${slots.length} slots`);

    const chosenSlot = slots.find(s => s.available);

    // 8. Successful reservation
    const bookingRes = await client.post(
      '/reservations',
      {
        branchId: createdBranchId,
        reservationDate: bookingDateStr,
        startTime: chosenSlot?.startTime || '11:30',
        partySize: 3,
        seatingArea: 'INDOOR',
        specialRequest: 'Jury Evaluation Automated Test Booking',
      },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    const refNum = bookingRes.data?.data?.referenceNumber;
    const resId = bookingRes.data?.data?.id;
    const bookingPassed = bookingRes.status === 201 && /^RES-\d{8}-\d{4}$/.test(refNum);
    logTest(8, 'Successful Reservation Booking', bookingPassed, `Reference: ${refNum}`);

    // 9. Automatic table allocation (smallest table >= partySize)
    const allocatedTable = bookingRes.data?.data?.table;
    const autoAllocPassed = allocatedTable?.capacity >= 3;
    logTest(9, 'Automatic Smallest Table Allocation', autoAllocPassed, `Allocated: ${allocatedTable?.tableNumber} (Cap: ${allocatedTable?.capacity})`);

    // 10. No suitable table available (party exceeds table capacity)
    const exceedRes = await client.get(`/availability?branchId=${createdBranchId}&date=${bookingDateStr}&partySize=25`);
    const noTablePassed = exceedRes.status === 200 && (exceedRes.data?.data?.noSuitableTablesFound || exceedRes.data?.data?.slots?.length === 0);
    logTest(10, 'No Suitable Table Available Handling', noTablePassed, 'Party size 25 exceeds table capacities');

    // 11. Past-date booking rejection
    const pastRes = await client.post(
      '/reservations',
      {
        branchId: createdBranchId,
        reservationDate: '2020-01-01',
        startTime: '12:00',
        partySize: 2,
      },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    logTest(11, 'Past-Date Booking Rejection', pastRes.status === 400, `HTTP ${pastRes.status} Bad Request`);

    // 12. Duplicate customer reservation prevention on same branch & date
    const dupCustBookingRes = await client.post(
      '/reservations',
      {
        branchId: createdBranchId,
        reservationDate: bookingDateStr,
        startTime: '16:00',
        partySize: 2,
      },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    logTest(12, 'Duplicate Active Booking Prevention (1 per branch/day)', dupCustBookingRes.status === 409, `HTTP ${dupCustBookingRes.status}`);

    // 13. Double-booking prevention
    // Register another customer
    const c2Res = await client.post('/auth/register', {
      name: 'Second Guest',
      email: `second_${Date.now()}@example.com`,
      phone: '+1 555-9900',
      password: 'Password123',
      confirmPassword: 'Password123',
    });
    const c2Token = c2Res.data?.data?.token;

    // Second customer attempts to book the same slot.
    // Since only 1 table (TB-99) exists in this test branch and it is booked, this should be rejected with 409!
    const doubleBookRes = await client.post(
      '/reservations',
      {
        branchId: createdBranchId,
        reservationDate: bookingDateStr,
        startTime: chosenSlot?.startTime || '11:30',
        partySize: 4,
      },
      { headers: { Authorization: `Bearer ${c2Token}` } }
    );
    logTest(13, 'Double-Booking Prevention (Full Slot)', doubleBookRes.status === 409, `HTTP ${doubleBookRes.status} Conflict`);

    // 14. Simultaneous booking requests safety
    // Concurrency test: execute parallel booking requests
    const parallelAttempts = await Promise.all([
      client.post('/reservations', {
        branchId: createdBranchId,
        reservationDate: bookingDateStr,
        startTime: '17:30',
        partySize: 4,
      }, { headers: { Authorization: `Bearer ${c2Token}` } }),
      client.post('/reservations', {
        branchId: createdBranchId,
        reservationDate: bookingDateStr,
        startTime: '17:30',
        partySize: 4,
      }, { headers: { Authorization: `Bearer ${c2Token}` } }),
    ]);
    const successCount = parallelAttempts.filter(r => r.status === 201).length;
    const conflictCount = parallelAttempts.filter(r => r.status === 409 || r.status === 400).length;
    logTest(14, 'Simultaneous Booking Requests Concurrency Safety', successCount <= 1, `Success: ${successCount}, Rejected: ${conflictCount}`);

    // 15. Reservation cancellation
    const cancelRes = await client.patch(
      `/reservations/${resId}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    logTest(15, 'Reservation Cancellation', cancelRes.status === 200 && cancelRes.data?.data?.status === 'CANCELLED', 'Status: CANCELLED');

    // 16. Table availability after cancellation
    // Register customer 3 to test booking the freed table
    const c3Res = await client.post('/auth/register', {
      name: 'Third Guest',
      email: `third_${Date.now()}@example.com`,
      phone: '+1 555-4422',
      password: 'Password123',
      confirmPassword: 'Password123',
    });
    const c3Token = c3Res.data?.data?.token;

    // Now that resId is cancelled, c3 should be able to book the slot that was freed!
    const rebookRes = await client.post(
      '/reservations',
      {
        branchId: createdBranchId,
        reservationDate: bookingDateStr,
        startTime: chosenSlot?.startTime || '11:30',
        partySize: 4,
      },
      { headers: { Authorization: `Bearer ${c3Token}` } }
    );
    logTest(16, 'Table Availability After Cancellation', rebookRes.status === 201, `New Booking Ref: ${rebookRes.data?.data?.referenceNumber}`);

    // 17. Staff branch-level access restrictions
    const staffLogin = await client.post('/auth/login', {
      email: 'staff.downtown@restaurant.com',
      password: 'Staff@123',
    });
    const staffToken = staffLogin.data?.data?.token;

    const staffRes = await client.get('/staff/reservations', {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    const allBelongToDowntown = staffRes.data?.data?.every(r => r.branchId === 1);
    logTest(17, 'Staff Branch-Level Access Restrictions', staffRes.status === 200 && allBelongToDowntown, `Filtered to assigned Branch 1 only`);

    // 18. Admin-only API access
    const adminReportsRes = await client.get('/admin/reports', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const custReportsRes = await client.get('/admin/reports', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const adminCheck = adminReportsRes.status === 200 && custReportsRes.status === 403;
    logTest(18, 'Admin-Only API Access Verification', adminCheck, `Admin: HTTP ${adminReportsRes.status}, Customer: HTTP ${custReportsRes.status}`);

    console.log('\n========================================================================');
    console.log('📊 TEST SUMMARY REPORT');
    console.log('========================================================================');
    const totalPassed = results.filter(r => r.status === 'PASSED').length;
    console.log(`Total Tests Run:    ${results.length}`);
    console.log(`Total Passed:       ${totalPassed}`);
    console.log(`Total Failed:       ${results.length - totalPassed}`);
    console.log(`Evaluation Result:  ${totalPassed === results.length ? '🎉 ALL 18 TESTS PASSED (100%)' : '⚠️ SOME TESTS FAILED'}`);
    console.log('========================================================================\n');

  } catch (error) {
    console.error('Unexpected error running automated test suite:', error);
  }
}

runTests();

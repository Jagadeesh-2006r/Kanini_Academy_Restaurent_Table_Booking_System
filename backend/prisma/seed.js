import { PrismaClient, Role, SeatingArea, ReservationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data in reverse order of dependencies
  await prisma.reservationAuditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.restaurantTable.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // Password hashing helper
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123', salt);
  const staffPassword = await bcrypt.hash('Staff@123', salt);
  const customerPassword = await bcrypt.hash('Customer@123', salt);

  // 1. Create Admin Account
  const admin = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@restaurant.com',
      phone: '+1 555-0100',
      password: adminPassword,
      role: Role.ADMIN,
      active: true,
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // 2. Create 2 Restaurant Branches
  const downtownBranch = await prisma.branch.create({
    data: {
      branchName: 'Downtown Gourmet Hub',
      address: '100 Main Street, Downtown Financial District',
      openingTime: '11:00',
      closingTime: '23:00',
      slotLength: 90, // 90 minutes
      active: true,
    },
  });

  const seasideBranch = await prisma.branch.create({
    data: {
      branchName: 'Seaside Terrace Bistro',
      address: '450 Ocean Boulevard, Coastal Marina',
      openingTime: '12:00',
      closingTime: '23:30',
      slotLength: 90, // 90 minutes
      active: true,
    },
  });
  console.log(`✅ Branches created: ${downtownBranch.branchName}, ${seasideBranch.branchName}`);

  // 3. Create 2 Staff Accounts (one for each branch)
  const staff1 = await prisma.user.create({
    data: {
      name: 'Michael Scott',
      email: 'staff.downtown@restaurant.com',
      phone: '+1 555-0111',
      password: staffPassword,
      role: Role.STAFF,
      branchId: downtownBranch.id,
      active: true,
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      name: 'Pam Beesly',
      email: 'staff.seaside@restaurant.com',
      phone: '+1 555-0122',
      password: staffPassword,
      role: Role.STAFF,
      branchId: seasideBranch.id,
      active: true,
    },
  });
  console.log(`✅ Staff created: ${staff1.email}, ${staff2.email}`);

  // 4. Create 1 Sample Customer Account
  const customer = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'customer@example.com',
      phone: '+1 555-0199',
      password: customerPassword,
      role: Role.CUSTOMER,
      active: true,
    },
  });
  console.log(`✅ Sample Customer created: ${customer.email}`);

  // 5. Create 10 Restaurant Tables distributed across the 2 branches
  // Downtown tables (5 tables: diverse capacities, indoor and outdoor)
  const downtownTables = await prisma.restaurantTable.createMany({
    data: [
      { branchId: downtownBranch.id, tableNumber: 'DT-01', seatingArea: SeatingArea.INDOOR, capacity: 2, active: true },
      { branchId: downtownBranch.id, tableNumber: 'DT-02', seatingArea: SeatingArea.INDOOR, capacity: 2, active: true },
      { branchId: downtownBranch.id, tableNumber: 'DT-03', seatingArea: SeatingArea.INDOOR, capacity: 4, active: true },
      { branchId: downtownBranch.id, tableNumber: 'DT-04', seatingArea: SeatingArea.OUTDOOR, capacity: 4, active: true },
      { branchId: downtownBranch.id, tableNumber: 'DT-05', seatingArea: SeatingArea.INDOOR, capacity: 8, active: true },
    ],
  });

  // Seaside tables (5 tables: diverse capacities, indoor and outdoor)
  const seasideTables = await prisma.restaurantTable.createMany({
    data: [
      { branchId: seasideBranch.id, tableNumber: 'ST-01', seatingArea: SeatingArea.INDOOR, capacity: 2, active: true },
      { branchId: seasideBranch.id, tableNumber: 'ST-02', seatingArea: SeatingArea.OUTDOOR, capacity: 2, active: true },
      { branchId: seasideBranch.id, tableNumber: 'ST-03', seatingArea: SeatingArea.OUTDOOR, capacity: 4, active: true },
      { branchId: seasideBranch.id, tableNumber: 'ST-04', seatingArea: SeatingArea.INDOOR, capacity: 6, active: true },
      { branchId: seasideBranch.id, tableNumber: 'ST-05', seatingArea: SeatingArea.OUTDOOR, capacity: 10, active: true },
    ],
  });
  console.log(`✅ 10 Tables created across branches.`);

  // 6. Optional sample upcoming reservation for testing staff & customer views
  const dtTable3 = await prisma.restaurantTable.findFirst({
    where: { branchId: downtownBranch.id, tableNumber: 'DT-03' },
  });

  if (dtTable3) {
    const today = new Date();
    // Format YYYY-MM-DD
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const refNum = `RES-${yyyy}${mm}${dd}-0001`;

    const sampleRes = await prisma.reservation.create({
      data: {
        referenceNumber: refNum,
        customerId: customer.id,
        branchId: downtownBranch.id,
        tableId: dtTable3.id,
        reservationDate: today,
        startTime: '19:00',
        endTime: '20:30',
        partySize: 3,
        specialRequest: 'Window seat preferred, celebrating anniversary.',
        status: ReservationStatus.BOOKED,
      },
    });

    await prisma.notification.create({
      data: {
        userId: customer.id,
        reservationId: sampleRes.id,
        message: `Your reservation ${refNum} at ${downtownBranch.branchName} for today at 19:00 is confirmed!`,
      },
    });

    await prisma.reservationAuditLog.create({
      data: {
        reservationId: sampleRes.id,
        action: 'CREATED',
        newValue: JSON.stringify({ reference: refNum, partySize: 3, time: '19:00' }),
      },
    });

    console.log(`✅ Sample reservation created: ${refNum}`);
  }

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('--------------------------------------------------');
  console.log('Sample Credentials:');
  console.log('Admin:    admin@restaurant.com           / Admin@123');
  console.log('Staff 1:  staff.downtown@restaurant.com   / Staff@123');
  console.log('Staff 2:  staff.seaside@restaurant.com    / Staff@123');
  console.log('Customer: customer@example.com           / Customer@123');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


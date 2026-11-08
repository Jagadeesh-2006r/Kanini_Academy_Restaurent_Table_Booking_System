-- =========================================================================
-- DATABASE SCHEMA SCRIPT (POSTGRESQL 18)
-- Project: Restaurant Table Reservation System (Savoria Bistro)
-- Deliverable #2 for College Project Evaluation & Examination
-- =========================================================================

-- 1. Create Enums
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'STAFF', 'ADMIN');
CREATE TYPE "SeatingArea" AS ENUM ('INDOOR', 'OUTDOOR');
CREATE TYPE "ReservationStatus" AS ENUM ('BOOKED', 'CANCELLED', 'COMPLETED');

-- 2. Users Table
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "branchId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- 3. Restaurant Branches Table
CREATE TABLE "branches" (
    "id" SERIAL NOT NULL,
    "branchName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "openingTime" TEXT NOT NULL,
    "closingTime" TEXT NOT NULL,
    "slotLength" INTEGER NOT NULL DEFAULT 90,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- 4. Restaurant Tables Table
CREATE TABLE "restaurant_tables" (
    "id" SERIAL NOT NULL,
    "branchId" INTEGER NOT NULL,
    "tableNumber" TEXT NOT NULL,
    "seatingArea" "SeatingArea" NOT NULL DEFAULT 'INDOOR',
    "capacity" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_tables_pkey" PRIMARY KEY ("id")
);

-- 5. Reservations Table
CREATE TABLE "reservations" (
    "id" SERIAL NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "tableId" INTEGER NOT NULL,
    "reservationDate" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "partySize" INTEGER NOT NULL,
    "specialRequest" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'BOOKED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- 6. Notifications Table
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "reservationId" INTEGER,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- 7. Reservation Audit Logs Table
CREATE TABLE "reservation_audit_logs" (
    "id" SERIAL NOT NULL,
    "reservationId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_audit_logs_pkey" PRIMARY KEY ("id")
);

-- 8. Unique Constraints & Performance Indexes
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "restaurant_tables_branchId_tableNumber_key" ON "restaurant_tables"("branchId", "tableNumber");
CREATE UNIQUE INDEX "reservations_referenceNumber_key" ON "reservations"("referenceNumber");

CREATE INDEX "reservations_branchId_reservationDate_status_idx" ON "reservations"("branchId", "reservationDate", "status");
CREATE INDEX "reservations_tableId_reservationDate_status_idx" ON "reservations"("tableId", "reservationDate", "status");
CREATE INDEX "reservations_customerId_reservationDate_idx" ON "reservations"("customerId", "reservationDate");
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");
CREATE INDEX "reservation_audit_logs_reservationId_idx" ON "reservation_audit_logs"("reservationId");

-- 9. Foreign Key Referential Integrity Constraints
ALTER TABLE "users" ADD CONSTRAINT "users_branchId_fkey" 
    FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "restaurant_tables" ADD CONSTRAINT "restaurant_tables_branchId_fkey" 
    FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reservations" ADD CONSTRAINT "reservations_customerId_fkey" 
    FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reservations" ADD CONSTRAINT "reservations_branchId_fkey" 
    FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reservations" ADD CONSTRAINT "reservations_tableId_fkey" 
    FOREIGN KEY ("tableId") REFERENCES "restaurant_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_reservationId_fkey" 
    FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reservation_audit_logs" ADD CONSTRAINT "reservation_audit_logs_reservationId_fkey" 
    FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;


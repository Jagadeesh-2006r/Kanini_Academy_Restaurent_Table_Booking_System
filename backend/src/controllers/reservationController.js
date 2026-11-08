import prisma from '../config/prisma.js';
import {
  generateBranchSlots,
  timeToMinutes,
  minutesToTime,
  formatDateOnly,
  generateReferenceNumber,
} from '../services/reservationService.js';

/**
 * Book a new reservation with automatic smallest-table allocation
 * Concurrency-safe via Prisma PostgreSQL transaction
 * POST /api/reservations
 */
export const createReservation = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { branchId, reservationDate, startTime, partySize, seatingArea, specialRequest } = req.body;

    if (!branchId || !reservationDate || !startTime || !partySize) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID, reservation date, start time, and party size are required.',
        error: 'MISSING_REQUIRED_FIELDS',
      });
    }

    const bId = parseInt(branchId, 10);
    const size = parseInt(partySize, 10);

    if (isNaN(bId) || isNaN(size) || size <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch ID or party size.',
        error: 'INVALID_INPUT',
      });
    }

    // 1. Validate branch exists and is active
    const branch = await prisma.branch.findUnique({
      where: { id: bId },
    });

    if (!branch || !branch.active) {
      return res.status(404).json({
        success: false,
        message: 'The selected restaurant branch is inactive or does not exist.',
        error: 'BRANCH_NOT_FOUND',
      });
    }

    // 2. Validate booking date window
    const targetDate = new Date(`${reservationDate}T00:00:00.000Z`);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reservation date format (expected YYYY-MM-DD).',
        error: 'INVALID_DATE',
      });
    }

    const todayStr = formatDateOnly(new Date());
    const targetDateStr = formatDateOnly(targetDate);

    if (targetDateStr < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book reservations for past dates.',
        error: 'PAST_DATE_NOT_ALLOWED',
      });
    }

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxDateStr = formatDateOnly(maxDate);

    if (targetDateStr > maxDateStr) {
      return res.status(400).json({
        success: false,
        message: 'Reservations can only be made up to 30 days in advance.',
        error: 'DATE_EXCEEDS_MAX_WINDOW',
      });
    }

    // 3. Validate requested time within branch opening hours and calculate endTime
    const startMins = timeToMinutes(startTime);
    const endMins = startMins + branch.slotLength;
    const endTime = minutesToTime(endMins);

    const openMins = timeToMinutes(branch.openingTime);
    const closeMins = timeToMinutes(branch.closingTime);

    if (startMins < openMins || endMins > closeMins) {
      return res.status(400).json({
        success: false,
        message: `Requested slot (${startTime} - ${endTime}) falls outside branch operating hours (${branch.openingTime} - ${branch.closingTime}).`,
        error: 'OUTSIDE_OPENING_HOURS',
      });
    }

    // If booking for today, verify time slot has not already passed
    if (targetDateStr === todayStr) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      if (startMins <= currentMins) {
        return res.status(400).json({
          success: false,
          message: 'Selected time slot has already passed for today. Please pick a future slot.',
          error: 'SLOT_ELAPSED',
        });
      }
    }

    // 4. Check if customer already holds an active reservation at this branch on that date
    const existingActiveRes = await prisma.reservation.findFirst({
      where: {
        customerId,
        branchId: bId,
        reservationDate: targetDate,
        status: 'BOOKED',
      },
    });

    if (existingActiveRes) {
      return res.status(409).json({
        success: false,
        message: 'A customer can have only one active reservation per branch per day. You already have booking ' + existingActiveRes.referenceNumber,
        error: 'DUPLICATE_ACTIVE_RESERVATION',
      });
    }

    // Execute automatic table allocation inside an isolated Prisma PostgreSQL transaction
    // to handle simultaneous booking requests safely
    const newReservation = await prisma.$transaction(async (tx) => {
      // 5. Query candidate active tables with capacity >= party size
      const candidateWhere = {
        branchId: bId,
        active: true,
        capacity: { gte: size },
      };

      if (seatingArea && (seatingArea === 'INDOOR' || seatingArea === 'OUTDOOR')) {
        candidateWhere.seatingArea = seatingArea;
      }

      const suitableTables = await tx.restaurantTable.findMany({
        where: candidateWhere,
        orderBy: [
          { capacity: 'asc' }, // Smallest table first
          { tableNumber: 'asc' },
        ],
      });

      if (suitableTables.length === 0) {
        throw {
          statusCode: 400,
          errorCode: 'NO_SUITABLE_TABLE',
          message: 'Sorry, no suitable table is available for the selected party size.',
        };
      }

      // 6. Find existing booked reservations for these tables during the requested slot
      const tableIds = suitableTables.map((t) => t.id);
      const overlappingBookings = await tx.reservation.findMany({
        where: {
          tableId: { in: tableIds },
          reservationDate: targetDate,
          status: 'BOOKED',
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } },
          ],
        },
        select: { tableId: true },
      });

      const bookedTableIds = new Set(overlappingBookings.map((b) => b.tableId));

      // 7. Find the smallest available table that is not booked
      const allocatedTable = suitableTables.find((tbl) => !bookedTableIds.has(tbl.id));

      if (!allocatedTable) {
        throw {
          statusCode: 409,
          errorCode: 'NO_TABLE_AVAILABLE',
          message: 'Sorry, no suitable table is available for the selected time.',
        };
      }

      // 8. Generate unique reservation reference: RES-YYYYMMDD-0001
      const referenceNumber = await generateReferenceNumber(tx, targetDate);

      // 9. Save reservation
      const created = await tx.reservation.create({
        data: {
          referenceNumber,
          customerId,
          branchId: bId,
          tableId: allocatedTable.id,
          reservationDate: targetDate,
          startTime,
          endTime,
          partySize: size,
          specialRequest: specialRequest ? specialRequest.trim() : null,
          status: 'BOOKED',
        },
        include: {
          branch: true,
          table: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      // 10. Create Notification for the customer
      await tx.notification.create({
        data: {
          userId: customerId,
          reservationId: created.id,
          message: `Your reservation ${referenceNumber} at ${branch.branchName} for ${targetDateStr} at ${startTime} (Table ${allocatedTable.tableNumber}) is confirmed!`,
        },
      });

      // 11. Create Audit Log record
      await tx.reservationAuditLog.create({
        data: {
          reservationId: created.id,
          action: 'CREATED',
          newValue: JSON.stringify({
            referenceNumber,
            branchId: bId,
            tableId: allocatedTable.id,
            tableNumber: allocatedTable.tableNumber,
            date: targetDateStr,
            startTime,
            endTime,
            partySize: size,
          }),
        },
      });

      return created;
    });

    return res.status(201).json({
      success: true,
      message: 'Reservation confirmed successfully!',
      data: newReservation,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.errorCode,
      });
    }
    next(error);
  }
};

/**
 * Get reservations for currently logged-in customer
 * Categorized into Upcoming, Past, and Cancelled
 * GET /api/reservations/my
 */
export const getMyReservations = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const todayStr = formatDateOnly(new Date());

    const reservations = await prisma.reservation.findMany({
      where: { customerId },
      include: {
        branch: {
          select: {
            id: true,
            branchName: true,
            address: true,
          },
        },
        table: {
          select: {
            id: true,
            tableNumber: true,
            seatingArea: true,
            capacity: true,
          },
        },
      },
      orderBy: [
        { reservationDate: 'desc' },
        { startTime: 'desc' },
      ],
    });

    // Split into Upcoming, Past, and Cancelled
    const upcoming = [];
    const past = [];
    const cancelled = [];

    for (const res of reservations) {
      const dateStr = formatDateOnly(res.reservationDate);
      if (res.status === 'CANCELLED') {
        cancelled.push(res);
      } else if (res.status === 'COMPLETED' || dateStr < todayStr) {
        past.push(res);
      } else {
        upcoming.push(res);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        all: reservations,
        upcoming,
        past,
        cancelled,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single reservation by ID
 * GET /api/reservations/:id
 */
export const getReservationById = async (req, res, next) => {
  try {
    const resId = parseInt(req.params.id, 10);
    const reservation = await prisma.reservation.findUnique({
      where: { id: resId },
      include: {
        branch: true,
        table: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found.',
        error: 'RESERVATION_NOT_FOUND',
      });
    }

    // Role-based security checks
    if (req.user.role === 'CUSTOMER' && reservation.customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot view other customers\' reservations.',
        error: 'FORBIDDEN',
      });
    }

    if (req.user.role === 'STAFF' && reservation.branchId !== req.user.branchId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view reservations for your assigned branch.',
        error: 'BRANCH_MISMATCH',
      });
    }

    return res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Modify an existing reservation
 * Subject to table availability at the same branch
 * PUT /api/reservations/:id
 */
export const modifyReservation = async (req, res, next) => {
  try {
    const resId = parseInt(req.params.id, 10);
    const { reservationDate, startTime, partySize, specialRequest, seatingArea } = req.body;

    const existing = await prisma.reservation.findUnique({
      where: { id: resId },
      include: { branch: true, table: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found.',
        error: 'RESERVATION_NOT_FOUND',
      });
    }

    if (req.user.role === 'CUSTOMER' && existing.customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
        error: 'FORBIDDEN',
      });
    }

    if (existing.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify a cancelled reservation.',
        error: 'ALREADY_CANCELLED',
      });
    }

    const branch = existing.branch;
    const targetDate = reservationDate ? new Date(`${reservationDate}T00:00:00.000Z`) : existing.reservationDate;
    const targetDateStr = formatDateOnly(targetDate);
    const todayStr = formatDateOnly(new Date());

    if (targetDateStr < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule reservation to a past date.',
        error: 'PAST_DATE_NOT_ALLOWED',
      });
    }

    const newStartTime = startTime || existing.startTime;
    const newSize = partySize ? parseInt(partySize, 10) : existing.partySize;

    const startMins = timeToMinutes(newStartTime);
    const endMins = startMins + branch.slotLength;
    const newEndTime = minutesToTime(endMins);

    // Concurrency safe transaction for rescheduling
    const modified = await prisma.$transaction(async (tx) => {
      // Find candidate tables
      const candidateWhere = {
        branchId: existing.branchId,
        active: true,
        capacity: { gte: newSize },
      };

      if (seatingArea) {
        candidateWhere.seatingArea = seatingArea;
      }

      const suitableTables = await tx.restaurantTable.findMany({
        where: candidateWhere,
        orderBy: [{ capacity: 'asc' }, { tableNumber: 'asc' }],
      });

      if (suitableTables.length === 0) {
        throw {
          statusCode: 400,
          errorCode: 'NO_SUITABLE_TABLE',
          message: `Sorry, no table is available for party size of ${newSize}.`,
        };
      }

      const tableIds = suitableTables.map((t) => t.id);
      const overlappingBookings = await tx.reservation.findMany({
        where: {
          id: { not: resId }, // Exclude current reservation
          tableId: { in: tableIds },
          reservationDate: targetDate,
          status: 'BOOKED',
          AND: [
            { startTime: { lt: newEndTime } },
            { endTime: { gt: newStartTime } },
          ],
        },
        select: { tableId: true },
      });

      const bookedTableIds = new Set(overlappingBookings.map((b) => b.tableId));
      const allocatedTable = suitableTables.find((tbl) => !bookedTableIds.has(tbl.id));

      if (!allocatedTable) {
        throw {
          statusCode: 409,
          errorCode: 'SLOT_UNAVAILABLE',
          message: 'Sorry, no suitable table is available for the requested time slot.',
        };
      }

      // Update reservation
      const updated = await tx.reservation.update({
        where: { id: resId },
        data: {
          tableId: allocatedTable.id,
          reservationDate: targetDate,
          startTime: newStartTime,
          endTime: newEndTime,
          partySize: newSize,
          ...(specialRequest !== undefined && { specialRequest: specialRequest.trim() }),
        },
        include: {
          branch: true,
          table: true,
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      });

      // Create Audit Log
      await tx.reservationAuditLog.create({
        data: {
          reservationId: resId,
          action: 'MODIFIED',
          oldValue: JSON.stringify({
            tableId: existing.tableId,
            date: formatDateOnly(existing.reservationDate),
            time: existing.startTime,
            partySize: existing.partySize,
          }),
          newValue: JSON.stringify({
            tableId: allocatedTable.id,
            date: targetDateStr,
            time: newStartTime,
            partySize: newSize,
          }),
        },
      });

      // Notification
      await tx.notification.create({
        data: {
          userId: existing.customerId,
          reservationId: resId,
          message: `Your reservation ${existing.referenceNumber} has been updated to ${targetDateStr} at ${newStartTime} (Table ${allocatedTable.tableNumber}).`,
        },
      });

      return updated;
    });

    return res.status(200).json({
      success: true,
      message: 'Reservation modified successfully.',
      data: modified,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.errorCode,
      });
    }
    next(error);
  }
};

/**
 * Cancel a reservation and release the table
 * PATCH /api/reservations/:id/cancel
 */
export const cancelReservation = async (req, res, next) => {
  try {
    const resId = parseInt(req.params.id, 10);
    const reservation = await prisma.reservation.findUnique({
      where: { id: resId },
      include: { branch: true },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found.',
        error: 'RESERVATION_NOT_FOUND',
      });
    }

    // Role check: customer can cancel own, staff can cancel for branch, admin can cancel any
    if (req.user.role === 'CUSTOMER' && reservation.customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
        error: 'FORBIDDEN',
      });
    }

    if (req.user.role === 'STAFF' && reservation.branchId !== req.user.branchId) {
      return res.status(403).json({
        success: false,
        message: 'Staff can only cancel reservations for their assigned branch.',
        error: 'BRANCH_MISMATCH',
      });
    }

    if (reservation.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Reservation is already cancelled.',
        error: 'ALREADY_CANCELLED',
      });
    }

    // Update status to CANCELLED in transaction
    const cancelled = await prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id: resId },
        data: { status: 'CANCELLED' },
        include: { branch: true, table: true },
      });

      await tx.reservationAuditLog.create({
        data: {
          reservationId: resId,
          action: 'CANCELLED',
          oldValue: JSON.stringify({ status: reservation.status }),
          newValue: JSON.stringify({ status: 'CANCELLED', cancelledBy: req.user.role }),
        },
      });

      await tx.notification.create({
        data: {
          userId: reservation.customerId,
          reservationId: resId,
          message: `Your reservation ${reservation.referenceNumber} at ${reservation.branch.branchName} has been cancelled.`,
        },
      });

      return updated;
    });

    return res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully. Table has been released for other bookings.',
      data: cancelled,
    });
  } catch (error) {
    next(error);
  }
};

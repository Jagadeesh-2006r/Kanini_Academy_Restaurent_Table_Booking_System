import prisma from '../config/prisma.js';
import {
  generateBranchSlots,
  timeToMinutes,
  formatDateOnly,
} from '../services/reservationService.js';

/**
 * Check slot availability for a branch, date, party size, and seating area
 * GET /api/availability
 */
export const checkAvailability = async (req, res, next) => {
  try {
    const { branchId, date, partySize, seatingArea } = req.query;

    if (!branchId || !date || !partySize) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID, reservation date, and party size are required parameters.',
        error: 'MISSING_PARAMETERS',
      });
    }

    const bId = parseInt(branchId, 10);
    const size = parseInt(partySize, 10);

    if (isNaN(bId) || isNaN(size) || size <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch ID or party size.',
        error: 'INVALID_PARAMETERS',
      });
    }

    // 1. Fetch branch
    const branch = await prisma.branch.findUnique({
      where: { id: bId },
    });

    if (!branch || !branch.active) {
      return res.status(404).json({
        success: false,
        message: 'Selected restaurant branch is inactive or does not exist.',
        error: 'BRANCH_NOT_FOUND',
      });
    }

    // 2. Validate booking date window
    // Parse target date (YYYY-MM-DD)
    const targetDate = new Date(`${date}T00:00:00.000Z`);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD.',
        error: 'INVALID_DATE',
      });
    }

    const todayStr = formatDateOnly(new Date());
    const targetDateStr = formatDateOnly(targetDate);

    // Reject past dates
    if (targetDateStr < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check availability for past dates.',
        error: 'PAST_DATE_NOT_ALLOWED',
      });
    }

    // Max 30 days ahead rule
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

    // 3. Fetch active tables for branch that can fit the party size
    const tableWhere = {
      branchId: bId,
      active: true,
      capacity: { gte: size },
    };

    if (seatingArea && (seatingArea === 'INDOOR' || seatingArea === 'OUTDOOR')) {
      tableWhere.seatingArea = seatingArea;
    }

    const suitableTables = await prisma.restaurantTable.findMany({
      where: tableWhere,
      orderBy: [
        { capacity: 'asc' },
        { tableNumber: 'asc' },
      ],
    });

    // Check if branch even has a table large enough
    if (suitableTables.length === 0) {
      return res.status(200).json({
        success: true,
        message: `Sorry, no suitable table is available for party size of ${size}.`,
        data: {
          branchId: bId,
          date: targetDateStr,
          partySize: size,
          slots: [],
          noSuitableTablesFound: true,
        },
      });
    }

    // 4. Fetch all active reservations for this branch on the requested date
    const bookedReservations = await prisma.reservation.findMany({
      where: {
        branchId: bId,
        reservationDate: targetDate,
        status: 'BOOKED',
      },
      select: {
        tableId: true,
        startTime: true,
        endTime: true,
      },
    });

    // 5. Generate slots for branch
    const allSlots = generateBranchSlots(branch.openingTime, branch.closingTime, branch.slotLength);

    // If booking for today, filter out slots that have already passed or are too close
    const isToday = targetDateStr === todayStr;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // 6. Check each slot for table availability
    const slotAvailability = allSlots.map((slot) => {
      const slotStartMins = timeToMinutes(slot.startTime);
      const slotEndMins = timeToMinutes(slot.endTime);

      // If today and time has passed, slot is unavailable
      if (isToday && slotStartMins <= currentMins) {
        return {
          ...slot,
          available: false,
          reason: 'Time slot has elapsed',
          freeTableCount: 0,
        };
      }

      // Check which suitable tables are booked during this slot
      const occupiedTableIds = new Set(
        bookedReservations
          .filter((res) => {
            const resStartMins = timeToMinutes(res.startTime);
            const resEndMins = timeToMinutes(res.endTime);
            // Overlap condition: start < otherEnd && end > otherStart
            return resStartMins < slotEndMins && resEndMins > slotStartMins;
          })
          .map((res) => res.tableId)
      );

      const availableTables = suitableTables.filter(
        (tbl) => !occupiedTableIds.has(tbl.id)
      );

      const isAvailable = availableTables.length > 0;

      return {
        ...slot,
        available: isAvailable,
        freeTableCount: availableTables.length,
        smallestTableCapacity: isAvailable ? availableTables[0].capacity : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        branchId: bId,
        branchName: branch.branchName,
        date: targetDateStr,
        partySize: size,
        seatingAreaPreference: seatingArea || 'ANY',
        slots: slotAvailability,
      },
    });
  } catch (error) {
    next(error);
  }
};


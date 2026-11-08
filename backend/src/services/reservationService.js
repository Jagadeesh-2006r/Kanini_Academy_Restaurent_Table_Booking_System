import prisma from '../config/prisma.js';

/**
 * Helper to convert "HH:mm" time string into total minutes from midnight
 */
export const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Helper to convert minutes from midnight back to "HH:mm" format
 */
export const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Generate discrete time slots between opening and closing time based on slot length
 */
export const generateBranchSlots = (openingTime, closingTime, slotLengthMinutes = 90) => {
  const startMins = timeToMinutes(openingTime);
  const endMins = timeToMinutes(closingTime);
  const slots = [];

  let current = startMins;
  while (current + slotLengthMinutes <= endMins) {
    const slotStart = minutesToTime(current);
    const slotEnd = minutesToTime(current + slotLengthMinutes);
    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
    });
    current += slotLengthMinutes;
  }

  return slots;
};

/**
 * Format a Date object as YYYY-MM-DD
 */
export const formatDateOnly = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generate the next unique reference number: RES-YYYYMMDD-0001
 */
export const generateReferenceNumber = async (tx, reservationDate) => {
  const d = new Date(reservationDate);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const datePrefix = `RES-${year}${month}${day}-`;

  // Find the highest reference number for this date
  const lastRes = await tx.reservation.findFirst({
    where: {
      referenceNumber: { startsWith: datePrefix },
    },
    orderBy: { referenceNumber: 'desc' },
    select: { referenceNumber: true },
  });

  let nextSequence = 1;
  if (lastRes && lastRes.referenceNumber) {
    const parts = lastRes.referenceNumber.split('-');
    const currentSeq = parseInt(parts[2], 10);
    if (!isNaN(currentSeq)) {
      nextSequence = currentSeq + 1;
    }
  }

  return `${datePrefix}${String(nextSequence).padStart(4, '0')}`;
};

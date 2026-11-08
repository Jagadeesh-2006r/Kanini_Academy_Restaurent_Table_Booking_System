import prisma from '../config/prisma.js';
import { hashPassword } from '../utils/password.js';
import { formatDateOnly } from '../services/reservationService.js';

/**
 * Get reservations for staff member's assigned branch
 * GET /api/staff/reservations
 */
export const getStaffReservations = async (req, res, next) => {
  try {
    const staffBranchId = req.user.branchId;

    if (!staffBranchId) {
      return res.status(400).json({
        success: false,
        message: 'No branch is assigned to your staff account. Contact an administrator.',
        error: 'NO_ASSIGNED_BRANCH',
      });
    }

    const { date, status, view } = req.query;
    const todayStr = formatDateOnly(new Date());

    const where = {
      branchId: staffBranchId,
    };

    if (status) {
      where.status = status;
    }

    if (date) {
      where.reservationDate = new Date(`${date}T00:00:00.000Z`);
    } else if (view === 'today') {
      where.reservationDate = new Date(`${todayStr}T00:00:00.000Z`);
    } else if (view === 'upcoming') {
      where.reservationDate = {
        gte: new Date(`${todayStr}T00:00:00.000Z`),
      };
      where.status = 'BOOKED';
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
        branch: {
          select: {
            id: true,
            branchName: true,
          },
        },
      },
      orderBy: [
        { reservationDate: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return res.status(200).json({
      success: true,
      branchId: staffBranchId,
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new Staff account (Admin only)
 * POST /api/staff
 */
export const createStaffUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, branchId } = req.body;

    if (!name || !email || !phone || !password || !branchId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, password, and branch ID are required.',
        error: 'VALIDATION_FAILED',
      });
    }

    const bId = parseInt(branchId, 10);
    const branch = await prisma.branch.findUnique({ where: { id: bId } });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Selected branch does not exist.',
        error: 'BRANCH_NOT_FOUND',
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.',
        error: 'DUPLICATE_EMAIL',
      });
    }

    const hashedPassword = await hashPassword(password);

    const staff = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: hashedPassword,
        role: 'STAFF',
        branchId: bId,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        active: true,
        branch: {
          select: {
            id: true,
            branchName: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Staff account created successfully.',
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all staff accounts (Admin only)
 * GET /api/staff
 */
export const getAllStaff = async (req, res, next) => {
  try {
    const staffList = await prisma.user.findMany({
      where: { role: 'STAFF' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        active: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            branchName: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: staffList,
    });
  } catch (error) {
    next(error);
  }
};

import prisma from '../config/prisma.js';
import { formatDateOnly } from '../services/reservationService.js';

/**
 * Get all reservations across all branches with filters (Admin only)
 * GET /api/admin/reservations
 */
export const getAdminReservations = async (req, res, next) => {
  try {
    const { date, branchId, status } = req.query;

    const where = {};

    if (date) {
      where.reservationDate = new Date(`${date}T00:00:00.000Z`);
    }

    if (branchId) {
      where.branchId = parseInt(branchId, 10);
    }

    if (status) {
      where.status = status;
    }

    const reservations = await prisma.reservation.findMany({
      where,
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
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { reservationDate: 'desc' },
        { startTime: 'desc' },
      ],
    });

    return res.status(200).json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get summary metrics for Admin Dashboard
 * GET /api/admin/dashboard
 */
export const getAdminDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    const todayDateOnly = new Date(`${formatDateOnly(today)}T00:00:00.000Z`);

    // Aggregate counts
    const [
      totalReservations,
      todayReservations,
      upcomingReservations,
      cancelledReservations,
      totalCustomers,
      branchesWithCounts,
    ] = await Promise.all([
      prisma.reservation.count(),
      prisma.reservation.count({
        where: {
          reservationDate: todayDateOnly,
          status: 'BOOKED',
        },
      }),
      prisma.reservation.count({
        where: {
          reservationDate: { gte: todayDateOnly },
          status: 'BOOKED',
        },
      }),
      prisma.reservation.count({
        where: { status: 'CANCELLED' },
      }),
      prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),
      prisma.branch.findMany({
        select: {
          id: true,
          branchName: true,
          active: true,
          _count: {
            select: {
              tables: true,
              reservations: true,
            },
          },
        },
      }),
    ]);

    const branchWise = branchesWithCounts.map((b) => ({
      branchId: b.id,
      branchName: b.branchName,
      active: b.active,
      tableCount: b._count.tables,
      reservationCount: b._count.reservations,
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalReservations,
        todayReservations,
        upcomingReservations,
        cancelledReservations,
        totalCustomers,
        branchWise,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get analytical reports and statistics
 * GET /api/admin/reports
 */
export const getAdminReports = async (req, res, next) => {
  try {
    // 1. Status breakdown
    const statusGroups = await prisma.reservation.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // 2. Seating area breakdown
    const tableAreaCounts = await prisma.restaurantTable.groupBy({
      by: ['seatingArea'],
      _count: { id: true },
    });

    // 3. Last 7 days reservation timeline
    const allRecentReservations = await prisma.reservation.findMany({
      select: {
        reservationDate: true,
        status: true,
        partySize: true,
      },
      orderBy: { reservationDate: 'asc' },
    });

    const dateCounts = {};
    for (const r of allRecentReservations) {
      const d = formatDateOnly(r.reservationDate);
      dateCounts[d] = (dateCounts[d] || 0) + 1;
    }

    const timeline = Object.entries(dateCounts).map(([date, count]) => ({
      date,
      count,
    }));

    return res.status(200).json({
      success: true,
      data: {
        statusDistribution: statusGroups.map((g) => ({ status: g.status, count: g._count.id })),
        seatingAreaDistribution: tableAreaCounts.map((g) => ({ area: g.seatingArea, count: g._count.id })),
        timeline,
        totalVolume: allRecentReservations.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

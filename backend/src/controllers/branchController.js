import prisma from '../config/prisma.js';

/**
 * Get all branches
 * If user is not admin, only active branches are returned
 * Includes count of indoor and outdoor tables for easy customer browsing
 * GET /api/branches
 */
export const getAllBranches = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    const { search } = req.query;

    const where = {};
    if (!isAdmin) {
      where.active = true;
    }

    if (search) {
      where.OR = [
        { branchName: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const branches = await prisma.branch.findMany({
      where,
      include: {
        tables: {
          where: { active: true },
          select: {
            id: true,
            tableNumber: true,
            seatingArea: true,
            capacity: true,
          },
        },
        _count: {
          select: {
            tables: true,
            reservations: true,
          },
        },
      },
      orderBy: { branchName: 'asc' },
    });

    // Augment with computed indoor/outdoor table counts & capacity summary
    const formatted = branches.map((b) => {
      const indoorTables = b.tables.filter((t) => t.seatingArea === 'INDOOR');
      const outdoorTables = b.tables.filter((t) => t.seatingArea === 'OUTDOOR');
      const maxCapacity = b.tables.reduce((max, t) => Math.max(max, t.capacity), 0);

      return {
        id: b.id,
        branchName: b.branchName,
        address: b.address,
        openingTime: b.openingTime,
        closingTime: b.closingTime,
        slotLength: b.slotLength,
        active: b.active,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        indoorCount: indoorTables.length,
        outdoorCount: outdoorTables.length,
        totalTables: b.tables.length,
        maxCapacity,
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single branch details by ID
 * GET /api/branches/:id
 */
export const getBranchById = async (req, res, next) => {
  try {
    const branchId = parseInt(req.params.id, 10);
    if (isNaN(branchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch ID provided.',
        error: 'INVALID_ID',
      });
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        tables: {
          where: req.user?.role === 'ADMIN' ? {} : { active: true },
          orderBy: { tableNumber: 'asc' },
        },
      },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found.',
        error: 'BRANCH_NOT_FOUND',
      });
    }

    if (!branch.active && req.user?.role !== 'ADMIN') {
      return res.status(404).json({
        success: false,
        message: 'This restaurant branch is currently inactive.',
        error: 'BRANCH_INACTIVE',
      });
    }

    const indoorCount = branch.tables.filter(t => t.seatingArea === 'INDOOR').length;
    const outdoorCount = branch.tables.filter(t => t.seatingArea === 'OUTDOOR').length;

    return res.status(200).json({
      success: true,
      data: {
        ...branch,
        indoorCount,
        outdoorCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new restaurant branch (Admin only)
 * POST /api/branches
 */
export const createBranch = async (req, res, next) => {
  try {
    const { branchName, address, openingTime, closingTime, slotLength } = req.body;

    if (!branchName || !address || !openingTime || !closingTime) {
      return res.status(400).json({
        success: false,
        message: 'Branch name, address, opening time, and closing time are required.',
        error: 'VALIDATION_FAILED',
      });
    }

    const newBranch = await prisma.branch.create({
      data: {
        branchName: branchName.trim(),
        address: address.trim(),
        openingTime: openingTime.trim(),
        closingTime: closingTime.trim(),
        slotLength: slotLength ? parseInt(slotLength, 10) : 90,
        active: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Branch created successfully.',
      data: newBranch,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing restaurant branch (Admin only)
 * PUT /api/branches/:id
 */
export const updateBranch = async (req, res, next) => {
  try {
    const branchId = parseInt(req.params.id, 10);
    const { branchName, address, openingTime, closingTime, slotLength, active } = req.body;

    const existingBranch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!existingBranch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found.',
        error: 'BRANCH_NOT_FOUND',
      });
    }

    const updated = await prisma.branch.update({
      where: { id: branchId },
      data: {
        ...(branchName !== undefined && { branchName: branchName.trim() }),
        ...(address !== undefined && { address: address.trim() }),
        ...(openingTime !== undefined && { openingTime: openingTime.trim() }),
        ...(closingTime !== undefined && { closingTime: closingTime.trim() }),
        ...(slotLength !== undefined && { slotLength: parseInt(slotLength, 10) }),
        ...(active !== undefined && { active: Boolean(active) }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Branch details updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle branch activation / deactivation status (Admin only)
 * PATCH /api/branches/:id/deactivate
 */
export const toggleBranchStatus = async (req, res, next) => {
  try {
    const branchId = parseInt(req.params.id, 10);
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found.',
        error: 'BRANCH_NOT_FOUND',
      });
    }

    const updated = await prisma.branch.update({
      where: { id: branchId },
      data: { active: !branch.active },
    });

    return res.status(200).json({
      success: true,
      message: `Branch ${updated.active ? 'activated' : 'deactivated'} successfully.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

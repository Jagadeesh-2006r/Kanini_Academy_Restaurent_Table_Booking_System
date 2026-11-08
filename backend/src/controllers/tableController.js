import prisma from '../config/prisma.js';

/**
 * Get all tables for a specific branch
 * GET /api/tables/:branchId
 */
export const getTablesByBranch = async (req, res, next) => {
  try {
    const branchId = parseInt(req.params.branchId, 10);
    const isAdminOrStaff = req.user?.role === 'ADMIN' || (req.user?.role === 'STAFF' && req.user.branchId === branchId);

    const tables = await prisma.restaurantTable.findMany({
      where: {
        branchId,
        ...(isAdminOrStaff ? {} : { active: true }),
      },
      include: {
        _count: {
          select: { reservations: true },
        },
      },
      orderBy: [
        { seatingArea: 'asc' },
        { capacity: 'asc' },
        { tableNumber: 'asc' },
      ],
    });

    return res.status(200).json({
      success: true,
      data: tables,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new table to a branch (Admin only)
 * POST /api/tables
 */
export const createTable = async (req, res, next) => {
  try {
    const { branchId, tableNumber, seatingArea, capacity } = req.body;

    if (!branchId || !tableNumber || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID, table number, and capacity are required.',
        error: 'VALIDATION_FAILED',
      });
    }

    const bId = parseInt(branchId, 10);
    const cap = parseInt(capacity, 10);

    if (cap <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Table capacity must be a positive number of guests.',
        error: 'INVALID_CAPACITY',
      });
    }

    // Check if table number already exists in branch
    const existing = await prisma.restaurantTable.findUnique({
      where: {
        branchId_tableNumber: {
          branchId: bId,
          tableNumber: tableNumber.trim().toUpperCase(),
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Table "${tableNumber}" already exists in this branch. Please choose another table number.`,
        error: 'DUPLICATE_TABLE_NUMBER',
      });
    }

    const newTable = await prisma.restaurantTable.create({
      data: {
        branchId: bId,
        tableNumber: tableNumber.trim().toUpperCase(),
        seatingArea: seatingArea === 'OUTDOOR' ? 'OUTDOOR' : 'INDOOR',
        capacity: cap,
        active: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Table created successfully.',
      data: newTable,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update table details (Admin only)
 * PUT /api/tables/:id
 */
export const updateTable = async (req, res, next) => {
  try {
    const tableId = parseInt(req.params.id, 10);
    const { tableNumber, seatingArea, capacity, active } = req.body;

    const existingTable = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
    if (!existingTable) {
      return res.status(404).json({
        success: false,
        message: 'Table not found.',
        error: 'TABLE_NOT_FOUND',
      });
    }

    // If changing table number, check uniqueness
    if (tableNumber && tableNumber.trim().toUpperCase() !== existingTable.tableNumber) {
      const duplicate = await prisma.restaurantTable.findUnique({
        where: {
          branchId_tableNumber: {
            branchId: existingTable.branchId,
            tableNumber: tableNumber.trim().toUpperCase(),
          },
        },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Table number "${tableNumber}" already exists in this branch.`,
          error: 'DUPLICATE_TABLE_NUMBER',
        });
      }
    }

    const updated = await prisma.restaurantTable.update({
      where: { id: tableId },
      data: {
        ...(tableNumber !== undefined && { tableNumber: tableNumber.trim().toUpperCase() }),
        ...(seatingArea !== undefined && { seatingArea }),
        ...(capacity !== undefined && { capacity: parseInt(capacity, 10) }),
        ...(active !== undefined && { active: Boolean(active) }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Table updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete or soft-deactivate a table (Admin only)
 * If reservations are linked, safely deactivates the table
 * DELETE /api/tables/:id
 */
export const deleteTable = async (req, res, next) => {
  try {
    const tableId = parseInt(req.params.id, 10);
    const table = await prisma.restaurantTable.findUnique({
      where: { id: tableId },
      include: {
        _count: {
          select: { reservations: true },
        },
      },
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found.',
        error: 'TABLE_NOT_FOUND',
      });
    }

    // If table has reservation history, preserve audit trail by deactivating
    if (table._count.reservations > 0) {
      const deactivated = await prisma.restaurantTable.update({
        where: { id: tableId },
        data: { active: false },
      });
      return res.status(200).json({
        success: true,
        message: 'Table has existing reservation history and was safely deactivated instead of deleted.',
        data: deactivated,
      });
    }

    // Otherwise permanently delete
    await prisma.restaurantTable.delete({ where: { id: tableId } });
    return res.status(200).json({
      success: true,
      message: 'Table deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

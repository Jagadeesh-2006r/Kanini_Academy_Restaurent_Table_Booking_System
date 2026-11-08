import prisma from '../config/prisma.js';

/**
 * Get all notifications for current user
 * GET /api/notifications
 */
export const getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user.id,
        isRead: false,
      },
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
export const markNotificationRead = async (req, res, next) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    const notif = await prisma.notification.findUnique({
      where: { id: notifId },
    });

    if (!notif) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
        error: 'NOT_FOUND',
      });
    }

    if (notif.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
        error: 'FORBIDDEN',
      });
    }

    const updated = await prisma.notification.update({
      where: { id: notifId },
      data: { isRead: true },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};


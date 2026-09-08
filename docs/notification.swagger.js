/**
 * @swagger
 * /notification/user-device:
 *   post:
 *     summary: Add user device
 *     description: Adds a device token for the authenticated user.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_type
 *               - device_token
 *             properties:
 *               device_type:
 *                 type: string
 *                 example: web
 *                 description: Type of device.
 *               device_token:
 *                 type: string
 *                 example: "fcm-token-example"
 *                 description: Firebase Cloud Messaging device token.
 *     responses:
 *       201:
 *         description: User device added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User Device added successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440001"
 *                     device_type:
 *                       type: string
 *                       example: web
 *                     device_token:
 *                       type: string
 *                       example: "fcm-token-example"
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 *       409:
 *         description: Device already exists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Device Already Exists
 *       500:
 *         description: Internal server error.
 */
/**
 * @swagger
 * /notification/read:
 *   post:
 *     summary: Mark notification as read
 *     description: Marks a specific notification as read for the authenticated user.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Notification read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification read successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       example:
 *                         type: EVENT_REMINDER
 *                         event_id: 550e8400-e29b-41d4-a716-446655440000
 *                         title: Business Conference
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification does not exists
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /notification/:
 *   get:
 *     summary: Get user notifications
 *     description: Retrieves a paginated list of notifications for the authenticated user. Notifications can be filtered by type and sorted by a specified field and order.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number.
 *
 *       - in: query
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Number of notifications to return per page.
 *
 *       - in: query
 *         name: notification_type
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - reminder
 *             - event cancelled
 *             - event reschedule
 *         description: Filter notifications by notification type.
 *
 *       - in: query
 *         name: sortBy
 *         required: false
 *         schema:
 *           type: string
 *           default: created_at
 *         description: Field by which notifications should be sorted.
 *
 *       - in: query
 *         name: sortOrder
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - ASC
 *             - DESC
 *           default: DESC
 *         description: Sorting order.
 *
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notifications retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     userNotifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: 7f8c9d10-1234-4567-8901-abcdef123456
 *                           notification_type:
 *                             type: string
 *                             enum:
 *                               - reminder
 *                               - event cancelled
 *                               - event reschedule
 *                             example: reminder
 *                           data:
 *                             type: object
 *                             additionalProperties: true
 *                             example:
 *                               title: Event Reminder
 *                               event_id: 123
 *                           is_read:
 *                             type: boolean
 *                             example: false
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: 2026-08-26T10:30:00.000Z
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalRows:
 *                           type: integer
 *                           example: 25
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 *
 *       401:
 *         description: Unauthorized. Authentication token is missing or invalid.
 *
 *       404:
 *         description: User does not exist.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User does not exists
 *
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /user/register-event:
 *   post:
 *     summary: Register for an event
 *     description: Register the authenticated user for an event using a ticket ID. If the ticket is full, the user will be added to the waitlist if the waitlist has available slots.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticket_id
 *             properties:
 *               ticket_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the ticket selected for registration
 *                 example: "e1c67cda-b985-4a52-8ead-5d403c6d365a"
 *     responses:
 *       201:
 *         description: Event registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Event registered successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "f8c4d8e1-5a23-4d92-8c21-123456789abc"
 *                     registration_number:
 *                       type: string
 *                       example: "REG-A7K92X"
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       example: "7a8b9c10-1234-4567-8901-abcdef123456"
 *                     event_id:
 *                       type: string
 *                       format: uuid
 *                       example: "6d1176db-0963-4567-90fd-b894e796b597"
 *                     ticket_id:
 *                       type: string
 *                       format: uuid
 *                       example: "e1c67cda-b985-4a52-8ead-5d403c6d365a"
 *                     status:
 *                       type: string
 *                       example: "registered"
 *
 *       200:
 *         description: Ticket is full and user has been added to the waitlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ticket is full. User added to waitlist."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     event_id:
 *                       type: string
 *                       format: uuid
 *                     ticket_id:
 *                       type: string
 *                       format: uuid
 *
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     alreadyRegistered:
 *                       value: "User is already registered for this event."
 *                     full:
 *                       value: "Ticket registration and waitlist are full."
 *
 *       401:
 *         description: Unauthorized
 *
 *       404:
 *         description: User, ticket, or event not found
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /user/pay-ticket:
 *   post:
 *     summary: Pay for a ticket
 *     description: Mark the payment for the authenticated user's event registration as successful.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registration_id
 *             properties:
 *               registration_id:
 *                 type: string
 *                 description: Registration ID of the ticket to be paid for
 *                 example: "REG-E9DS4F"
 *
 *     responses:
 *       200:
 *         description: Payment completed successfully
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
 *                   example: "Payment completed successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "f8c4d8e1-5a23-4d92-8c21-123456789abc"
 *                     registration_id:
 *                       type: string
 *                       example: "REG-E9DS4F"
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       example: "7a8b9c10-1234-4567-8901-abcdef123456"
 *                     ticket_id:
 *                       type: string
 *                       format: uuid
 *                       example: "e1c67cda-b985-4a52-8ead-5d403c6d365a"
 *                     status:
 *                       type: string
 *                       example: "registered"
 *                     payment_status:
 *                       type: string
 *                       example: "success"
 *
 *       400:
 *         description: Bad request
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
 *                   examples:
 *                     alreadyPaid:
 *                       value: "Payment has already been completed."
 *
 *       401:
 *         description: Unauthorized
 *
 *       404:
 *         description: User or registration not found
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
 *                   example: "Registration not found."
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /user/check-in:
 *   get:
 *     security : []
 *     summary: Check in a registered user
 *     description: Check in a paid and registered ticket using the registration ID. A ticket can only be checked in once.
 *     tags:
 *       - User
 *     parameters:
 *       - in: query
 *         name: registration_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Registration number of the ticket
 *         example: "REG-CE6MGOQ0RV"
 *     responses:
 *       200:
 *         description: Check-in successful
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
 *                   example: "Check-in successful."
 *                 data:
 *                   type: object
 *                   properties:
 *                     registration_id:
 *                       type: string
 *                       example: "REG-CE6MGOQ0RV"
 *                     checked_in_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-08-11T10:30:00.000Z"
 *
 *       400:
 *         description: Ticket has already been checked in
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
 *                   example: "This ticket has already been checked in."
 *
 *       401:
 *         description: Unauthorized
 *
 *       404:
 *         description: Registration not found
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
 *                   example: "Registration not found."
 *
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /user/cancel-registration:
 *   delete:
 *     summary: Cancel event registration
 *     description: Cancel a paid registration belonging to the authenticated user. Cancellation is allowed only before the registration closing time.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Registration ID
 *         example: "f8c4d8e1-5a23-4d92-8c21-123456789abc"
 *     responses:
 *       200:
 *         description: Registration cancelled successfully
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
 *                   example: "Registration cancelled successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "f8c4d8e1-5a23-4d92-8c21-123456789abc"
 *
 *       400:
 *         description: Registration cannot be cancelled
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
 *                   examples:
 *                     cancellationClosed:
 *                       value: "Registration cancellation period has ended."
 *                     invalidStatus:
 *                       value: "Registration not found."
 *
 *       401:
 *         description: Unauthorized
 *
 *       404:
 *         description: Registration or user not found
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /user/dashboard:
 *   get:
 *     summary: Get user dashboard
 *     description: Get dashboard information for the authenticated user including total spending, refunds, registered events, and upcoming events.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: User dashboard fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: User dashboard fetched successfully.
 *
 *                 data:
 *                   type: object
 *                   properties:
 *
 *                     total_spent:
 *                       type: object
 *                       properties:
 *                         total_amount:
 *                           type: number
 *                           format: float
 *                           example: 15000.00
 *
 *                     total_refund:
 *                       type: object
 *                       properties:
 *                         total_refunded_amount:
 *                           type: number
 *                           format: float
 *                           example: 2500.00
 *
 *                     user_events:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: 550e8400-e29b-41d4-a716-446655440000
 *
 *                           ticket_id:
 *                             type: string
 *                             format: uuid
 *                             example: 660e8400-e29b-41d4-a716-446655440000
 *
 *                           registration_id:
 *                             type: string
 *                             example: REG-10001
 *
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *
 *                           amount:
 *                             type: number
 *                             format: float
 *                             example: 2000.00
 *
 *                           payment_status:
 *                             type: string
 *                             example: PAID
 *
 *                     upcoming_events:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             example: Tech Conference 2026
 *
 *                           description:
 *                             type: string
 *                             example: Annual technology conference.
 *
 *                           address:
 *                             type: string
 *                             example: Convention Centre
 *
 *                           city:
 *                             type: string
 *                             example: Ahmedabad
 *
 *                           state:
 *                             type: string
 *                             example: Gujarat
 *
 *                           country:
 *                             type: string
 *                             example: India
 *
 *                           start_date:
 *                             type: string
 *                             format: date-time
 *                             example: 2026-09-15T10:00:00Z
 *
 *                           end_date:
 *                             type: string
 *                             format: date-time
 *                             example: 2026-09-15T18:00:00Z
 *
 *                           registration_closed_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: 2026-09-14T23:59:59Z
 *
 *                           organizer:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: Jiya Modi
 *                               organization_name:
 *                                 type: string
 *                                 example: Tech Events Pvt Ltd
 *
 *                           category:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: Technology
 *                               description:
 *                                 type: string
 *                                 example: Technology and innovation events.
 *
 *       401:
 *         description: Unauthorized
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /user/edit-profile:
 *   post:
 *     summary: Edit user profile
 *     description: Update the name and email of the authenticated user.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jiya Modi
 *                 description: User's name
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jiya@example.com
 *                 description: User's email address
 *
 *     responses:
 *       200:
 *         description: User details updated successfully
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
 *                   example: User Details updated successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 550e8400-e29b-41d4-a716-446655440000
 *                     name:
 *                       type: string
 *                       example: Jiya Modi
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: jiya@example.com
 *
 *       400:
 *         description: Invalid request data
 *
 *       401:
 *         description: Unauthorized
 *
 *       404:
 *         description: User not found
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /user/feedback:
 *   post:
 *     summary: Submit feedback for an event
 *     description: Allows a checked-in user to submit feedback and a rating for an event.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the event for which feedback is being submitted.
 *         example: "47bcaaca-5235-4c1a-8513-f37b78e7c60e"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *               - rating
 *             properties:
 *               comment:
 *                 type: string
 *                 description: Feedback comment provided by the user.
 *                 example: "The event was very well organized and informative."
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating given to the event.
 *                 example: 5
 *     responses:
 *       200:
 *         description: Feedback submitted successfully.
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
 *                   example: FeedBack Submitted successfully.
 *                 user_id:
 *                   type: string
 *                   format: uuid
 *                   example: "8d4f2c1a-7b3e-4d5f-9a12-123456789abc"
 *
 *       400:
 *         description: Invalid request data.
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
 *                   example: Invalid request data.
 *
 *       401:
 *         description: Unauthorized. Authentication token is missing or invalid.
 *
 *       404:
 *         description: Event or registration not found.
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
 *                   example: Registration not found
 *
 *       500:
 *         description: Internal server error.
 */

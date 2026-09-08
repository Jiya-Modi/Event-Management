/**
 * @swagger
 * /organizer/event:
 *   post:
 *     summary: Add or Edit Event
 *     tags:
 *       - Organizer
 *     description: |
 *       Creates a new event when **id** is not provided.
 *       Updates an existing event when **id** is provided.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Event ID. Required only for updating an existing event.
 *                 example: "8dbeaf97-9e4c-4721-8c03-9d7d93d98384"
 *               title:
 *                 type: string
 *                 example: Tech Conference 2026
 *               description:
 *                 type: string
 *                 example: Annual technology conference.
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 example: "5bbd67c7-0cf6-42af-b2c5-fc71581c6dc0"
 *               address:
 *                 type: string
 *                 example: Convention Center, SG Highway
 *               city:
 *                 type: string
 *                 example: Ahmedabad
 *               state:
 *                 type: string
 *                 example: Gujarat
 *               country:
 *                 type: string
 *                 example: India
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-09-15T10:00:00Z"
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-09-15T18:00:00Z"
 *               publish_at:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: "2026-09-01T09:00:00Z"
 *               registration_closed_at:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-09-14T23:59:59Z"
 *             required:
 *               - title
 *               - category_id
 *               - start_date
 *               - end_date
 *               - registration_closed_at
 *     responses:
 *       201:
 *         description: Event created successfully.
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
 *                   example: Event created successfully.
 *                 module:
 *                   type: string
 *                   example: Event
 *                 data:
 *                   type: object
 *       200:
 *         description: Event updated successfully.
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
 *                   example: Event updated successfully.
 *                 module:
 *                   type: string
 *                   example: Event
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User or Event not found.
 *       500:
 *         description: Internal server error.
 */
/**
 * @swagger
 * /organizer/ticket:
 *   post:
 *     summary: Add or edit tickets
 *     description: Create new tickets or update existing tickets for an event.
 *     tags:
 *       - Organizer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event_id
 *               - tickets
 *             properties:
 *               event_id:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               tickets:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - price
 *                     - registration_limit
 *                     - waitlist_limit
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: Ticket ID. Pass this field when updating an existing ticket.
 *                       example: "550e8400-e29b-41d4-a716-446655440001"
 *                     name:
 *                       type: string
 *                       minLength: 3
 *                       maxLength: 255
 *                       pattern: "^[A-Za-z ]+$"
 *                       example: "VIP"
 *                     price:
 *                       type: number
 *                       format: double
 *                       minimum: 0
 *                       example: 999.99
 *                     registration_limit:
 *                       type: integer
 *                       minimum: 1
 *                       example: 100
 *                     waitlist_limit:
 *                       type: integer
 *                       minimum: 0
 *                       example: 20
 *           examples:
 *             createTickets:
 *               summary: Create new tickets
 *               value:
 *                 event_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 tickets:
 *                   - name: "General"
 *                     price: 500
 *                     registration_limit: 100
 *                     waitlist_limit: 20
 *                   - name: "VIP"
 *                     price: 1000
 *                     registration_limit: 50
 *                     waitlist_limit: 10
 *             editTickets:
 *               summary: Edit existing tickets
 *               value:
 *                 event_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 tickets:
 *                   - id: "550e8400-e29b-41d4-a716-446655440001"
 *                     name: "General"
 *                     price: 600
 *                     registration_limit: 120
 *                     waitlist_limit: 25
 *                   - id: "550e8400-e29b-41d4-a716-446655440002"
 *                     name: "VIP"
 *                     price: 1200
 *                     registration_limit: 60
 *                     waitlist_limit: 15
 *     responses:
 *       201:
 *         description: Tickets created/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tickets saved successfully."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       event_id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       registration_limit:
 *                         type: integer
 *                       waitlist_limit:
 *                         type: integer
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User, event, or ticket not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /organizer/event:
 *   delete:
 *     summary: Delete an event
 *     description: Deletes an event owned by the authenticated organizer. Only events with draft, published, or scheduled status can be deleted.
 *     tags:
 *       - Organizer
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID of the event to delete
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "6d1176db-0963-4567-90fd-b894e796b597"
 *
 *
 *     responses:
 *       200:
 *         description: Event deleted successfully
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
 *                   example: "Event deleted successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "6d1176db-0963-4567-90fd-b894e796b597"
 *
 *       400:
 *         description: Invalid event status or event cannot be deleted
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
 *                   example: "Event cannot be deleted."
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Forbidden. User is not authorized to delete the event.
 *
 *       404:
 *         description: Event not found
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
 *                   example: "Event not found."
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /organizer/dashboard:
 *   get:
 *     summary: Get organizer dashboard
 *     description: Get dashboard statistics for an organizer including total events, total revenue, total refunded amount, most registered event, and least registered event.
 *     tags:
 *       - Organizer
 *
 *     responses:
 *       200:
 *         description: Organizer dashboard fetched successfully
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
 *                   example: Organizer dashboard fetched successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *
 *                     total_events:
 *                       type: integer
 *                       example: 8
 *                       description: Total number of events created by the organizer.
 *
 *                     total_revenue:
 *                       type: object
 *                       properties:
 *                         total_amount:
 *                           type: number
 *                           format: float
 *                           example: 25000
 *                           description: Total revenue generated from paid registrations.
 *
 *                     total_refunded:
 *                       type: object
 *                       properties:
 *                         total_amount:
 *                           type: number
 *                           format: float
 *                           example: 5000
 *                           description: Total amount refunded to users.
 *
 *                     maxRegisteredEvent:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: b1831dad-8f35-4be0-8276-c9837181e6bc
 *                         title:
 *                           type: string
 *                           example: Technology Conference
 *                         total_registered:
 *                           type: integer
 *                           example: 150
 *                           description: Total quantity of tickets registered for the event.
 *
 *                     minRegisteredEvent:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: 770b733b-bebd-4a03-822a-d9c4481d6fd2
 *                         title:
 *                           type: string
 *                           example: Small Business Meetup
 *                         total_registered:
 *                           type: integer
 *                           example: 10
 *                           description: Total quantity of tickets registered for the event.
 *
 *       404:
 *         description: Organizer not found
 *
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /organizer/events:
 *   get:
 *     summary: Get organizer events
 *     description: Get a paginated list of events created by the logged-in organizer with filtering and sorting.
 *     tags:
 *       - Organizer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of events per page
 *
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - draft
 *             - scheduled
 *             - published
 *             - ongoing
 *             - cancelled
 *             - completed
 *         description: Filter events by status
 *
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter events by city
 *
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter events by state
 *
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter events by country
 *
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter events by category name
 *
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date of the date range
 *
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date of the date range
 *
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum:
 *             - created_at
 *             - start_date
 *             - end_date
 *             - title
 *             - status
 *           default: created_at
 *         description: Field used for sorting
 *
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum:
 *             - ASC
 *             - DESC
 *           default: DESC
 *         description: Sorting order
 *
 *     responses:
 *       200:
 *         description: Events fetched successfully
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
 *                   example: Events fetched successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     events:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           address:
 *                             type: string
 *                           city:
 *                             type: string
 *                           state:
 *                             type: string
 *                           country:
 *                             type: string
 *                           start_date:
 *                             type: string
 *                             format: date-time
 *                           end_date:
 *                             type: string
 *                             format: date-time
 *                           publish_at:
 *                             type: string
 *                             format: date-time
 *                           registration_closed_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           status:
 *                             type: string
 *                           category:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               description:
 *                                 type: string
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
 *       400:
 *         description: Invalid query parameters
 *
 *       401:
 *         description: Unauthorized
 *
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /organizer/event:
 *   get:
 *     summary: Get event details
 *     description: Get event information, tickets, registrations, registration summary, revenue, and check-in information.
 *     tags:
 *       - Organizer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: event_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of tickets per page
 *
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         description: Search registrations by username
 *
 *       - in: query
 *         name: ticket_name
 *         schema:
 *           type: string
 *         description: Filter by ticket name
 *
 *       - in: query
 *         name: event_status
 *         schema:
 *           type: string
 *           enum:
 *             - registered
 *             - cancelled
 *             - waitlist
 *         description: Filter registrations by registration status
 *
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - paid
 *             - failed
 *             - refunded
 *         description: Filter registrations by payment status
 *
 *       - in: query
 *         name: checked_in_at
 *         schema:
 *           type: string
 *           enum:
 *             - "true"
 *             - "false"
 *         description: Filter registrations based on check-in status
 *
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum:
 *             - created_at
 *             - name
 *             - price
 *             - registration_limit
 *             - waitlist_limit
 *           default: created_at
 *         description: Field used for sorting
 *
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum:
 *             - ASC
 *             - DESC
 *           default: DESC
 *         description: Sorting order
 *
 *     responses:
 *       200:
 *         description: Event details fetched successfully
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
 *                   example: Event details fetched successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     event:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         title:
 *                           type: string
 *                         description:
 *                           type: string
 *                         address:
 *                           type: string
 *                         city:
 *                           type: string
 *                         state:
 *                           type: string
 *                         country:
 *                           type: string
 *                         start_date:
 *                           type: string
 *                           format: date-time
 *                         end_date:
 *                           type: string
 *                           format: date-time
 *                         publish_at:
 *                           type: string
 *                           format: date-time
 *                         registration_closed_at:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         status:
 *                           type: string
 *                         organizer:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             name:
 *                               type: string
 *                             email:
 *                               type: string
 *                               format: email
 *                         category:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             name:
 *                               type: string
 *
 *                     tickets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *                             format: float
 *                           registration_limit:
 *                             type: integer
 *                           waitlist_limit:
 *                             type: integer
 *                           registrations:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   format: uuid
 *                                 user_id:
 *                                   type: string
 *                                   format: uuid
 *                                 registration_id:
 *                                   type: string
 *                                 quantity:
 *                                   type: integer
 *                                 amount:
 *                                   type: number
 *                                   format: float
 *                                 status:
 *                                   type: string
 *                                 payment_status:
 *                                   type: string
 *                                 checked_in_at:
 *                                   type: string
 *                                   format: date-time
 *                                   nullable: true
 *                                 created_at:
 *                                   type: string
 *                                   format: date-time
 *                                 user:
 *                                   type: object
 *                                   properties:
 *                                     name:
 *                                       type: string
 *                                     email:
 *                                       type: string
 *                                       format: email
 *
 *                     registration_summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               status:
 *                                 type: string
 *                               total_quantity:
 *                                 type: integer
 *
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               payment_status:
 *                                 type: string
 *                               total_amount:
 *                                 type: number
 *                                 format: float
 *
 *                     checkins:
 *                       type: object
 *                       properties:
 *                         checked_in:
 *                           type: integer
 *                           example: 125
 *
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalRows:
 *                           type: integer
 *                           example: 20
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 2
 *
 *       400:
 *         description: Invalid query parameters
 *
 *       401:
 *         description: Unauthorized
 *
 *       404:
 *         description: Event not found
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /organizer/edit-profile:
 *   post:
 *     summary: Edit organizer profile
 *     description: Update the profile details of the authenticated organizer.
 *     tags:
 *       - Organizer
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
 *               - organization_name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jiya Modi
 *                 description: Organizer name
 *
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jiya@example.com
 *                 description: Organizer email address
 *
 *               organization_name:
 *                 type: string
 *                 example: Tech Events Pvt Ltd
 *                 description: Organization name
 *
 *     responses:
 *       200:
 *         description: Organizer details updated successfully
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
 *                   example: Organizer Details updated successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                       example: Jiya Modi
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: jiya@example.com
 *                     organization_name:
 *                       type: string
 *                       example: Tech Events Pvt Ltd
 *
 *       400:
 *         description: Invalid request data
 *
 *       401:
 *         description: Unauthorized
 *
 *       404:
 *         description: Organizer not found
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /organizer/banner:
 *   post:
 *     summary: Upload or replace event banner image
 *     description: |
 *       Uploads a new banner image for an event or replaces an existing banner.
 *
 *       - Provide only **eventId** to upload a new banner.
 *       - Provide both **eventId** and **bannerId** to replace an existing banner.
 *       - Maximum 3 banners are allowed per event.
 *     tags:
 *       - Organizer
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: eventId
 *         required: true
 *         description: ID of the event for which the banner is being uploaded.
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *
 *       - in: query
 *         name: bannerId
 *         required: false
 *         description: |
 *           ID of the existing banner to replace.
 *           Do not provide this parameter when uploading a new banner.
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "550e8400-e29b-41d4-a716-446655440001"
 *
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - banner
 *             properties:
 *               banner:
 *                 type: string
 *                 format: binary
 *                 description: Event banner image file. Allowed formats are JPG, JPEG, PNG, and WEBP. Maximum file size is 5 MB.
 *
 *     responses:
 *       200:
 *         description: Event banner uploaded or replaced successfully.
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
 *                   example: Event banner uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     event_id:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     event_name:
 *                       type: string
 *                       example: Tech Conference 2026
 *                     banner_id:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440001"
 *                     banner:
 *                       type: string
 *                       example: "/uploads/events/banners/event_550e8400-e29b-41d4-a716-446655440000/event-banner.jpg"
 *                     file_name:
 *                       type: string
 *                       example: "event-banner-1725432100.jpg"
 *                     original_file_name:
 *                       type: string
 *                       example: "conference-banner.jpg"
 *                     mimetype:
 *                       type: string
 *                       example: "image/jpeg"
 *                     size:
 *                       type: integer
 *                       example: 245678
 *
 *           examples:
 *             uploadNewBanner:
 *               summary: Upload new banner
 *               value:
 *                 success: true
 *                 message: Event banner uploaded successfully
 *                 data:
 *                   event_id: "550e8400-e29b-41d4-a716-446655440000"
 *                   event_name: "Tech Conference 2026"
 *                   banner_id: "550e8400-e29b-41d4-a716-446655440001"
 *                   banner: "/uploads/events/banners/event_550e8400-e29b-41d4-a716-446655440000/event-banner.jpg"
 *                   file_name: "event-banner-1725432100.jpg"
 *                   original_file_name: "conference-banner.jpg"
 *                   mimetype: "image/jpeg"
 *                   size: 245678
 *
 *             replaceBanner:
 *               summary: Replace existing banner
 *               value:
 *                 success: true
 *                 message: Event banner replaced successfully
 *                 data:
 *                   event_id: "550e8400-e29b-41d4-a716-446655440000"
 *                   event_name: "Tech Conference 2026"
 *                   banner_id: "550e8400-e29b-41d4-a716-446655440001"
 *                   banner: "/uploads/events/banners/event_550e8400-e29b-41d4-a716-446655440000/new-event-banner.jpg"
 *                   file_name: "new-event-banner-1725432100.jpg"
 *                   original_file_name: "new-conference-banner.jpg"
 *                   mimetype: "image/jpeg"
 *                   size: 312456
 *
 *       400:
 *         description: Invalid request, missing eventId, invalid file, or maximum banner limit reached.
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
 *                   example: Maximum 3 banners are allowed for this event
 *
 *       401:
 *         description: Unauthorized.
 *
 *       403:
 *         description: Forbidden. User is not authorized as an organizer.
 *
 *       404:
 *         description: Event or banner not found.
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
 *                   example: Event not found
 *
 *       413:
 *         description: File size exceeds the maximum allowed size of 5 MB.
 *
 *       500:
 *         description: Internal server error.
 */
/**
 * @swagger
 * /organizer/banner:
 *   delete:
 *     summary: Delete event banner image
 *     description: Deletes a specific banner image from an event owned by the authenticated organizer.
 *     tags:
 *       - Organizer
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: eventId
 *         required: true
 *         description: ID of the event from which the banner will be deleted.
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *
 *       - in: query
 *         name: bannerId
 *         required: true
 *         description: ID of the banner image to delete.
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "550e8400-e29b-41d4-a716-446655440001"
 *
 *     responses:
 *       200:
 *         description: Event banner deleted successfully.
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
 *                   example: Event banner deleted successfully.
 *                 module:
 *                   type: string
 *                   example: Event
 *                 data:
 *                   type: object
 *                   properties:
 *                     event_id:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     banner_id:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440001"
 *
 *       400:
 *         description: Invalid request or banner cannot be deleted.
 *
 *       401:
 *         description: Unauthorized.
 *
 *       403:
 *         description: Forbidden. User is not authorized to delete this event banner.
 *
 *       404:
 *         description: Event or banner not found.
 *
 *       500:
 *         description: Internal server error.
 */

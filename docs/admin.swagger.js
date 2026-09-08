/**
 * @swagger
 * /admin/organizer:
 *   post:
 *     summary: Create a new organizer
 *     description: Allows a Super Admin to create a new organizer account.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - organization_name
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Smith
 *               email:
 *                 type: string
 *                 format: email
 *                 example: organizer@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Organizer@123
 *               organization_name:
 *                 type: string
 *                 example: ABC Events Pvt Ltd
 *
 *     responses:
 *       201:
 *         description: Organizer created successfully.
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
 *                   example: Organizer created successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     organizer:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: b6c7d1b5-2b18-4dc5-a4b5-1e63f8d1f4c2
 *                         name:
 *                           type: string
 *                           example: John Smith
 *                         email:
 *                           type: string
 *                           example: organizer@example.com
 *                         organization_name:
 *                           type: string
 *                           example: ABC Events Pvt Ltd
 *                         role:
 *                           type: string
 *                           example: Organizer
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: 2026-08-06T10:30:45.000Z
 *
 *       400:
 *         description: Validation failed.
 *
 *       401:
 *         description: Unauthorized. Invalid or missing access token.
 *
 *       403:
 *         description: Forbidden. Only Super Admin can create organizers.
 *
 *       409:
 *         description: Email already exists.
 *
 *       500:
 *         description: Internal server error.
 */
/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get Super Admin dashboard
 *     description: Returns platform-wide statistics for the Super Admin.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/organizers:
 *   get:
 *     summary: Get all organizers
 *     description: Get paginated organizers with optional filtering by status, name, and organization name, along with sorting.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of organizers to return per page.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           example: 10
 *
 *       - in: query
 *         name: status
 *         required: false
 *         description: Filter organizers by status.
 *         schema:
 *           type: string
 *           enum:
 *             - active
 *             - inactive
 *           example: active
 *
 *       - in: query
 *         name: name
 *         required: false
 *         description: Filter organizers by name. The filter is case-insensitive and supports partial matching.
 *         schema:
 *           type: string
 *           maxLength: 100
 *           example: Xyz
 *
 *       - in: query
 *         name: organization_name
 *         required: false
 *         description: Filter organizers by organization name. The filter is case-insensitive and supports partial matching.
 *         schema:
 *           type: string
 *           maxLength: 150
 *           example: ABC Events
 *
 *       - in: query
 *         name: sortBy
 *         required: false
 *         description: Field by which organizers should be sorted.
 *         schema:
 *           type: string
 *           enum:
 *             - name
 *             - organization_name
 *           default: created_at
 *           example: name
 *
 *       - in: query
 *         name: sortOrder
 *         required: false
 *         description: Sorting direction.
 *         schema:
 *           type: string
 *           enum:
 *             - ASC
 *             - DESC
 *           default: DESC
 *           example: ASC
 *
 *     responses:
 *       200:
 *         description: Organizers fetched successfully.
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
 *                   example: Organizers fetched successfully.
 *
 *                 data:
 *                   type: object
 *                   properties:
 *                     organizers:
 *                       type: array
 *                       description: List of organizers.
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "550e8400-e29b-41d4-a716-446655440000"
 *
 *                           name:
 *                             type: string
 *                             example: "Xyz"
 *
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: "xyz@example.com"
 *
 *                           organization_name:
 *                             type: string
 *                             example: "ABC Events"
 *
 *                           status:
 *                             type: string
 *                             enum:
 *                               - active
 *                               - inactive
 *                             example: active
 *
 *                           role:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: organizer
 *
 *                               description:
 *                                 type: string
 *                                 example: Event organizer
 *
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalRows:
 *                           type: integer
 *                           example: 25
 *
 *                         page:
 *                           type: integer
 *                           example: 1
 *
 *                         limit:
 *                           type: integer
 *                           example: 10
 *
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 *
 *       400:
 *         description: Bad request. Invalid query parameters.
 *
 *       401:
 *         description: Unauthorized. Authentication token is missing or invalid.
 *
 *       403:
 *         description: Forbidden. Only Super Admin can access this resource.
 *
 *       404:
 *         description: No organizers found.
 *
 *       500:
 *         description: Internal server error.
 */
/**
 * @swagger
 * /admin/organizer:
 *   get:
 *     summary: Get organizer details
 *     description: Get organizer details along with their events with filtering, sorting, and pagination.
 *     tags:
 *       - Admin
 *
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organizer ID
 *
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *         description: Page number
 *
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *           example: 10
 *         description: Number of events to return per page
 *
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - draft
 *             - scheduled
 *             - published
 *             - ongoing
 *             - cancelled
 *             - completed
 *         description: Filter events by event status
 *
 *       - in: query
 *         name: city
 *         required: false
 *         schema:
 *           type: string
 *           example: Ahmedabad
 *         description: Filter events by city
 *
 *       - in: query
 *         name: state
 *         required: false
 *         schema:
 *           type: string
 *           example: Gujarat
 *         description: Filter events by state
 *
 *       - in: query
 *         name: country
 *         required: false
 *         schema:
 *           type: string
 *           example: India
 *         description: Filter events by country
 *
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *           example: Technology
 *         description: Search events by category name. Case-insensitive partial matching is supported.
 *
 *       - in: query
 *         name: start_date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-08-01
 *         description: Filter events starting from the specified date
 *
 *       - in: query
 *         name: end_date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-08-31
 *         description: Filter events up to the specified date
 *
 *       - in: query
 *         name: sortBy
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - title
 *             - city
 *             - state
 *             - country
 *             - start_date
 *             - end_date
 *             - publish_at
 *             - registration_closed_at
 *             - status
 *             - created_at
 *           default: created_at
 *         description: Field by which events should be sorted
 *
 *       - in: query
 *         name: sortOrder
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - ASC
 *             - DESC
 *           default: ASC
 *         description: Sorting order
 *
 *     responses:
 *       200:
 *         description: Organizer details retrieved successfully
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
 *                   example: Organizer fetched successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     organizer:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         email:
 *                           type: string
 *                           example: john@example.com
 *                         organization_name:
 *                           type: string
 *                           example: ABC Events
 *                         status:
 *                           type: string
 *                           example: active
 *
 *                     events:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: b1831dad-8f35-4be0-8276-c9837181e6bc
 *                           title:
 *                             type: string
 *                             example: Technology Conference
 *                           description:
 *                             type: string
 *                             example: Annual technology conference
 *                           address:
 *                             type: string
 *                             example: Convention Center
 *                           city:
 *                             type: string
 *                             example: Ahmedabad
 *                           state:
 *                             type: string
 *                             example: Gujarat
 *                           country:
 *                             type: string
 *                             example: India
 *                           start_date:
 *                             type: string
 *                             format: date-time
 *                             example: 2026-08-20T10:00:00Z
 *                           end_date:
 *                             type: string
 *                             format: date-time
 *                             example: 2026-08-20T18:00:00Z
 *                           publish_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: 2026-08-15T10:00:00Z
 *                           registration_closed_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: 2026-08-19T23:59:59Z
 *                           status:
 *                             type: string
 *                             example: published
 *                           category:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: Technology
 *                               description:
 *                                 type: string
 *                                 example: Technology and innovation events
 *
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
 *         description: Bad request
 *
 *       404:
 *         description: Organizer not found
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/event:
 *   get:
 *     summary: Get event details
 *     description: Get event details along with tickets, registrations, registration summary, revenue, check-in count, filtering, sorting, and pagination.
 *     tags:
 *       - Admin
 *
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
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *         description: Page number
 *
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *           example: 10
 *         description: Number of tickets to return per page
 *
 *       - in: query
 *         name: username
 *         required: false
 *         schema:
 *           type: string
 *           example: John
 *         description: Search registrations by username. Case-insensitive partial matching is supported.
 *
 *       - in: query
 *         name: ticket_name
 *         required: false
 *         schema:
 *           type: string
 *           example: VIP
 *         description: Filter tickets by ticket name
 *
 *       - in: query
 *         name: event_status
 *         required: false
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
 *         required: false
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
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - "true"
 *             - "false"
 *         description: |
 *           Filter registrations by check-in status.
 *           true = checked in (checked_in_at IS NOT NULL).
 *           false = not checked in (checked_in_at IS NULL).
 *
 *       - in: query
 *         name: sortBy
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - id
 *             - name
 *             - price
 *             - registration_limit
 *             - waitlist_limit
 *         description: Field by which tickets should be sorted
 *
 *       - in: query
 *         name: sortOrder
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - ASC
 *             - DESC
 *           default: ASC
 *         description: Sorting order
 *
 *     responses:
 *       200:
 *         description: Event details retrieved successfully
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
 *                   example: Event fetched successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *
 *                     event:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: b1831dad-8f35-4be0-8276-c9837181e6bc
 *                         title:
 *                           type: string
 *                           example: Conference
 *                         description:
 *                           type: string
 *                           example: Annual technology conference
 *                         address:
 *                           type: string
 *                           example: Convention Center
 *                         city:
 *                           type: string
 *                           example: Ahmedabad
 *                         state:
 *                           type: string
 *                           example: Gujarat
 *                         country:
 *                           type: string
 *                           example: India
 *                         start_date:
 *                           type: string
 *                           format: date-time
 *                           example: 2026-08-20T10:00:00Z
 *                         end_date:
 *                           type: string
 *                           format: date-time
 *                           example: 2026-08-20T18:00:00Z
 *                         publish_at:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: 2026-08-15T10:00:00Z
 *                         registration_closed_at:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: 2026-08-19T23:59:59Z
 *                         status:
 *                           type: string
 *                           example: published
 *                         organizer:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                               example: 7f3c6d1a-1234-4567-8901-abcdef123456
 *                             name:
 *                               type: string
 *                               example: John Doe
 *                             email:
 *                               type: string
 *                               example: john@example.com
 *                         category:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                               example: 9c123456-1234-4567-8901-abcdef123456
 *                             name:
 *                               type: string
 *                               example: Technology
 *
 *                     tickets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: 8c9014ff-96b2-488f-b9df-b104efa38bbc
 *                           name:
 *                             type: string
 *                             example: VIP
 *                           price:
 *                             type: string
 *                             example: "1000.00"
 *                           registration_limit:
 *                             type: integer
 *                             example: 50
 *                           waitlist_limit:
 *                             type: integer
 *                             example: 10
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
 *                                   example: REG-DYSC3VFX2J
 *                                 quantity:
 *                                   type: integer
 *                                   example: 3
 *                                 amount:
 *                                   type: number
 *                                   example: 3000
 *                                 status:
 *                                   type: string
 *                                   example: registered
 *                                 payment_status:
 *                                   type: string
 *                                   example: paid
 *                                 checked_in_at:
 *                                   type: string
 *                                   format: date-time
 *                                   nullable: true
 *                                   example: 2026-08-12T12:54:57.385Z
 *                                 user:
 *                                   type: object
 *                                   properties:
 *                                     name:
 *                                       type: string
 *                                       example: John Doe
 *                                     email:
 *                                       type: string
 *                                       example: john@example.com
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
 *                                 example: registered
 *                               total_quantity:
 *                                 type: integer
 *                                 example: 25
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
 *                                 example: paid
 *                               total_amount:
 *                                 type: number
 *                                 example: 25000
 *
 *                     checkins:
 *                       type: object
 *                       properties:
 *                         checked_in:
 *                           type: integer
 *                           example: 15
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
 *         description: Bad request
 *
 *       404:
 *         description: Event not found
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/events:
 *   get:
 *     summary: Get all events
 *     description: Get paginated events with optional filtering and sorting by status, city, state, country, category, and start date range.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of events to return per page.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           example: 10
 *
 *       - in: query
 *         name: status
 *         required: false
 *         description: Filter events by status.
 *         schema:
 *           type: string
 *           enum:
 *             - draft
 *             - scheduled
 *             - published
 *             - ongoing
 *             - cancelled
 *             - completed
 *           example: published
 *
 *       - in: query
 *         name: city
 *         required: false
 *         description: Filter events by city. The filter is case-insensitive.
 *         schema:
 *           type: string
 *           maxLength: 100
 *           example: Ahmedabad
 *
 *       - in: query
 *         name: state
 *         required: false
 *         description: Filter events by state. The filter is case-insensitive.
 *         schema:
 *           type: string
 *           maxLength: 100
 *           example: Gujarat
 *
 *       - in: query
 *         name: country
 *         required: false
 *         description: Filter events by country. The filter is case-insensitive.
 *         schema:
 *           type: string
 *           maxLength: 100
 *           example: India
 *
 *       - in: query
 *         name: category
 *         required: false
 *         description: Search events by category. The search is case-insensitive and supports partial matching.
 *         schema:
 *           type: string
 *           maxLength: 100
 *           example: Tech
 *
 *       - in: query
 *         name: start_date
 *         required: false
 *         description: Filter events whose start date is on or after this date.
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-08-01"
 *
 *       - in: query
 *         name: end_date
 *         required: false
 *         description: Filter events whose start date is on or before this date.
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-08-31"
 *
 *       - in: query
 *         name: sortBy
 *         required: false
 *         description: Field by which events should be sorted.
 *         schema:
 *           type: string
 *           enum:
 *             - title
 *             - city
 *             - state
 *             - country
 *             - start_date
 *             - end_date
 *           default: created_at
 *           example: start_date
 *
 *       - in: query
 *         name: sortOrder
 *         required: false
 *         description: Sorting direction.
 *         schema:
 *           type: string
 *           enum:
 *             - ASC
 *             - DESC
 *           default: DESC
 *           example: ASC
 *
 *     responses:
 *       200:
 *         description: Events fetched successfully.
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
 *                   example: Events fetched successfully.
 *
 *                 data:
 *                   type: object
 *                   properties:
 *                     events:
 *                       type: array
 *                       description: List of events.
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "550e8400-e29b-41d4-a716-446655440000"
 *
 *                           title:
 *                             type: string
 *                             example: "Tech Conference 2026"
 *
 *                           description:
 *                             type: string
 *                             example: "A technology conference for developers."
 *
 *                           address:
 *                             type: string
 *                             example: "123 Main Street"
 *
 *                           city:
 *                             type: string
 *                             example: "Ahmedabad"
 *
 *                           state:
 *                             type: string
 *                             example: "Gujarat"
 *
 *                           country:
 *                             type: string
 *                             example: "India"
 *
 *                           start_date:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-08-15T10:00:00.000Z"
 *
 *                           end_date:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-08-15T18:00:00.000Z"
 *
 *                           publish_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: "2026-08-14T10:00:00.000Z"
 *
 *                           registration_closed_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: "2026-08-15T09:00:00.000Z"
 *
 *                           status:
 *                             type: string
 *                             enum:
 *                               - draft
 *                               - scheduled
 *                               - published
 *                               - ongoing
 *                               - cancelled
 *                               - completed
 *                             example: published
 *
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalRows:
 *                           type: integer
 *                           example: 25
 *
 *                         page:
 *                           type: integer
 *                           example: 1
 *
 *                         limit:
 *                           type: integer
 *                           example: 10
 *
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 *
 *       400:
 *         description: Bad request. Invalid query parameters.
 *
 *       401:
 *         description: Unauthorized. Authentication token is missing or invalid.
 *
 *       403:
 *         description: Forbidden. Only Super Admin can access this resource.
 *
 *       404:
 *         description: No events found.
 *
 *       500:
 *         description: Internal server error.
 */
/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     description: Get paginated users with optional filtering by status and name, along with sorting.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of users to return per page.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           example: 10
 *
 *       - in: query
 *         name: status
 *         required: false
 *         description: Filter users by status.
 *         schema:
 *           type: string
 *           enum:
 *             - active
 *             - inactive
 *           example: active
 *
 *       - in: query
 *         name: name
 *         required: false
 *         description: Filter users by name. The filter is case-insensitive and supports partial matching.
 *         schema:
 *           type: string
 *           maxLength: 100
 *           example: Xyz
 *
 *       - in: query
 *         name: sortBy
 *         required: false
 *         description: Field by which users should be sorted.
 *         schema:
 *           type: string
 *           enum:
 *             - name
 *             - email
 *             - status
 *             - created_at
 *           default: created_at
 *           example: name
 *
 *       - in: query
 *         name: sortOrder
 *         required: false
 *         description: Sorting direction.
 *         schema:
 *           type: string
 *           enum:
 *             - ASC
 *             - DESC
 *           default: DESC
 *           example: ASC
 *
 *     responses:
 *       200:
 *         description: Users fetched successfully.
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
 *                   example: Users fetched successfully.
 *
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       description: List of users.
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "550e8400-e29b-41d4-a716-446655440000"
 *
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: "john@example.com"
 *
 *                           status:
 *                             type: string
 *                             enum:
 *                               - active
 *                               - inactive
 *                             example: active
 *
 *                           role:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: user
 *
 *                               description:
 *                                 type: string
 *                                 example: Normal application user
 *
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalRows:
 *                           type: integer
 *                           example: 50
 *
 *                         page:
 *                           type: integer
 *                           example: 1
 *
 *                         limit:
 *                           type: integer
 *                           example: 10
 *
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *
 *       400:
 *         description: Bad request. Invalid query parameters.
 *
 *       401:
 *         description: Unauthorized. Authentication token is missing or invalid.
 *
 *       403:
 *         description: Forbidden. Only Super Admin can access this resource.
 *
 *       404:
 *         description: No users found.
 *
 *       500:
 *         description: Internal server error.
 */
/**
 * @swagger
 * /admin/user:
 *   get:
 *     summary: Get user details
 *     description: Get user details along with registration details, filtering, sorting, and pagination.
 *     tags:
 *       - Admin
 *
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *
 *       - in: query
 *         name: status
 *         required: false
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
 *         required: false
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
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - "true"
 *             - "false"
 *         description: |
 *           Filter registrations by check-in status.
 *           true = checked in (checked_in_at IS NOT NULL).
 *           false = not checked in (checked_in_at IS NULL).
 *
 *       - in: query
 *         name: event_name
 *         required: false
 *         schema:
 *           type: string
 *           example: Conference
 *         description: Search registrations by event name. Case-insensitive partial matching is supported.
 *
 *       - in: query
 *         name: sortBy
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - quantity
 *             - amount
 *           default: created_at
 *         description: Field by which registrations should be sorted
 *
 *       - in: query
 *         name: sortOrder
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - ASC
 *             - DESC
 *           default: ASC
 *         description: Sorting order
 *
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *         description: Page number
 *
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *           example: 10
 *         description: Number of registrations to return per page
 *
 *     responses:
 *       200:
 *         description: User details retrieved successfully
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
 *                   example: User fetched successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: Qwe
 *                         email:
 *                           type: string
 *                           example: qwe@example.com
 *                         status:
 *                           type: string
 *                           example: active
 *
 *                     registrations:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                           example: 25
 *                         rows:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               registration_id:
 *                                 type: string
 *                                 example: REG-DYSC3VFX2J
 *                               quantity:
 *                                 type: integer
 *                                 example: 3
 *                               amount:
 *                                 type: number
 *                                 format: float
 *                                 example: 3000
 *                               status:
 *                                 type: string
 *                                 example: registered
 *                               payment_status:
 *                                 type: string
 *                                 example: paid
 *                               checked_in_at:
 *                                 type: string
 *                                 format: date-time
 *                                 nullable: true
 *                                 example: 2026-08-12T12:54:57.385Z
 *
 *       400:
 *         description: Bad request
 *
 *       404:
 *         description: User not found
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/user:
 *   delete:
 *     summary: Delete user
 *     description: |
 *       Deletes a user based on their user ID.
 *
 *       If the user is a normal user:
 *       - Paid registrations are marked as CANCELLED and REFUNDED.
 *       - Pending registrations are marked as CANCELLED and FAILED.
 *
 *       If the user is an organizer:
 *       - All events created by the organizer are marked as CANCELLED.
 *       - Paid registrations are marked as CANCELLED and REFUNDED.
 *       - Pending registrations are marked as CANCELLED and FAILED.
 *       - The organizer account is deleted.
 *
 *       The entire operation is performed inside a database transaction.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully.
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
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
 *                   example: User cannot be deleted.
 *
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized.
 *
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found.
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error.
 */

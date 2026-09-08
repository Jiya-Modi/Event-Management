module.exports = {
  // HTTP Status Codes
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,

    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,

    INTERNAL_SERVER_ERROR: 500,
  },

  // Module Names
  MODULES: {
    ROLE: 'Role',
    ROLES: 'Roles',

    USER: 'User',
    USERS: 'Users',

    ORGANIZER: 'Organizer',
    ORGANIZERS: 'Organizers',

    EVENT: 'Event',
    EVENTS: 'Events',

    EVENT_CATEGORY: 'Event Category',
    EVENT_CATEGORIES: 'Event Categories',

    TICKET: 'Ticket',
    TICKETS: 'Tickets',

    REGISTRATION: 'Registration',
    REGISTRATIONS: 'Registrations',

    FEEDBACK: 'Feedback',
    FEEDBACKS: 'Feedback',

    NOTIFICATION: 'Notification',
    NOTIFICATIONS: 'Notifications',

    ATTENDANCE: 'Attendance',
    ATTENDANCES: 'Attendance',

    REPORT: 'Report',
    REPORTS: 'Reports',

    NOTIFICATION: 'Notification',
    NOTIFICATIONS: 'Notifications',
  },

  // Roles
  ROLES: {
    SUPER_ADMIN: 'Super Admin',
    ORGANIZER: 'Organizer',
    USER: 'User',
  },

  USER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  },

  // Event Status
  EVENT_STATUS: {
    DRAFT: 'draft',
    SCHEDULED: 'scheduled',
    PUBLISHED: 'published',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  // Registration Status
  REGISTRATION_STATUS: {
    REGISTERED: 'registered',
    WAITLIST: 'waitlist',
    CANCELLED: 'cancelled',
    PARTIAL_CONFIRM: 'partial_confirm',
  },

  PARTIAL_REGISTRATION_STATUS: {
    CONFIRMED: 'confirmed',
    REFUND: 'refund',
    PENDING: 'pending',
  },

  // Payment Status
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    PARTIAL_REFUND: 'partial_refund',
  },

  // Notification Types
  SCHEDULED_TYPES: {
    EVENT_REMINDER: 'reminder',
    UNPAID_BOOKINGS: 'unpaid_bookings',
    AFTER_EVENT_REPORT: 'after_event_report',
    BEFORE_EVENT_REPORT: 'before_event_report',
    FEEDBACK_REQUEST: 'feedback_request',
    EVENT_COMPLETE: 'event_completion',
    EVENT_ONGOING: 'event_ongoing',
    EVENT_REFUND: 'event_refund',
  },

  NOTIFICATION_TYPES: {
    REMINDER: 'reminder',
    EVENT_CANCELLED: 'event_cancelled',
    EVENT_RESCHEDULED: 'event_rescheduled',
  },

  // Notification Status
  SCHEDULED_STATUS: {
    PENDING: 'pending',
    SENT: 'sent',
    FAILED: 'failed',
  },

  // JWT Token Types
  TOKEN_TYPES: {
    ACCESS: 'access',
    REFRESH: 'refresh',
  },

  // Date Formats
  DATE_FORMAT: {
    DATE: 'YYYY-MM-DD',
    DATETIME: 'YYYY-MM-DD HH:mm:ss',
  },

  // Cookie Names
  COOKIES: {
    REFRESH_TOKEN: 'refreshToken',
  },

  // Header Names
  HEADERS: {
    AUTHORIZATION: 'Authorization',
    CONTENT_TYPE: 'Content-Type',
  },

  // Rate Limiter
  RATELIMIT: {
    LOGIN: {
      WINDOW_MS: 15 * 60 * 1000,
      MAX: 10,
    },
    REGISTER: {
      WINDOW_MS: 60 * 60 * 1000,
      MAX: 5,
    },
  },

  AUDIT_MODULES: {
    USER: 'user',
    EVENT: 'event',
    TICKET: 'ticket',
    REGISTRATION: 'registration',
    PARTIAL_REGISTRATION: 'partial_registration',
    SCHEDULER: 'scheduler',
    FEEDBACK: 'feedback',
    NOTIFICATION: 'notification',
  },

  AUDIT_ACTIONS: {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
  },
};

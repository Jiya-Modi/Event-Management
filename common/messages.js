module.exports = {
  // CRUD
  CREATED: '## created successfully.',
  UPDATED: '## updated successfully.',
  DELETED: '## deleted successfully.',
  FETCHED: '## fetched successfully.',
  RESTORED: '## restored successfully.',

  // Common Errors
  NOT_FOUND: '## not found.',
  ALREADY_EXISTS: '## already exists.',
  INVALID: 'Invalid ##.',
  REQUIRED: '## is required.',
  NOT_ALLOWED: '## is not allowed.',
  IN_USE: '## is already in use.',

  // Authentication
  LOGIN_SUCCESS: 'Login successful.',
  LOGOUT_SUCCESS: 'Logout successful.',
  REGISTER_SUCCESS: 'Registration successful.',
  PASSWORD_CHANGED: 'Password changed successfully.',
  PASSWORD_RESET: 'Password reset successfully.',
  PASSWORD_RESET_LINK_SENT: 'Password reset link sent successfully.',

  INVALID_CREDENTIALS: 'Invalid email or password.',
  INVALID_TOKEN: 'Invalid token.',
  INVALID_EMAIL: 'Invalid email.',
  TOKEN_EXPIRED: 'Token has expired.',
  UNAUTHORIZED: 'Unauthorized.',
  ACCESS_DENIED: 'Access denied.',
  ACCESS_TOKEN_REFRESHED: 'Access Token Refreshed',

  // Validation
  VALIDATION_FAILED: 'Validation failed.',
  INVALID_REQUEST: 'Invalid request.',

  // Event
  EVENT_PUBLISHED: 'Event published successfully.',
  EVENT_CANCELLED: 'Event cancelled successfully.',
  EVENT_COMPLETED: 'Event completed successfully.',
  EVENT_ALREADY_PUBLISHED: 'Event is already published.',
  REGISTRATION_CLOSED: 'Event registration is closed.',
  REGISTRATION_CANCELLED_DURATION:
    'Registration cancellation period has ended.',

  // Registration
  REGISTRATION_SUCCESS: 'Successfully registered for the event.',
  WAITLIST_SUCCESS: 'Added to the waitlist successfully.',
  ALREADY_REGISTERED: 'User is already registered for this event.',
  REGISTRATION_LIMIT_REACHED: 'Registration limit has been reached.',
  WAITLIST_LIMIT_REACHED: 'Waitlist limit has been reached.',
  REGISTRATION_CANCELLED: 'Successfully cancelled registration for the event.',

  PAYMENT_ALREADY_COMPLETED: 'Payment has already been completed.',
  PAYMENT_SUCCESS: 'Payment Success',

  DEVICE_ADDED: 'Device Added Successfully',
  READ_NOTIFICATION: 'Notification read successfully',

  // Attendance
  CHECK_IN_SUCCESS: 'Check-in completed successfully.',

  // Ticket
  TICKET_GENERATED: 'Ticket generated successfully.',
  TICKET_SENT: 'Ticket sent successfully.',

  // Notification
  NOTIFICATION_SENT: 'Notification sent successfully.',
  EMAIL_SENT: 'Email sent successfully.',
  FEEDBACK_SUCCESS: 'Feedback Submitted Successfully',

  // Generic
  SUCCESS: 'Request completed successfully.',
  FAILED: 'Request failed.',
  INTERNAL_SERVER_ERROR: 'Internal server error.',

  // Rate Limit
  LOGIN_LIMIT: 'Too many login attempts. Please try again after 15 minutes.',
  REGISTER_LIMIT:
    'You have exceeded the maximum number of registration attempts. Please wait 15 minutes before trying again.',
};

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     security: []
 *     summary: Register a new user
 *     description: Allows a user to register and receive access and refresh tokens.
 *     tags:
 *       - Authentication
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Xyz
 *               email:
 *                 type: string
 *                 format: email
 *                 example: xyz@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Xyz@123
 *
 *     responses:
 *       201:
 *         description: User created successfully.
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
 *                   example: User created successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: 9f58c865-bc8d-4eb5-a19b-3e0f6336df80
 *                         name:
 *                           type: string
 *                           example: Xyz
 *                         email:
 *                           type: string
 *                           example: xyz@example.com
 *                         role:
 *                           type: string
 *                           example: User
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: 2026-08-05T10:30:45.000Z
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refreshToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 *       400:
 *         description: Validation failed.
 *
 *       409:
 *         description: Email already exists.
 *
 *       500:
 *         description: Internal server error.
 */
/**
 * @swagger
 * /auth/signin:
 *   post:
 *     security: []
 *     summary: Login existing user
 *     description: Authenticates a user and returns access and refresh tokens.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: xyz@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: xyz@123
 *
 *     responses:
 *       200:
 *         description: User logged in successfully.
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
 *                   example: User logged in successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                           example: Xyz
 *                         email:
 *                           type: string
 *                           example: xyz@example.com
 *                         organization_name:
 *                           type: string
 *                           nullable: true
 *                           example: XYZ Events Pvt Ltd
 *                         role:
 *                           type: string
 *                           example: User
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refreshToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 *       400:
 *         description: Validation failed.
 *
 *       401:
 *         description: Invalid email or password.
 *
 *       500:
 *         description: Internal server error.
 */
/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh Access Token
 *     tags:
 *       - Authentication
 *     description: Generates a new access token using a valid refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token issued during login.
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxx.yyyyyyyyy
 *     responses:
 *       200:
 *         description: Access token refreshed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Access token refreshed successfully.
 *                 module:
 *                   type: string
 *                   example: User
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.newAccessToken
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: Invalid, expired, or revoked refresh token.
 *       500:
 *         description: Internal Server Error
 */
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     security: []
 *     summary: Forgot Password
 *     tags:
 *       - Authentication
 *     description: Generates a password reset token and sends a password reset link to the registered email address.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset link sent successfully.
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
 *                   example: Password reset link has been sent successfully.
 *                 module:
 *                   type: string
 *                   example: User
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Password reset link has been sent successfully.
 *       404:
 *         description: Email not found.
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
 *                   example: Invalid email address.
 *       500:
 *         description: Internal server error.
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
 *                   example: Internal server error.
 */
/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     security: []
 *     summary: Reset Password
 *     tags:
 *       - Authentication
 *     description: Resets the user's password using a valid reset token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resetToken
 *               - password
 *               - confirm_password
 *             properties:
 *               reset_token:
 *                 type: string
 *                 description: JWT reset token received in the password reset email.
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NewPassword@123
 *               confirm_password:
 *                 type: string
 *                 format: password
 *                 example: NewPassword@123
 *     responses:
 *       200:
 *         description: Password reset successfully.
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
 *                   example: Password has been reset successfully.
 *                 module:
 *                   type: string
 *                   example: User
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Password has been reset successfully.
 *       400:
 *         description: Validation error.
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
 *                   example: Password and confirm password must match.
 *       401:
 *         description: Invalid or expired reset token.
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
 *                     invalidToken:
 *                       value: Invalid Reset Token.
 *                     expiredToken:
 *                       value: Reset token has expired.
 *       404:
 *         description: User not found.
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
 *                   example: User not found.
 *       500:
 *         description: Internal server error.
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
 *                   example: Internal server error.
 */
/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change Password
 *     tags:
 *       - Authentication
 *     description: Changes the password of the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - new_password
 *               - confirm_password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Current password.
 *                 example: OldPassword@123
 *               new_password:
 *                 type: string
 *                 format: password
 *                 description: New password.
 *                 example: NewPassword@123
 *               confirm_password:
 *                 type: string
 *                 format: password
 *                 description: Confirm new password.
 *                 example: NewPassword@123
 *     responses:
 *       200:
 *         description: Password changed successfully.
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
 *                   example: Password has been changed successfully.
 *                 module:
 *                   type: string
 *                   example: User
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Password has been changed successfully.
 *       400:
 *         description: Validation error or new password is the same as the current password.
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
 *                     validation:
 *                       value: Confirm password must match new password.
 *                     samePassword:
 *                       value: New password cannot be the same as the current password.
 *       401:
 *         description: Unauthorized or invalid current password.
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
 *                   example: Invalid Password.
 *       404:
 *         description: User not found.
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
 *                   example: User not found.
 *       500:
 *         description: Internal server error.
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
 *                   example: Internal server error.
 */
/**
 * @swagger
 * /auth/signout:
 *   post:
 *     summary: Logout User
 *     tags:
 *       - Authentication
 *     description: Logs out the authenticated user by invalidating the stored refresh token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully.
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
 *                   example: Logged out successfully.
 *                 module:
 *                   type: string
 *                   example: User
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Logged out successfully.
 *       401:
 *         description: Unauthorized or invalid access token.
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
 *                   example: Unauthorized.
 *       404:
 *         description: User not found.
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
 *                   example: User not found.
 *       500:
 *         description: Internal server error.
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
 *                   example: Internal server error.
 */
/**
 * @swagger
 * /auth/profile:
 *   post:
 *     summary: Upload or replace profile photo
 *     description: Uploads a new profile photo or replaces the existing profile photo of the authenticated organizer/user.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: false
 *         description: Optional user ID used to indicate that the existing profile photo is being replaced.
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profile:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file.
 *
 *     responses:
 *       200:
 *         description: Profile photo uploaded or replaced successfully.
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
 *                   example: Profile photo uploaded successfully
 *                 data:
 *                   type: object
 *
 *       400:
 *         description: Invalid file or request.
 *
 *       401:
 *         description: Unauthorized.
 *
 *       404:
 *         description: User not found.
 *
 *       500:
 *         description: Internal server error.
 */
/**
 * @swagger
 * /auth/profile:
 *   delete:
 *     summary: Delete profile photo
 *     description: Deletes the profile photo of the authenticated organizer/user.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: false
 *         description: Optional user ID parameter.
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *
 *     responses:
 *       200:
 *         description: Profile photo deleted successfully.
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
 *                   example: Profile deleted successfully.
 *                 errors:
 *                   nullable: true
 *                   example: null
 *
 *       400:
 *         description: Invalid request or profile photo cannot be deleted.
 *
 *       401:
 *         description: Unauthorized.
 *
 *       404:
 *         description: Profile photo or user not found.
 *
 *       500:
 *         description: Internal server error.
 */

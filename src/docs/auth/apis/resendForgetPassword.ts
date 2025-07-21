/**
 * @swagger
 * /auth/password/resend:
 *   post:
 *     summary: resend forget password user
 *     requestBody:
 *        required: true
 *        content:
 *            application/json:
 *                schema:
 *                   $ref: '#/components/schemas/RegisterPhone'
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Register Success
 *       400:
 *          description: 	Validation Failed
 *       401:
 *          description: Error Token
 *       403:
 *          description: Access Denied / Unauthorized
 *       500:
 *          description: Internal server error
 *
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh token
 *     tags: [Authentication]
 *     requestBody:
 *        required: true
 *        content:
 *            application/json:
 *                schema:
 *                   $ref: '#/components/schemas/RefreshToken'
 *     security:
 *      - bearerAuth: []
 *     responses:
 *       200:
 *         description: Refresh token
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/Tokens'
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

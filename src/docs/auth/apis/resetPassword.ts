/**
 * @swagger
 * /auth/password/reset:
 *   post:
 *     summary: reset password
 *     requestBody:
 *        required: true
 *        content:
 *            application/json:
 *                schema:
 *                   $ref: '#/components/schemas/ResetPassword'
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Verification Success
 *         content:
 *           application/json:
 *             schema:
 *                 type: object
 *                 properties:
 *                   user:
 *                      $ref: '#/components/schemas/GetUser'
 *                   tokens:
 *                      $ref: '#/components/schemas/Tokens'
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

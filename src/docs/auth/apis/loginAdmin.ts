/**
 * @swagger
 * /auth/login/admin:
 *   post:
 *     summary: login Admin to dashboard
 *     requestBody:
 *        required: true
 *        content:
 *            application/json:
 *                schema:
 *                   $ref: '#/components/schemas/LoginAdmin'
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Login Success
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

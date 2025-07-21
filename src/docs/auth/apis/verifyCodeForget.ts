/**
 * @swagger
 * /auth/password/verify:
 *   post:
 *     summary: verify phone number and code forget password
 *     requestBody:
 *        required: true
 *        content:
 *            application/json:
 *                schema:
 *                   $ref: '#/components/schemas/VerifyCodeForget'
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Verification Success
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

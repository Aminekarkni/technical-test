/**
 * @swagger
 * /users/me:
 *    delete:
 *      summary: Delete me
 *      tags: [User]
 *      security:
 *        - bearerAuth: []
 *      responses:
 *        200:
 *          description: OK
 *        400:
 *          description: 	Validation Failed
 *        401:
 *          description: Error Token
 *        403:
 *          description: Access Denied / Unauthorized
 *        500:
 *          description: Internal server error
 */

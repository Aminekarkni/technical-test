/**
 * @swagger
 * /notifications/seen:
 *    put:
 *      summary: mark all my notification as seen
 *      security:
 *        - bearerAuth: []
 *      tags: [Notification]
 *      responses:
 *        200:
 *          description: 	OK
 *        400:
 *          description: 	Validation Failed
 *        401:
 *          description: Error Token
 *        403:
 *          description: Access Denied / Unauthorized
 *        500:
 *          description: Internal server error
 */

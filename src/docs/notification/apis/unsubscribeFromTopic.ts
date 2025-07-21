/**
 * @swagger
 * /notifications/unsubscribe:
 *    post:
 *      tags: [Notification]
 *      summary: unsubscribe from topic
 *      security:
 *        - bearerAuth: []
 *      consumes:
 *        - application/json
 *        - multipart/form-data
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *              schema:
 *                $ref: '#components/schemas/subscribeOrUnsubscribe'
 *          multipart/form-data:
 *              schema:
 *                $ref: '#components/schemas/subscribeOrUnsubscribe'
 *      responses:
 *        200:
 *          description: 	success
 *        400:
 *          description: 	Validation Failed
 *        401:
 *          description: Error Token
 *        403:
 *          description: Access Denied / Unauthorized
 *        500:
 *          description: Internal server error
 */

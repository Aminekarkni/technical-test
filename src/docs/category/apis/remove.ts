/**
 * @swagger
 * /categories/{id}:
 *    delete:
 *      summary: Delete Category by id
 *      tags: [Category]
 *      parameters:
 *        - in: path
 *          name: id
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
 *      security:
 *        - bearerAuth: []
 */

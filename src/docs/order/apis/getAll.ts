/**
 * @swagger
 * /orders:
 *    get:
 *      summary: Get all the Orders
 *      tags: [Order]
 *      security:
 *        - bearerAuth: []
 *      responses:
 *        200:
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/GetOrder'
 *        400:
 *          description: 	Validation Failed
 *        401:
 *          description: Error Token
 *        403:
 *          description: Access Denied / Unauthorized
 *        500:
 *          description: Internal server error
 */

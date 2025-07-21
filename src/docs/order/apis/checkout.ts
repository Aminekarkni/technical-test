/**
 * @swagger
 * /orders/checkout:
 *    post:
 *      tags: [Order]
 *      summary: checkout order
 *      consumes:
 *        - application/json
 *        - multipart/form-data
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *              schema:
 *                $ref: '#components/schemas/Checkout'
 *          multipart/form-data:
 *              schema:
 *                $ref: '#components/schemas/Checkout'
 *      responses:
 *        200:
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/GetOrder'
 *        400:
 *          description: 	Validation Failed
 *        401:
 *          description: Error Token
 *        403:
 *          description: Access Denied / Unauthorized
 *        500:
 *          description: Internal server error
 */

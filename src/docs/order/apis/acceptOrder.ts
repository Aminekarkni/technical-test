/**
 * @swagger
 * /orders/accept/{id}:
 *    post:
 *      summary: accept order by admin to reduce quantity from stores
 *      consumes:
 *        - application/json
 *        - multipart/form-data
 *      tags: [Order]
 *      parameters:
 *        - in: path
 *          name: id
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *              schema:
 *                $ref: '#components/schemas/AcceptOrder'
 *          multipart/form-data:
 *              schema:
 *                $ref: '#components/schemas/AcceptOrder'
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
 *
 */

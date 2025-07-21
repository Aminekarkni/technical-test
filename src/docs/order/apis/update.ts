/**
 * @swagger
 * /orders/{id}:
 *    put:
 *      summary: Update Order by id
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
 *                $ref: '#components/schemas/UpdateOrder'
 *          multipart/form-data:
 *              schema:
 *                $ref: '#components/schemas/UpdateOrder'
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

/**
 * @swagger
 * /products/position:
 *    put:
 *      summary: Update Products positions
 *      security:
 *        - bearerAuth: []
 *      consumes:
 *        - application/json
 *        - multipart/form-data
 *      tags: [Product]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *              schema:
 *                $ref: '#components/schemas/UpdatePositions'
 *          multipart/form-data:
 *              schema:
 *                $ref: '#components/schemas/UpdatePositions'
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
 *
 */

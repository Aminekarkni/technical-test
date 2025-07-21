/**
 * @swagger
 * /categories/{id}:
 *    put:
 *      summary: Update Category by id
 *      security:
 *        - bearerAuth: []
 *      consumes:
 *        - application/json
 *        - multipart/form-data
 *      tags: [Category]
 *      parameters:
 *        - in: path
 *          name: id
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *              schema:
 *                $ref: '#components/schemas/UpdateCategory'
 *          multipart/form-data:
 *              schema:
 *                $ref: '#components/schemas/UpdateCategory'
 *      responses:
 *        200:
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/GetCategory'
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

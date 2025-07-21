/**
 * @swagger
 * /categories:
 *    post:
 *      tags: [Category]
 *      summary: Create a new Category
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
 *                $ref: '#components/schemas/CreateCategory'
 *          multipart/form-data:
 *              schema:
 *                $ref: '#components/schemas/CreateCategory'
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
 */

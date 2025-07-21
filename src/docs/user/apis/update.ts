/**
 * @swagger
 * /users/{id}:
 *    put:
 *      summary: Update user by id
 *      tags: [User]
 *      security:
 *        - bearerAuth: []
 *      consumes:
 *        - application/json
 *        - multipart/form-data
 *      parameters:
 *        - in: path
 *          name: id
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *              schema:
 *                $ref: '#components/schemas/UpdateUser'
 *          multipart/form-data:
 *              schema:
 *                $ref: '#components/schemas/UpdateUser'
 *      responses:
 *        200:
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/GetUser'
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

/**
 * @swagger
 * /categories/{id}:
 *    get:
 *      summary: Get one Category by id
 *      parameters:
 *        - in: path
 *          name: id
 *      tags: [Category]
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

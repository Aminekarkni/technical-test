/**
 * @swagger
 * /products/{id}:
 *    get:
 *      summary: Get one Product by id
 *      parameters:
 *        - in: path
 *          name: id
 *      tags: [Product]
 *      responses:
 *        200:
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/GetProduct'
 *        400:
 *          description: 	Validation Failed
 *        401:
 *          description: Error Token
 *        403:
 *          description: Access Denied / Unauthorized
 *        500:
 *          description: Internal server error
 */

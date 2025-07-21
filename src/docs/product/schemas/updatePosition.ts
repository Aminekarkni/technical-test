/**
 * @swagger
 * components:
 *   schemas:
 *     UpdatePositions:
 *       type: object
 *       required:
 *         - updates
 *       properties:
 *         updates:
 *           type: array
 *           description: Array of position updates for products
 *           items:
 *             type: object
 *             required:
 *               - id
 *               - position
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               position:
 *                 type: integer
 */

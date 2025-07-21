/**
 * @swagger
 * components:
 *   schemas:
 *     AcceptOrder:
 *       type: object
 *       required:
 *         - items
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - productId
 *               - storeId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               storeId:
 *                 type: string
 *               quantity:
 *                 type: integer
 */

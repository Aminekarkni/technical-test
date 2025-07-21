/**
 * @swagger
 * components:
 *   schemas:
 *     GetOrder:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *         deliveryType:
 *           type: string
 *         orderType:
 *           type: string
 *         addressId:
 *           type: string
 *           format: uuid
 *         orderPrice:
 *           type: number
 *         newId:
 *           type: number
 *         status:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *               supplements:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 */

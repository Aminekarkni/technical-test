/**
 * @swagger
 * components:
 *   schemas:
 *     CheckoutAdmin:
 *       type: object
 *       required:
 *         - deliveryType
 *         - orderType
 *         - cart
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *         browserId:
 *           type: string
 *         deliveryType:
 *           type: string
 *           enum:
 *             - DELIVERY
 *             - PICKUP
 *         orderType:
 *           type: string
 *           enum:
 *             - GIFT
 *             - NORMAL
 *             - RESERVATION
 *         code:
 *           type: string
 *         addressId:
 *           type: string
 *           format: uuid
 *         reservationDate:
 *           type: string
 *           format: date-time
 *         cart:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: object
 *                 required:
 *                   - _id
 *                   - nameAng
 *                   - nameAr
 *                   - descriptionAng
 *                   - descriptionAr
 *                   - price
 *                   - images
 *                 properties:
 *                   _id:
 *                     type: string
 *                     format: uuid
 *                   nameAng:
 *                     type: string
 *                   nameAr:
 *                     type: string
 *                   descriptionAng:
 *                     type: string
 *                   descriptionAr:
 *                     type: string
 *                   price:
 *                     type: number
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *               supplements:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       format: uuid
 *                     nameAng:
 *                       type: string
 *                     nameAr:
 *                       type: string
 *                     price:
 *                       type: number
 *               quantity:
 *                 type: number
 */

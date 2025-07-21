/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateOrder:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum:
 *             - PENDING
 *             - SHIPPED
 *             - DELIVERED
 *         paymentStatus:
 *           type: string
 *           enum:
 *             - UNPAID
 *             - PAID
 *             - REFUNDED
 */

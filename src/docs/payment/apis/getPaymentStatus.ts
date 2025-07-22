/**
 * @swagger
 * /payments/status/{invoiceId}:
 *   get:
 *     summary: Get payment status
 *     description: Get the status of a payment by invoice ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID from payment gateway
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [pending, paid, failed, cancelled]
 *                         invoiceId:
 *                           type: string
 *                         amount:
 *                           type: number
 *                           format: float
 *                         orderId:
 *                           type: integer
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */ 
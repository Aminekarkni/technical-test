/**
 * @swagger
 * /payments/callback:
 *   post:
 *     summary: Payment callback
 *     description: Webhook endpoint for payment gateway callbacks
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoiceId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [paid, failed, cancelled]
 *               amount:
 *                 type: number
 *                 format: float
 *               transactionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Callback processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *       400:
 *         description: Invalid callback data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */ 
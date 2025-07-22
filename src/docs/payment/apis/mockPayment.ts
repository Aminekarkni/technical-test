/**
 * @swagger
 * /payments/mock-payment:
 *   get:
 *     summary: Mock payment
 *     description: Simulate a successful payment for testing purposes
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID to mark as paid
 *     responses:
 *       200:
 *         description: Mock payment successful
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: "<!DOCTYPE html><html><body><h1>Payment Successful!</h1></body></html>"
 *       400:
 *         description: Bad request - invalid order ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */ 
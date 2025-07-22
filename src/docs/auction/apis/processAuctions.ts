/**
 * @swagger
 * /auctions/process:
 *   post:
 *     summary: Process ended auctions
 *     description: Manually trigger processing of ended auctions to determine winners
 *     tags: [Auctions]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Auctions processed successfully
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
 *                         processedAuctions:
 *                           type: integer
 *                           description: Number of auctions processed
 *                         createdOrders:
 *                           type: integer
 *                           description: Number of orders created for winners
 *                         failedAuctions:
 *                           type: integer
 *                           description: Number of auctions that failed to process
 *       401:
 *         description: Unauthorized - invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */ 
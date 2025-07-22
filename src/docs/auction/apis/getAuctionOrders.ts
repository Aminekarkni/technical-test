/**
 * @swagger
 * /auctions/{auctionId}/orders:
 *   get:
 *     summary: Get auction orders
 *     description: Get orders created for a specific auction
 *     tags: [Auctions]
 *     parameters:
 *       - in: path
 *         name: auctionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Auction product ID
 *     responses:
 *       200:
 *         description: Auction orders retrieved successfully
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
 *                         orders:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Order'
 *                         totalOrders:
 *                           type: integer
 *       404:
 *         description: Auction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */ 
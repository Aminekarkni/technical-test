/**
 * @swagger
 * /auctions/{auctionId}/status:
 *   get:
 *     summary: Get auction status
 *     description: Get detailed status of an auction including bids and winner
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
 *         description: Auction status retrieved successfully
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
 *                         auctionId:
 *                           type: integer
 *                         status:
 *                           type: string
 *                           enum: [active, ended, processing, completed]
 *                         currentHighestBid:
 *                           type: number
 *                           format: float
 *                         totalBids:
 *                           type: integer
 *                         auctionEndTime:
 *                           type: string
 *                           format: date-time
 *                         winner:
 *                           $ref: '#/components/schemas/User'
 *                         winningBid:
 *                           $ref: '#/components/schemas/Bid'
 *       404:
 *         description: Auction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */ 
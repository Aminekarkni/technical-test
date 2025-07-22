/**
 * @swagger
 * /bidding/product/{id}:
 *   get:
 *     summary: Get product bids
 *     description: Get all bids for a specific auction product
 *     tags: [Bidding]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product bids retrieved successfully
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
 *                         bids:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Bid'
 *                         totalBids:
 *                           type: integer
 *                         currentHighestBid:
 *                           type: number
 *                           format: float
 *       404:
 *         description: Product not found or not an auction
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */ 
/**
 * @swagger
 * /bidding/my-bids:
 *   get:
 *     summary: Get user bids
 *     description: Get all bids placed by the authenticated user
 *     tags: [Bidding]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User bids retrieved successfully
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
 *       401:
 *         description: Unauthorized - invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */ 
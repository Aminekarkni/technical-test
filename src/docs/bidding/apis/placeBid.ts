/**
 * @swagger
 * /bidding/bid:
 *   post:
 *     summary: Place a bid
 *     description: Place a bid on an auction product
 *     tags: [Bidding]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - bidAmount
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: ID of the auction product
 *                 example: 1
 *               bidAmount:
 *                 type: number
 *                 format: float
 *                 description: Bid amount (must be higher than current highest bid)
 *                 example: 750.00
 *               note:
 *                 type: string
 *                 description: Optional note with the bid
 *                 example: "I really want this item!"
 *     responses:
 *       200:
 *         description: Bid placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Bid'
 *       400:
 *         description: Bad request - validation failed or invalid bid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found or not an auction
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Bid amount too low or auction ended
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */ 
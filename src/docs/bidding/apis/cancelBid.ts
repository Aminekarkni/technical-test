/**
 * @swagger
 * /bidding/cancel/{bidId}:
 *   delete:
 *     summary: Cancel bid
 *     description: Cancel a bid (only if it's not the winning bid)
 *     tags: [Bidding]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bidId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Bid ID
 *     responses:
 *       200:
 *         description: Bid cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Cannot cancel winning bid
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
 *         description: Bid not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */ 
/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product (fixed-price or auction)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - type
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "iPhone 15 Pro"
 *               description:
 *                 type: string
 *                 example: "Latest iPhone with advanced features"
 *               type:
 *                 type: string
 *                 enum: [fixed_price, auction]
 *                 example: "auction"
 *               price:
 *                 type: number
 *                 format: float
 *                 description: Price for fixed-price products
 *                 example: 999.99
 *               startingPrice:
 *                 type: number
 *                 format: float
 *                 description: Starting price for auction products
 *                 example: 500.00
 *               auctionEndTime:
 *                 type: string
 *                 format: date-time
 *                 description: End time for auction products
 *                 example: "2025-07-25T10:00:00Z"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["image1.jpg", "image2.jpg"]
 *               coverImage:
 *                 type: string
 *                 example: "cover.jpg"
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request - validation failed
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
 *       500:
 *         description: Internal server error
 */

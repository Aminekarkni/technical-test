/**
 * @swagger
 * components:
 *   schemas:
 *     GetProduct:
 *       type: object
 *       properties:
 *         nameAng:
 *           type: string
 *         nameAr:
 *           type: string
 *         descriptionAng:
 *           type: string
 *         descriptionAr:
 *           type: string
 *         isRecommended:
 *           type: boolean
 *         isTopSeller:
 *           type: boolean
 *         price:
 *           type: number
 *         images:
 *           type: array
 *           items :
 *             type: string
 *         coverImage:
 *           type: string
 *         position:
 *           type: integer
 *         minSupp:
 *           type: integer
 *         maxSupp:
 *           type: integer
 *         category:
 *           type: string
 *           format: uuid
 *         stores:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               store:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: number
 *         supplements:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               supplement:
 *                 type: string
 *                 format: uuid
 *               price:
 *                 type: number
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateProduct:
 *       type: object
 *       required:
 *         - nameAng
 *         - nameAr
 *         - descriptionAng
 *         - descriptionAr
 *         - price
 *         - category
 *         - isRecommended
 *         - isTopSeller
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
 *         position:
 *           type: integer
 *         minSupp:
 *           type: integer
 *         maxSupp:
 *           type: integer
 *         images:
 *           type: array
 *           items :
 *             type: string
 *             format: binary
 *         coverImage:
 *           type: string
 *           format: binary
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
 */

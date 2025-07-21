/**
 * @swagger
 * components:
 *   schemas:
 *     CreateRole:
 *       type: object
 *       required:
 *         - name
 *         - Permissions
 *       properties:
 *         name:
 *           type: string
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 */

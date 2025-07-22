/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check the health status of the API and database
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-07-21T10:00:00Z"
 *                 database:
 *                   type: string
 *                   example: "connected"
 *                 uptime:
 *                   type: number
 *                   format: float
 *                   example: 3600.5
 *       503:
 *         description: System is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "unhealthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-07-21T10:00:00Z"
 *                 database:
 *                   type: string
 *                   example: "disconnected"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */ 
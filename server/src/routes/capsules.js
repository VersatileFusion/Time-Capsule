const express = require('express');
const {
  createCapsule,
  getCapsules,
  getCapsule,
  updateCapsule,
  deleteCapsule,
  getPublicCapsules,
  deliverCapsules
} = require('../controllers/capsules');

const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const { validateCapsule } = require('../middleware/security');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Capsules
 *   description: Time capsule management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Capsule:
 *       type: object
 *       required:
 *         - recipient
 *         - title
 *         - message
 *         - deliveryDate
 *       properties:
 *         recipient:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *             name:
 *               type: string
 *         content:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [text, file, mixed]
 *             text:
 *               type: string
 *             files:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   filename:
 *                     type: string
 *                   originalName:
 *                     type: string
 *                   path:
 *                     type: string
 *                   mimetype:
 *                     type: string
 *         deliveryDate:
 *           type: string
 *           format: date-time
 *         isPublic:
 *           type: boolean
 *           default: false
 *         title:
 *           type: string
 *         message:
 *           type: string
 *       example:
 *         recipient:
 *           email: recipient@example.com
 *           name: John Doe
 *         content:
 *           type: text
 *           text: Hello from the past!
 *         deliveryDate: 2023-12-31T00:00:00Z
 *         isPublic: false
 *         title: My Time Capsule
 *         message: This is a message from the past!
 */

/**
 * @swagger
 * /api/capsules/public:
 *   get:
 *     summary: Get all public capsules that have been delivered
 *     tags: [Capsules]
 *     responses:
 *       200:
 *         description: List of public capsules
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Capsule'
 */
router.get('/public', getPublicCapsules);

/**
 * @swagger
 * /api/capsules:
 *   get:
 *     summary: Get all capsules for logged in user
 *     tags: [Capsules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's capsules
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Capsule'
 *       401:
 *         description: Not authorized
 */
router.get('/', protect, getCapsules);

/**
 * @swagger
 * /api/capsules:
 *   post:
 *     summary: Create a new time capsule
 *     tags: [Capsules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Capsule'
 *     responses:
 *       201:
 *         description: Capsule created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Capsule'
 *       401:
 *         description: Not authorized
 *       400:
 *         description: Validation error
 */
router.post('/', protect, validateCapsule, createCapsule);

/**
 * @swagger
 * /api/capsules/{id}:
 *   get:
 *     summary: Get a single capsule
 *     tags: [Capsules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Capsule ID
 *     responses:
 *       200:
 *         description: Capsule data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Capsule'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Capsule not found
 */
router.get('/:id', protect, getCapsule);

/**
 * @swagger
 * /api/capsules/{id}:
 *   put:
 *     summary: Update a capsule
 *     tags: [Capsules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Capsule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Capsule'
 *     responses:
 *       200:
 *         description: Capsule updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Capsule'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Capsule not found
 */
router.put('/:id', protect, validateCapsule, updateCapsule);

/**
 * @swagger
 * /api/capsules/{id}:
 *   delete:
 *     summary: Delete a capsule
 *     tags: [Capsules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Capsule ID
 *     responses:
 *       200:
 *         description: Capsule deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Capsule not found
 */
router.delete('/:id', protect, deleteCapsule);

/**
 * @swagger
 * /api/capsules/deliver:
 *   get:
 *     summary: Deliver capsules that are due (admin only)
 *     tags: [Capsules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Delivery process completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       success:
 *                         type: boolean
 *                       error:
 *                         type: string
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - admin only
 */
router.get('/deliver', protect, isAdmin, deliverCapsules);

module.exports = router; 
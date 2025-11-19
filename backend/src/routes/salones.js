import express from 'express';
import { getAllSalones, getSalonById, createSalon } from '../controllers/salonController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getAllSalones);
router.get('/:id', authenticateToken, getSalonById);
router.post('/', authenticateToken, createSalon);

export default router;


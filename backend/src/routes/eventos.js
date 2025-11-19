import express from 'express';
import {
  createEvent,
  getEventsBySalonAndMonth,
  getMyEventsByMonth,
  getMonthlySummary,
  deleteEvent
} from '../controllers/eventController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Crear evento (solo DJs autenticados)
router.post('/', authenticateToken, createEvent);

// Obtener eventos de un salón por mes
router.get('/salon/:salon_id', authenticateToken, getEventsBySalonAndMonth);

// Obtener mis eventos por mes
router.get('/mis-eventos', authenticateToken, getMyEventsByMonth);

// Obtener resumen mensual
router.get('/resumen-mensual', authenticateToken, getMonthlySummary);

// Eliminar evento
router.delete('/:id', authenticateToken, deleteEvent);

export default router;


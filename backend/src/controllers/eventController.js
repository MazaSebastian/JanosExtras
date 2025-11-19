import { Event } from '../models/Event.js';
import { Salon } from '../models/Salon.js';

export const createEvent = async (req, res) => {
  try {
    const { salon_id, fecha_evento } = req.body;
    const dj_id = req.user.id;

    if (!salon_id || !fecha_evento) {
      return res.status(400).json({ error: 'Salón y fecha son requeridos' });
    }

    // Verificar que el salón existe
    const salon = await Salon.findById(salon_id);
    if (!salon) {
      return res.status(404).json({ error: 'Salón no encontrado' });
    }

    // Validar formato de fecha
    const fecha = new Date(fecha_evento);
    if (isNaN(fecha.getTime())) {
      return res.status(400).json({ error: 'Fecha inválida' });
    }

    const event = await Event.create({ dj_id, salon_id, fecha_evento: fecha });
    res.status(201).json(event);
  } catch (error) {
    if (error.message === 'Ya existe un evento registrado para esta fecha y salón') {
      return res.status(409).json({ error: error.message });
    }
    console.error('Error al crear evento:', error);
    res.status(500).json({ error: 'Error al crear evento' });
  }
};

export const getEventsBySalonAndMonth = async (req, res) => {
  try {
    const { salon_id } = req.params;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'Año y mes son requeridos' });
    }

    const events = await Event.findBySalonAndMonth(
      parseInt(salon_id),
      parseInt(year),
      parseInt(month)
    );

    res.json(events);
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
};

export const getMyEventsByMonth = async (req, res) => {
  try {
    const dj_id = req.user.id;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'Año y mes son requeridos' });
    }

    const events = await Event.findByDJAndMonth(
      dj_id,
      parseInt(year),
      parseInt(month)
    );

    res.json(events);
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
};

export const getMonthlySummary = async (req, res) => {
  try {
    const dj_id = req.user.id;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'Año y mes son requeridos' });
    }

    const summary = await Event.getMonthlySummary(
      dj_id,
      parseInt(year),
      parseInt(month)
    );

    res.json(summary);
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const dj_id = req.user.id;

    const deletedEvent = await Event.delete(parseInt(id), dj_id);
    
    if (!deletedEvent) {
      return res.status(404).json({ error: 'Evento no encontrado o no tienes permisos' });
    }

    res.json({ message: 'Evento eliminado exitosamente', event: deletedEvent });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
};


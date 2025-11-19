import { Salon } from '../models/Salon.js';

export const getAllSalones = async (req, res) => {
  try {
    const salones = await Salon.findAll();
    res.json(salones);
  } catch (error) {
    console.error('Error al obtener salones:', error);
    res.status(500).json({ error: 'Error al obtener salones' });
  }
};

export const getSalonById = async (req, res) => {
  try {
    const { id } = req.params;
    const salon = await Salon.findById(id);
    
    if (!salon) {
      return res.status(404).json({ error: 'Salón no encontrado' });
    }

    res.json(salon);
  } catch (error) {
    console.error('Error al obtener salón:', error);
    res.status(500).json({ error: 'Error al obtener salón' });
  }
};

export const createSalon = async (req, res) => {
  try {
    const { nombre, direccion } = req.body;

    if (!nombre || !direccion) {
      return res.status(400).json({ error: 'Nombre y dirección son requeridos' });
    }

    const salon = await Salon.create({ nombre, direccion });
    res.status(201).json(salon);
  } catch (error) {
    console.error('Error al crear salón:', error);
    res.status(500).json({ error: 'Error al crear salón' });
  }
};


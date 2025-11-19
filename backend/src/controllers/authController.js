import jwt from 'jsonwebtoken';
import { DJ } from '../models/DJ.js';
import { body, validationResult } from 'express-validator';

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, email, password } = req.body;

    // Verificar si el email ya existe
    const existingDJ = await DJ.findByEmail(email);
    if (existingDJ) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Crear nuevo DJ
    const newDJ = await DJ.create({ nombre, email, password });

    res.status(201).json({
      message: 'DJ registrado exitosamente',
      dj: {
        id: newDJ.id,
        nombre: newDJ.nombre,
        email: newDJ.email
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar DJ' });
  }
};

export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Buscar DJ por email
    const dj = await DJ.findByEmail(email);
    if (!dj) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValidPassword = await DJ.comparePassword(password, dj.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: dj.id, email: dj.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      dj: {
        id: dj.id,
        nombre: dj.nombre,
        email: dj.email
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const dj = await DJ.findById(req.user.id);
    if (!dj) {
      return res.status(404).json({ error: 'DJ no encontrado' });
    }

    res.json(dj);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};


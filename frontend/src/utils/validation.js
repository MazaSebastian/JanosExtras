import { z } from 'zod';

export const registerSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(255, 'La contraseña es demasiado larga'),
  salon_id: z
    .number({
      invalid_type_error: 'Debes seleccionar un salón',
      required_error: 'Debes seleccionar un salón',
    })
    .int()
    .positive('Salón inválido'),
});

export const loginSchema = z.object({
  nombre: z.string().trim().min(2, 'Nombre inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const createEventSchema = z.object({
  salon_id: z
    .number({
      invalid_type_error: 'Salón inválido',
      required_error: 'Salón requerido',
    })
    .int()
    .positive(),
  fecha_evento: z
    .string({
      invalid_type_error: 'Fecha inválida',
      required_error: 'Fecha requerida',
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD'),
});

export const updateDjSchema = z.object({
  nombre: z.string().trim().min(2).max(100).optional(),
  salon_id: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),
  color_hex: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, 'Color inválido')
    .optional(),
});


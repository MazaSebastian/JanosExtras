import { useState, useEffect } from 'react';
import { formatDateFromDB } from '@/utils/dateFormat';
import styles from '@/styles/AgendarVideollamadaModal.module.css';

/**
 * Modal para agendar una videollamada en Google Calendar desde una coordinación
 */
export default function AgendarVideollamadaModal({ 
  coordinacion, 
  isOpen, 
  onClose, 
  onSuccess 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fecha: '',
    hora: '',
    duracion: 60,
    descripcion: ''
  });

  useEffect(() => {
    if (isOpen && coordinacion) {
      // Pre-llenar fecha con la fecha del evento si está disponible
      let fechaEvento = '';
      if (coordinacion.fecha_evento) {
        // Si viene como string YYYY-MM-DD, usarlo directamente
        if (typeof coordinacion.fecha_evento === 'string' && coordinacion.fecha_evento.match(/^\d{4}-\d{2}-\d{2}/)) {
          fechaEvento = coordinacion.fecha_evento.split('T')[0].split(' ')[0];
        } else {
          // Si viene en otro formato, convertir
          fechaEvento = formatDateFromDB(coordinacion.fecha_evento).split('/').reverse().join('-'); // DD/MM/YYYY -> YYYY-MM-DD
        }
      }
      
      setFormData({
        fecha: fechaEvento,
        hora: '15:00', // Hora por defecto
        duracion: coordinacion.videollamada_duracion || 60,
        descripcion: coordinacion.videollamada_agendada 
          ? coordinacion.descripcion || ''
          : `Coordinación para ${coordinacion.tipo_evento || 'evento'} de ${coordinacion.nombre_cliente || 'cliente'}`
      });
      setError('');
    }
  }, [isOpen, coordinacion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fecha || !formData.hora) {
      setError('Por favor, completa la fecha y hora');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/google-calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinacion_id: coordinacion.id,
          fecha: formData.fecha,
          hora: formData.hora,
          duracion: formData.duracion,
          descripcion: formData.descripcion
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al agendar videollamada');
      }

      if (onSuccess) {
        onSuccess(data.event);
      }

      onClose();
    } catch (err) {
      console.error('Error al agendar videollamada:', err);
      setError(err.message || 'Error al agendar videollamada. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Agendar Videollamada</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Fecha *
            </label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Hora *
            </label>
            <input
              type="time"
              value={formData.hora}
              onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Duración (minutos)
            </label>
            <select
              value={formData.duracion}
              onChange={(e) => setFormData({ ...formData, duracion: parseInt(e.target.value, 10) })}
              className={styles.input}
            >
              <option value={30}>30 minutos</option>
              <option value={60}>1 hora</option>
              <option value={90}>1.5 horas</option>
              <option value={120}>2 horas</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Descripción (opcional)
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className={styles.textarea}
              rows={4}
              placeholder="Detalles adicionales de la videollamada..."
            />
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Agendando...' : 'Agendar Videollamada'}
            </button>
          </div>
        </form>

        {coordinacion.videollamada_agendada && coordinacion.videollamada_meet_link && (
          <div className={styles.existingMeeting}>
            <p className={styles.existingMeetingText}>
              Ya hay una videollamada agendada. Al crear una nueva, se actualizará el evento existente.
            </p>
            <a
              href={coordinacion.videollamada_meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.meetLink}
            >
              Ver videollamada existente →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}


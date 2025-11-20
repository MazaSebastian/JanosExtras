import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { eventosAPI } from '@/services/api';
import styles from '@/styles/EventMarker.module.css';

export default function EventMarker({ date, salonId, onEventCreated, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMarkEvent = async () => {
    if (!salonId) {
      setError('Debes seleccionar un salón primero');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const fecha_evento = format(date, 'yyyy-MM-dd');
      await eventosAPI.create({
        salon_id: salonId,
        fecha_evento,
      });

      if (onEventCreated) {
        onEventCreated();
      }
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al marcar el evento';
      setError(errorMessage);
      
      // Si la fecha ya está ocupada, cerrar el modal después de mostrar el error
      if (errorMessage.includes('ocupada') || errorMessage.includes('Ya existe')) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Marcar Evento</h3>
        
        <div className={styles.dateInfo}>
          <strong>Fecha:</strong>{' '}
          {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button
            onClick={handleMarkEvent}
            className={styles.confirmButton}
            disabled={loading}
          >
            {loading ? 'Marcando...' : 'Confirmar Evento'}
          </button>
          <button
            onClick={onClose}
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}


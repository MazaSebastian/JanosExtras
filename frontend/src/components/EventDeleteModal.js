import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { eventosAPI } from '@/services/api';
import { LoadingButton } from '@/components/Loading';
import styles from '@/styles/EventMarker.module.css';

export default function EventDeleteModal({ event, onEventDeleted, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!event) return null;

  const formattedDate = format(
    new Date(event.fecha_evento),
    "EEEE, d 'de' MMMM 'de' yyyy",
    { locale: es }
  );

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError('');
      await eventosAPI.delete(event.id);
      if (typeof onEventDeleted === 'function') {
        onEventDeleted();
      }
      onClose();
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || 'No se pudo eliminar el evento';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Eliminar evento</h3>

        <div className={styles.dateInfo}>
          <strong>Fecha:</strong> {formattedDate}
        </div>

        <p style={{ marginTop: '0.75rem' }}>
          ¿Confirmás que deseas liberar esta fecha?
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <LoadingButton
            onClick={handleDelete}
            className={styles.confirmButton}
            loading={loading}
          >
            Eliminar fecha
          </LoadingButton>
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


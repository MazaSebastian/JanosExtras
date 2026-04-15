import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { eventosAPI, coordinacionesAPI } from '@/services/api';
import CustomSelect from '@/components/CustomSelect';
import { LoadingButton } from '@/components/Loading';
import styles from '@/styles/EventMarker.module.css';

export default function EventMarker({ date, salonId, djId, onEventCreated, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nombre_cliente: '',
    apellido_cliente: '',
    nombre_agasajado: '',
    telefono: '',
    tipo_evento: '',
    codigo_evento: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!salonId) {
      setError('Debes seleccionar un salón primero');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 1. Crear el Evento (Fase 1: Bloquear Fecha)
      const eventPayload = {
        salon_id: parseInt(salonId, 10),
        fecha_evento: format(date, 'yyyy-MM-dd'),
      };

      if (djId) {
        eventPayload.dj_id = djId;
      }

      await eventosAPI.create(eventPayload);

      // 2. Automáticamente orquestar la Coordinación (Fase 2)
      const nombreCompleto = `${formData.nombre_cliente} ${formData.apellido_cliente}`.trim();
      const coordPayload = {
        titulo: `${formData.tipo_evento} - ${nombreCompleto}`,
        nombre_cliente: formData.nombre_cliente,
        apellido_cliente: formData.apellido_cliente,
        nombre_agasajado: formData.tipo_evento !== 'Corporativo' ? formData.nombre_agasajado : null,
        telefono: formData.telefono,
        fecha_evento: format(date, 'yyyy-MM-dd'),
        tipo_evento: formData.tipo_evento,
        codigo_evento: formData.codigo_evento,
        salon_id: parseInt(salonId, 10),
        dj_responsable_id: djId || undefined,
        estado: 'pendiente',
        prioridad: 'normal',
      };

      try {
        await coordinacionesAPI.create(coordPayload);
      } catch (coordErr) {
        console.warn("Evento creado, pero falló la coordinación secundaria: ", coordErr);
        // Si falla la coordinación, no bloqueamos la UI ya que el evento esencial fue marcado.
      }

      if (onEventCreated) {
        onEventCreated();
      }
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al marcar el evento';
      setError(errorMessage);

      if (
        errorMessage.toLowerCase().includes('ocupada') ||
        errorMessage.toLowerCase().includes('ya existe') ||
        errorMessage.toLowerCase().includes('3 djs') ||
        errorMessage.toLowerCase().includes('registrado')
      ) {
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Nueva Coordinación</h3>

        <div className={styles.dateInfo}>
          <strong>Fecha:</strong>{' '}
          {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Nombre *</label>
            <input
              type="text"
              value={formData.nombre_cliente}
              onChange={(e) => setFormData({ ...formData, nombre_cliente: e.target.value })}
              required
              placeholder="Nombre del cliente"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Apellido *</label>
            <input
              type="text"
              value={formData.apellido_cliente}
              onChange={(e) => setFormData({ ...formData, apellido_cliente: e.target.value })}
              required
              placeholder="Apellido del cliente"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Teléfono</label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="Ingrese el teléfono del cliente"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Tipo de Evento *</label>
            <CustomSelect
              value={formData.tipo_evento}
              options={['XV', 'Casamiento', 'Corporativo', 'Religioso', 'Cumpleaños']}
              onChange={(val) => setFormData({ ...formData, tipo_evento: val })}
              required
              placeholder="Seleccionar tipo de evento"
            />
          </div>

          {formData.tipo_evento !== 'Corporativo' && (
            <div className={styles.formGroup}>
              <label>Nombre del Agasajado</label>
              <input
                type="text"
                value={formData.nombre_agasajado}
                onChange={(e) => setFormData({ ...formData, nombre_agasajado: e.target.value })}
                placeholder="Nombre de/los protagonista/s (ej: María, Juan y Ana)"
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Código de Evento</label>
            <input
              type="text"
              value={formData.codigo_evento}
              onChange={(e) => setFormData({ ...formData, codigo_evento: e.target.value })}
              placeholder="Ingrese el código del evento (Opcional)"
            />
          </div>

          <div className={styles.actions}>
            <LoadingButton
              type="submit"
              className={styles.confirmButton}
              loading={loading}
            >
              Confirmar Evento
            </LoadingButton>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


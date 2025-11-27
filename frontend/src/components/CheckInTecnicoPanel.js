import { useState, useEffect, useMemo } from 'react';
import { checkInTecnicoAPI, salonesAPI } from '@/services/api';
import { EQUIPOS_DEFAULT, ESTADOS, getEstadoColor, getEstadoLabel, calcularEstadoGeneral } from '@/utils/checkInTecnico.js';
import { LoadingButton, SkeletonCard } from '@/components/Loading';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from '@/styles/CheckInTecnicoPanel.module.css';

export default function CheckInTecnicoPanel() {
  const [salones, setSalones] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSalones, setLoadingSalones] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    salon_id: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    equipos: EQUIPOS_DEFAULT.map(nombre => ({ nombre, estado: ESTADOS.OK, observaciones: '' })),
    observaciones: '',
  });

  // Cargar salones al montar
  useEffect(() => {
    loadSalones();
    loadCheckIns();
  }, []);

  const loadSalones = async () => {
    try {
      setLoadingSalones(true);
      const response = await salonesAPI.getAll();
      setSalones(response.data || []);
    } catch (err) {
      console.error('Error al cargar salones:', err);
      setError('Error al cargar salones');
    } finally {
      setLoadingSalones(false);
    }
  };


  const loadCheckIns = async () => {
    try {
      setLoading(true);
      const response = await checkInTecnicoAPI.getAll();
      const data = response?.data?.data || response?.data || [];
      setCheckIns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar check-ins:', err);
      setError('Error al cargar check-ins');
    } finally {
      setLoading(false);
    }
  };


  const handleEquipoChange = (index, field, value) => {
    const nuevosEquipos = [...formData.equipos];
    nuevosEquipos[index] = {
      ...nuevosEquipos[index],
      [field]: value,
    };
    
    setFormData({
      ...formData,
      equipos: nuevosEquipos,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.salon_id) {
      setError('Debes seleccionar un salón');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const estadoGeneral = calcularEstadoGeneral(formData.equipos);

      const checkInData = {
        salon_id: parseInt(formData.salon_id),
        fecha: formData.fecha,
        equipos: formData.equipos,
        observaciones: formData.observaciones || null,
        estado_general: estadoGeneral,
      };

      await checkInTecnicoAPI.create(checkInData);
      
      setShowForm(false);
      setFormData({
        salon_id: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        equipos: EQUIPOS_DEFAULT.map(nombre => ({ nombre, estado: ESTADOS.OK, observaciones: '' })),
        observaciones: '',
      });
      loadCheckIns();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el check-in técnico');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      salon_id: '',
      evento_id: '',
      equipos: EQUIPOS_DEFAULT.map(nombre => ({ nombre, estado: ESTADOS.OK, observaciones: '' })),
      observaciones: '',
    });
    setShowForm(false);
    setError('');
  };


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Check-In Técnico</h1>
        <p className={styles.subtitle}>
          Completa el check-in técnico después de finalizar tu evento para verificar el estado de los equipos
        </p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <button
          className={styles.addButton}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '❌ Cancelar' : '➕ Nuevo Check-In'}
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Salón <span className={styles.required}>*</span>
            </label>
            <select
              className={styles.select}
              value={formData.salon_id}
              onChange={(e) => setFormData({ ...formData, salon_id: e.target.value })}
              required
              disabled={loadingSalones}
            >
              <option value="">-- Selecciona un salón --</option>
              {salones.map((salon) => (
                <option key={salon.id} value={salon.id}>
                  {salon.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Fecha <span className={styles.required}>*</span>
            </label>
            <input
              type="date"
              className={styles.select}
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              required
            />
          </div>

          <div className={styles.equiposSection}>
            <h3 className={styles.sectionTitle}>Estado de Equipos</h3>
            <div className={styles.equiposList}>
              {formData.equipos.map((equipo, index) => (
                <div key={index} className={styles.equipoItem}>
                  <div className={styles.equipoHeader}>
                    <span className={styles.equipoNombre}>{equipo.nombre}</span>
                  </div>
                  <div className={styles.estadoButtons}>
                    {Object.values(ESTADOS).map((estado) => (
                      <button
                        key={estado}
                        type="button"
                        className={`${styles.estadoButton} ${
                          equipo.estado === estado ? styles.estadoButtonActive : ''
                        }`}
                        style={{
                          backgroundColor: equipo.estado === estado ? getEstadoColor(estado) : 'transparent',
                          color: equipo.estado === estado ? '#fff' : '#333',
                          borderColor: getEstadoColor(estado),
                        }}
                        onClick={() => handleEquipoChange(index, 'estado', estado)}
                      >
                        {getEstadoLabel(estado)}
                      </button>
                    ))}
                  </div>
                  {(equipo.estado === ESTADOS.OBSERVACION || equipo.estado === ESTADOS.REPARAR) && (
                    <div className={styles.equipoObservaciones}>
                      <label className={styles.observacionesLabel}>Observaciones:</label>
                      <textarea
                        className={styles.observacionesInput}
                        value={equipo.observaciones || ''}
                        onChange={(e) => handleEquipoChange(index, 'observaciones', e.target.value)}
                        placeholder="Describe el problema o la observación..."
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Observaciones Generales (Opcional)</label>
            <textarea
              className={styles.textarea}
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Observaciones adicionales sobre el estado general del salón..."
              rows={4}
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={resetForm}>
              Cancelar
            </button>
            <LoadingButton
              type="submit"
              className={styles.submitButton}
              loading={loading}
              disabled={loading}
            >
              Guardar Check-In
            </LoadingButton>
          </div>
        </form>
      )}

      <div className={styles.checkInsList}>
        <h2 className={styles.listTitle}>Check-Ins Recientes</h2>
        {loading && <SkeletonCard count={3} />}
        {!loading && checkIns.length === 0 && (
          <div className={styles.emptyState}>
            <p>No has realizado ningún check-in técnico aún.</p>
            <p>Completa el formulario arriba para crear tu primer check-in.</p>
          </div>
        )}
        {!loading && checkIns.length > 0 && (
          <div className={styles.checkInsGrid}>
            {checkIns.map((checkIn) => (
              <div key={checkIn.id} className={styles.checkInCard}>
                <div className={styles.checkInHeader}>
                  <div>
                    <h3 className={styles.checkInSalon}>{checkIn.salon_nombre}</h3>
                    <p className={styles.checkInDate}>
                      {format(new Date(checkIn.fecha_check_in), "dd/MM/yyyy HH:mm", { locale: es })}
                    </p>
                  </div>
                  <span
                    className={styles.estadoBadge}
                    style={{ backgroundColor: getEstadoColor(checkIn.estado_general) }}
                  >
                    {getEstadoLabel(checkIn.estado_general)}
                  </span>
                </div>
                {checkIn.observaciones && (
                  <div className={styles.checkInObservaciones}>
                    <strong>Observaciones:</strong> {checkIn.observaciones}
                  </div>
                )}
                <div className={styles.checkInEquipos}>
                  <strong>Equipos verificados:</strong> {checkIn.equipos?.length || 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


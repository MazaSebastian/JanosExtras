import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { checkInTecnicoAPI, salonesAPI } from '@/services/api';
import { ESTADOS } from '@/lib/models/CheckInTecnico.js';
import { SkeletonCard } from '@/components/Loading';
import styles from '@/styles/CheckInTecnicoAdminPanel.module.css';

export default function CheckInTecnicoAdminPanel() {
  const [checkIns, setCheckIns] = useState([]);
  const [salones, setSalones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    dj_id: '',
    salon_id: '',
    estado_general: '',
    fecha_desde: '',
    fecha_hasta: '',
  });
  const [selectedCheckIn, setSelectedCheckIn] = useState(null);

  useEffect(() => {
    loadSalones();
    loadCheckIns();
  }, []);

  useEffect(() => {
    loadCheckIns();
  }, [filters]);

  const loadSalones = async () => {
    try {
      const response = await salonesAPI.getAll();
      setSalones(response.data || []);
    } catch (err) {
      console.error('Error al cargar salones:', err);
    }
  };

  const loadCheckIns = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {};
      if (filters.dj_id) params.dj_id = filters.dj_id;
      if (filters.salon_id) params.salon_id = filters.salon_id;
      if (filters.estado_general) params.estado_general = filters.estado_general;
      if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde;
      if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta;
      
      const response = await checkInTecnicoAPI.getResumen(params);
      const data = response?.data?.data || response?.data || [];
      setCheckIns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar check-ins:', err);
      setError('Error al cargar check-ins técnicos');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case ESTADOS.OK:
        return '#4caf50'; // Verde
      case ESTADOS.OBSERVACION:
        return '#ff9800'; // Amarillo/Naranja
      case ESTADOS.REPARAR:
        return '#f44336'; // Rojo
      case ESTADOS.NO_APLICA:
        return '#9e9e9e'; // Gris
      default:
        return '#9e9e9e';
    }
  };

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case ESTADOS.OK:
        return 'OK';
      case ESTADOS.OBSERVACION:
        return 'Observación';
      case ESTADOS.REPARAR:
        return 'Reparar';
      case ESTADOS.NO_APLICA:
        return 'No Aplica';
      default:
        return estado;
    }
  };

  const handleViewDetails = async (checkInId) => {
    try {
      const response = await checkInTecnicoAPI.getById(checkInId);
      setSelectedCheckIn(response.data);
    } catch (err) {
      console.error('Error al cargar detalles del check-in:', err);
      setError('Error al cargar detalles del check-in');
    }
  };

  const resetFilters = () => {
    setFilters({
      dj_id: '',
      salon_id: '',
      estado_general: '',
      fecha_desde: '',
      fecha_hasta: '',
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Check-Ins Técnicos</h2>
        <p>Resumen general de todos los check-ins técnicos realizados por DJ y salón</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.filtersSection}>
        <h3>Filtros</h3>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label>Salón:</label>
            <select
              value={filters.salon_id}
              onChange={(e) => setFilters({ ...filters, salon_id: e.target.value })}
              className={styles.select}
            >
              <option value="">Todos los salones</option>
              {salones.map((salon) => (
                <option key={salon.id} value={salon.id}>
                  {salon.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Estado:</label>
            <select
              value={filters.estado_general}
              onChange={(e) => setFilters({ ...filters, estado_general: e.target.value })}
              className={styles.select}
            >
              <option value="">Todos los estados</option>
              <option value={ESTADOS.OK}>OK</option>
              <option value={ESTADOS.OBSERVACION}>Observación</option>
              <option value={ESTADOS.REPARAR}>Reparar</option>
              <option value={ESTADOS.NO_APLICA}>No Aplica</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Fecha desde:</label>
            <input
              type="date"
              value={filters.fecha_desde}
              onChange={(e) => setFilters({ ...filters, fecha_desde: e.target.value })}
              className={styles.input}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Fecha hasta:</label>
            <input
              type="date"
              value={filters.fecha_hasta}
              onChange={(e) => setFilters({ ...filters, fecha_hasta: e.target.value })}
              className={styles.input}
            />
          </div>

          <div className={styles.filterActions}>
            <button
              type="button"
              onClick={resetFilters}
              className={styles.resetButton}
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <SkeletonCard count={5} />
      ) : (
        <>
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Total Check-Ins</span>
              <span className={styles.summaryValue}>{checkIns.length}</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>OK</span>
              <span className={styles.summaryValue} style={{ color: '#4caf50' }}>
                {checkIns.filter(c => c.estado_general === ESTADOS.OK).length}
              </span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Observación</span>
              <span className={styles.summaryValue} style={{ color: '#ff9800' }}>
                {checkIns.filter(c => c.estado_general === ESTADOS.OBSERVACION).length}
              </span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Reparar</span>
              <span className={styles.summaryValue} style={{ color: '#f44336' }}>
                {checkIns.filter(c => c.estado_general === ESTADOS.REPARAR).length}
              </span>
            </div>
          </div>

          <div className={styles.checkInsTable}>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>DJ</th>
                  <th>Salón</th>
                  <th>Estado General</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {checkIns.length === 0 ? (
                  <tr>
                    <td colSpan="5" className={styles.emptyState}>
                      No se encontraron check-ins técnicos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  checkIns.map((checkIn) => (
                    <tr key={checkIn.id}>
                      <td>
                        {format(new Date(checkIn.fecha_check_in), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </td>
                      <td>{checkIn.dj_nombre}</td>
                      <td>{checkIn.salon_nombre}</td>
                      <td>
                        <span
                          className={styles.estadoBadge}
                          style={{ backgroundColor: getEstadoColor(checkIn.estado_general) }}
                        >
                          {getEstadoLabel(checkIn.estado_general)}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.viewButton}
                          onClick={() => handleViewDetails(checkIn.id)}
                        >
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedCheckIn && (
        <div className={styles.modal} onClick={() => setSelectedCheckIn(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Detalles del Check-In Técnico</h3>
              <button
                className={styles.closeButton}
                onClick={() => setSelectedCheckIn(null)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailRow}>
                <strong>DJ:</strong> {selectedCheckIn.dj_nombre}
              </div>
              <div className={styles.detailRow}>
                <strong>Salón:</strong> {selectedCheckIn.salon_nombre}
              </div>
              <div className={styles.detailRow}>
                <strong>Fecha:</strong>{' '}
                {format(new Date(selectedCheckIn.fecha_check_in), 'dd/MM/yyyy HH:mm', { locale: es })}
              </div>
              <div className={styles.detailRow}>
                <strong>Estado General:</strong>{' '}
                <span
                  className={styles.estadoBadge}
                  style={{ backgroundColor: getEstadoColor(selectedCheckIn.estado_general) }}
                >
                  {getEstadoLabel(selectedCheckIn.estado_general)}
                </span>
              </div>
              {selectedCheckIn.observaciones && (
                <div className={styles.detailRow}>
                  <strong>Observaciones Generales:</strong>
                  <p>{selectedCheckIn.observaciones}</p>
                </div>
              )}
              <div className={styles.equiposSection}>
                <strong>Equipos Verificados:</strong>
                <div className={styles.equiposList}>
                  {selectedCheckIn.equipos && Array.isArray(selectedCheckIn.equipos) ? (
                    selectedCheckIn.equipos.map((equipo, index) => (
                      <div key={index} className={styles.equipoItem}>
                        <div className={styles.equipoHeader}>
                          <span className={styles.equipoNombre}>{equipo.nombre}</span>
                          <span
                            className={styles.estadoBadge}
                            style={{ backgroundColor: getEstadoColor(equipo.estado) }}
                          >
                            {getEstadoLabel(equipo.estado)}
                          </span>
                        </div>
                        {equipo.observaciones && (
                          <div className={styles.equipoObservaciones}>
                            <strong>Observaciones:</strong> {equipo.observaciones}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p>No hay equipos registrados.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


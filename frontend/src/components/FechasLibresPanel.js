import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { adminAPI } from '@/services/api';
import { SkeletonCard } from '@/components/Loading';
import styles from '@/styles/FechasLibresPanel.module.css';

export default function FechasLibresPanel() {
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [disponibilidad, setDisponibilidad] = useState(null);

  // Buscar disponibilidad automáticamente al cambiar la fecha (solo una vez al montar)
  useEffect(() => {
    if (fecha) {
      buscarDisponibilidad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buscarDisponibilidad = async () => {
    if (!fecha) {
      setError('Por favor selecciona una fecha');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getFechasLibres(fecha);
      setDisponibilidad(response.data);
    } catch (err) {
      console.error('Error al buscar disponibilidad:', err);
      setError('Error al buscar disponibilidad de DJs');
    } finally {
      setLoading(false);
    }
  };

  const djsLibresFiltrados = disponibilidad?.djsLibres || [];
  const djsOcupadosFiltrados = disponibilidad?.djsOcupados || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Fechas Libres</h2>
        <p>Consulta qué DJs están disponibles en una fecha específica para cubrir reemplazos</p>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchForm}>
          <div className={styles.formGroup}>
            <label>Fecha:</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={styles.dateInput}
            />
          </div>
          <button
            type="button"
            onClick={buscarDisponibilidad}
            className={styles.searchButton}
            disabled={loading}
          >
            {loading ? 'Buscando...' : '🔍 Buscar Disponibilidad'}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {loading ? (
        <div className={styles.loading}>
          <SkeletonCard count={3} />
        </div>
      ) : disponibilidad ? (
        <div className={styles.results}>
          {/* Resumen */}
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{disponibilidad.totalLibres}</div>
              <div className={styles.summaryLabel}>DJs Libres</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{disponibilidad.totalOcupados}</div>
              <div className={styles.summaryLabel}>DJs Ocupados</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{disponibilidad.totalDJs}</div>
              <div className={styles.summaryLabel}>Total DJs</div>
            </div>
          </div>

          {/* DJs Libres */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              ✅ DJs Libres ({disponibilidad.totalLibres})
            </h3>
            {djsLibresFiltrados.length === 0 ? (
              <div className={styles.emptyMessage}>
                <p>No hay DJs libres en esta fecha</p>
              </div>
            ) : (
              <div className={styles.djsGrid}>
                {djsLibresFiltrados.map((dj) => (
                  <div key={dj.id} className={styles.djCard + ' ' + styles.djLibre}>
                    <div className={styles.djHeader}>
                      <div className={styles.djName}>{dj.nombre}</div>
                      <div className={styles.djStatusBadge + ' ' + styles.badgeLibre}>
                        Disponible
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DJs Ocupados */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              ❌ DJs Ocupados ({disponibilidad.totalOcupados})
            </h3>
            {djsOcupadosFiltrados.length === 0 ? (
              <div className={styles.emptyMessage}>
                <p>No hay DJs ocupados en esta fecha</p>
              </div>
            ) : (
              <div className={styles.djsGrid}>
                {djsOcupadosFiltrados.map((dj) => (
                  <div key={dj.id} className={styles.djCard + ' ' + styles.djOcupado}>
                    <div className={styles.djHeader}>
                      <div className={styles.djName}>{dj.nombre}</div>
                      <div className={styles.djStatusBadge + ' ' + styles.badgeOcupado}>
                        Ocupado
                      </div>
                    </div>
                      <div className={styles.eventosList}>
                      <div className={styles.eventosTitle}>Eventos:</div>
                      {dj.eventos && dj.eventos.length > 0 ? (
                        dj.eventos.map((evento, idx) => (
                          <div key={idx} className={styles.eventoItem}>
                            <span className={styles.eventoSalon}>
                              🏢 {evento.salon_nombre}
                            </span>
                            <span className={styles.eventoFecha}>
                              {format(new Date(evento.fecha_evento), 'HH:mm', { locale: es })}
                            </span>
                            {evento.confirmado && (
                              <span className={styles.eventoConfirmado}>✓ Confirmado</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className={styles.eventoItem}>Sin eventos registrados</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.placeholder}>
          <p>Selecciona una fecha y haz clic en "Buscar Disponibilidad" para ver qué DJs están libres</p>
        </div>
      )}
    </div>
  );
}


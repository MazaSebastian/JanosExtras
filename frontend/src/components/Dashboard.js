import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { eventosAPI } from '@/services/api';
import styles from '@/styles/Dashboard.module.css';

export default function Dashboard({ refreshTrigger, onRefresh }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    loadSummary();
  }, [selectedYear, selectedMonth, refreshTrigger]);

  // Exponer función de recarga manual
  useEffect(() => {
    if (onRefresh) {
      onRefresh(loadSummary);
    }
  }, [onRefresh]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const response = await eventosAPI.getMonthlySummary(selectedYear, selectedMonth);
      const data = response.data;
      
      // Asegurar que los valores numéricos estén correctos
      const totalEventos = parseInt(data.total_eventos) || 0;
      const eventosExtras = Math.max(0, totalEventos - 8);
      const sueldoAdicional = (eventosExtras * (data.cotizacion_extra || 47000));
      
      // Logs de debug (remover en producción)
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Resumen mensual cargado:', {
          año: selectedYear,
          mes: selectedMonth,
          total_eventos: totalEventos,
          eventos_extras: eventosExtras,
          sueldo_adicional: sueldoAdicional,
          raw_data: data
        });
      }
      
      setSummary({
        ...data,
        total_eventos: totalEventos,
        eventos_extras: eventosExtras,
        sueldo_adicional: sueldoAdicional
      });
    } catch (err) {
      console.error('Error al cargar resumen:', err);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className={styles.dashboard}>
      <h2 className={styles.title}>Resumen Mensual</h2>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Año:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className={styles.select}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Mes:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className={styles.select}
          >
            {months.map((month, index) => (
              <option key={index} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando resumen...</div>
      ) : (
        <div className={styles.summaryContainer}>
          <div className={styles.summaryCards}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Total de Eventos</div>
              <div className={styles.cardValue}>
                {summary?.total_eventos || 0}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Salones Diferentes</div>
              <div className={styles.cardValue}>
                {summary?.total_salones || 0}
              </div>
            </div>
          </div>

          <div className={styles.extrasSection}>
            <h3 className={styles.extrasTitle}>Información de Extras</h3>
            
            <div className={styles.extrasInfo}>
              <div className={styles.extrasRow}>
                <span className={styles.extrasLabel}>Cotización actual del extra:</span>
                <span className={styles.extrasValue}>
                  ${summary?.cotizacion_extra?.toLocaleString('es-AR') || '47.000'}
                </span>
              </div>

              <div className={styles.extrasRow}>
                <span className={styles.extrasLabel}>Total de eventos extras realizados:</span>
                <span className={styles.extrasValue}>
                  {summary?.eventos_extras || 0}
                </span>
              </div>

              <div className={styles.extrasRow}>
                <span className={styles.extrasLabel}>Sueldo Adicional:</span>
                <span className={styles.extrasValueHighlight}>
                  ${summary?.sueldo_adicional?.toLocaleString('es-AR') || '0'}
                </span>
              </div>
            </div>

            {summary?.total_eventos > 0 && (
              <div className={styles.extrasNote}>
                <small>
                  * Los primeros 8 eventos corresponden al sueldo base. 
                  Los eventos extras se cuentan a partir del evento número 9.
                </small>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


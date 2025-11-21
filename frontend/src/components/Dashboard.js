import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { eventosAPI } from '@/services/api';
import { getSalonColor } from '@/utils/colors';
import styles from '@/styles/Dashboard.module.css';

export default function Dashboard({ refreshTrigger, onRefresh, salonInfo, salonLoading }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSummary();
  }, [selectedYear, selectedMonth, refreshTrigger]);

  // Exponer función de recarga manual
  useEffect(() => {
    if (onRefresh) {
      onRefresh(loadSummary);
    }
  }, [onRefresh]);

  const downloadCSV = (rows, filename) => {
    const csvContent = rows
      .map((row) =>
        row
          .map((value) => {
            if (value === null || value === undefined) return '';
            const stringValue = value.toString();
            if (/[",;\n]/.test(stringValue)) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(';')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportEvents = async () => {
    try {
      setExporting(true);
      const response = await eventosAPI.getMyEventsByMonth(
        selectedYear,
        selectedMonth
      );
      const events = response.data || [];
      const header = ['Fecha', 'Salón', 'Confirmado'];
      const rows = events.map((event) => [
        event.fecha_evento
          ? format(new Date(event.fecha_evento), 'yyyy-MM-dd')
          : '',
        event.salon_nombre || '—',
        event.confirmado ? 'Sí' : 'No',
      ]);

      rows.push([]);
      rows.push(['Total eventos', summary?.total_eventos ?? events.length]);
      rows.push([
        'Eventos extras',
        summary?.eventos_extras ??
          Math.max(0, (summary?.total_eventos ?? events.length) - 8),
      ]);

      downloadCSV(
        [header, ...rows],
        `eventos_${selectedYear}-${String(selectedMonth).padStart(2, '0')}.csv`
      );
    } catch (err) {
      console.error('Error al exportar eventos:', err);
    } finally {
      setExporting(false);
    }
  };

  const loadSummary = async () => {
    try {
      setLoading(true);
      const response = await eventosAPI.getMonthlySummary(selectedYear, selectedMonth);
      const data = response.data;
      
      // Asegurar que los valores numéricos estén correctos
      const totalEventos = parseInt(data.total_eventos) || 0;
      // Calcular eventos extras: a partir del evento 9 (después de los 8 del sueldo base)
      const eventosExtras = totalEventos > 8 ? totalEventos - 8 : 0;
      const cotizacionExtra = data.cotizacion_extra || 47000;
      const sueldoAdicional = eventosExtras * cotizacionExtra;
      
      // Logs de debug (remover en producción)
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Resumen mensual cargado:', {
          año: selectedYear,
          mes: selectedMonth,
          total_eventos: totalEventos,
          eventos_extras: eventosExtras,
          sueldo_adicional: sueldoAdicional,
          cotizacion_extra: cotizacionExtra,
          raw_data: data
        });
      }
      
      setSummary({
        ...data,
        total_eventos: totalEventos,
        eventos_extras: eventosExtras,
        sueldo_adicional: sueldoAdicional,
        cotizacion_extra: cotizacionExtra
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
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Resumen Mensual</h2>
        <button
          type="button"
          className={styles.exportButton}
          onClick={handleExportEvents}
          disabled={exporting}
        >
          {exporting ? 'Generando...' : 'Exportar CSV'}
        </button>

        <div className={styles.salonInfo}>
          <span className={styles.salonLabel}>Salón actual:</span>
          {salonLoading ? (
            <span className={styles.salonName}>cargando...</span>
          ) : salonInfo ? (
            <>
              <span className={styles.salonName}>{salonInfo.nombre}</span>
              <span
                className={styles.salonBadge}
                style={{ backgroundColor: getSalonColor(salonInfo.id) }}
                title="Color asignado al salón"
              />
            </>
          ) : (
            <span className={styles.salonName}>Sin salón asignado</span>
          )}
        </div>
      </div>

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
                  {summary?.eventos_extras !== undefined ? summary.eventos_extras : (summary?.total_eventos > 8 ? summary.total_eventos - 8 : 0)}
                </span>
              </div>

              <div className={styles.extrasRow}>
                <span className={styles.extrasLabel}>Sueldo Adicional:</span>
                <span className={styles.extrasValueHighlight}>
                  ${(summary?.sueldo_adicional !== undefined ? summary.sueldo_adicional : ((summary?.eventos_extras !== undefined ? summary.eventos_extras : (summary?.total_eventos > 8 ? summary.total_eventos - 8 : 0)) * (summary?.cotizacion_extra || 47000))).toLocaleString('es-AR')}
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


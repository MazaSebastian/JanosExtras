import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { eventosAPI } from '@/services/api';
import { getSalonColor } from '@/utils/colors';
import Loading, { LoadingButton, SkeletonCard } from '@/components/Loading';
import styles from '@/styles/Dashboard.module.css';

export default function Dashboard({ refreshTrigger, onRefresh, salonInfo, salonLoading }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [exporting, setExporting] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailEvents, setDetailEvents] = useState([]);
  const [detailError, setDetailError] = useState('');
  const [rangeStartInput, setRangeStartInput] = useState('');
  const [rangeEndInput, setRangeEndInput] = useState('');
  const [activeRange, setActiveRange] = useState(null);
  const [rangeError, setRangeError] = useState('');
  const isRangeActive =
    Boolean(activeRange?.startDate) && Boolean(activeRange?.endDate);

  useEffect(() => {
    loadSummary();
  }, [selectedYear, selectedMonth, refreshTrigger, activeRange]);

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

  const handleApplyRange = () => {
    if (!rangeStartInput || !rangeEndInput) {
      setRangeError('Debes completar ambas fechas.');
      return;
    }

    const start = new Date(rangeStartInput);
    const end = new Date(rangeEndInput);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setRangeError('Las fechas ingresadas no son válidas.');
      return;
    }

    if (start > end) {
      setRangeError('La fecha inicial no puede ser mayor a la final.');
      return;
    }

    setRangeError('');
    setActiveRange({ startDate: rangeStartInput, endDate: rangeEndInput });
  };

  const handleClearRange = () => {
    setRangeStartInput('');
    setRangeEndInput('');
    setActiveRange(null);
    setRangeError('');
  };

  const fetchEventsForCurrentFilter = async () => {
    if (isRangeActive) {
      const response = await eventosAPI.getMyEventsByRange(
        activeRange.startDate,
        activeRange.endDate
      );
      return response.data || [];
    }
    const response = await eventosAPI.getMyEventsByMonth(
      selectedYear,
      selectedMonth
    );
    return response.data || [];
  };

  const rangeLabel = () => {
    if (!isRangeActive) return '';
    const startLabel = format(new Date(activeRange.startDate), 'dd/MM/yyyy');
    const endLabel = format(new Date(activeRange.endDate), 'dd/MM/yyyy');
    return `Filtrando del ${startLabel} al ${endLabel}`;
  };

  const handleExportEvents = async () => {
    try {
      setExporting(true);
      const events = await fetchEventsForCurrentFilter();
      const header = ['Fecha', 'Salón', 'Confirmado'];
      const rows = events.map((event) => [
        event.fecha_evento
          ? format(new Date(event.fecha_evento), 'yyyy-MM-dd')
          : '',
        event.salon_nombre || '—',
        event.confirmado ? 'Sí' : 'No',
      ]);

      rows.push([]);
      rows.push(['Total eventos', summary?.eventos_mes ?? events.length]);
      rows.push([
        'Eventos extras',
        summary?.eventos_extras ??
          Math.max(0, (summary?.eventos_mes ?? events.length) - 8),
      ]);

      downloadCSV(
        [header, ...rows],
        isRangeActive
          ? `eventos_${activeRange.startDate}_a_${activeRange.endDate}.csv`
          : `eventos_${selectedYear}-${String(selectedMonth).padStart(2, '0')}.csv`
      );
    } catch (err) {
      console.error('Error al exportar eventos:', err);
    } finally {
      setExporting(false);
    }
  };

  const toggleDetail = async () => {
    const nextVisible = !detailVisible;
    setDetailVisible(nextVisible);

    if (nextVisible && detailEvents.length === 0) {
      try {
        setDetailLoading(true);
        setDetailError('');
        const events = await fetchEventsForCurrentFilter();
        setDetailEvents(events);
      } catch (err) {
        console.error('Error al obtener detalle de eventos:', err);
        setDetailError('No se pudieron cargar los eventos.');
        setDetailVisible(false);
      } finally {
        setDetailLoading(false);
      }
    }
  };

  const loadSummary = async () => {
    try {
      setLoading(true);
      const response = isRangeActive
        ? await eventosAPI.getSummaryByRange(
            activeRange.startDate,
            activeRange.endDate
          )
        : await eventosAPI.getMonthlySummary(selectedYear, selectedMonth);
      const data = response.data || {};
      
      const totalEventosHistoricos = parseInt(data.total_eventos, 10) || 0;
      const eventosDelPeriodo =
        parseInt(data.eventos_mes ?? data.total_eventos, 10) || 0;
      const eventosExtras =
        data.eventos_extras ?? Math.max(0, eventosDelPeriodo - 8);
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
        total_eventos: isRangeActive ? eventosDelPeriodo : totalEventosHistoricos,
        total_eventos_historicos: totalEventosHistoricos,
        eventos_mes: eventosDelPeriodo,
        eventos_extras: eventosExtras,
        sueldo_adicional: sueldoAdicional,
        cotizacion_extra: cotizacionExtra
      });
      setDetailVisible(false);
      setDetailEvents([]);
      setDetailError('');
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
            <Skeleton width="120px" height="20px" />
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
            disabled={isRangeActive}
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
            disabled={isRangeActive}
          >
            {months.map((month, index) => (
              <option key={index} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.rangeFilters}>
          <div className={styles.rangeInputs}>
            <label>
              Desde
              <input
                type="date"
                value={rangeStartInput}
                onChange={(e) => setRangeStartInput(e.target.value)}
              />
            </label>
            <label>
              Hasta
              <input
                type="date"
                value={rangeEndInput}
                onChange={(e) => setRangeEndInput(e.target.value)}
              />
            </label>
          </div>
          <div className={styles.rangeActions}>
            <button
              type="button"
              className={styles.rangeButton}
              onClick={handleApplyRange}
              disabled={!rangeStartInput || !rangeEndInput}
            >
              Aplicar rango
            </button>
            <button
              type="button"
              className={`${styles.rangeButton} ${styles.clearRangeButton}`}
              onClick={handleClearRange}
              disabled={
                !isRangeActive && !rangeStartInput && !rangeEndInput
              }
            >
              Limpiar
            </button>
          </div>
          {rangeError && <p className={styles.rangeError}>{rangeError}</p>}
          {isRangeActive && (
            <p className={styles.rangeInfo}>
              {rangeLabel()} — los filtros de año/mes quedan deshabilitados.
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
          <SkeletonCard count={4} columns={4} />
        </div>
      ) : (
        <div className={styles.summaryContainer}>
          <div className={styles.summaryCards}>
            <div
              className={`${styles.card} ${styles.clickableCard}`}
              onClick={toggleDetail}
            >
              <div className={styles.cardTitle}>Total de Eventos</div>
              <div className={styles.cardValue}>
                {summary?.total_eventos || 0}
              </div>
              <div className={styles.cardHint}>
                {isRangeActive
                  ? 'Eventos en el rango seleccionado'
                  : 'Eventos históricos totales'}
                <br />
                {detailVisible ? 'Ocultar detalle' : 'Ver detalle'}
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
                  {summary?.eventos_extras !== undefined
                    ? summary.eventos_extras
                    : summary?.eventos_mes
                    ? Math.max(0, summary.eventos_mes - 8)
                    : 0}
                </span>
              </div>

              <div className={styles.extrasRow}>
                <span className={styles.extrasLabel}>Sueldo Adicional:</span>
                <span className={styles.extrasValueHighlight}>
                  {(
                    summary?.sueldo_adicional !== undefined
                      ? summary.sueldo_adicional
                      : ((summary?.eventos_extras !== undefined
                          ? summary.eventos_extras
                          : summary?.eventos_mes
                          ? Math.max(0, summary.eventos_mes - 8)
                          : 0) *
                        (summary?.cotizacion_extra || 47000))
                  ).toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {summary?.eventos_mes > 0 && (
              <div className={styles.extrasNote}>
                <small>
                  * Los primeros 8 eventos del período corresponden al sueldo base. 
                  Los eventos extras se cuentan a partir del evento número 9.
                </small>
              </div>
            )}
          </div>

        {detailVisible && (
          <div className={styles.detailSection}>
            <div className={styles.detailHeader}>
              <h3>
                Detalle de eventos del período (
                {summary?.eventos_mes || summary?.total_eventos || 0})
              </h3>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={toggleDetail}
              >
                Cerrar
              </button>
            </div>
            {detailError && (
              <div className={styles.error}>{detailError}</div>
            )}
            {detailLoading ? (
              <Loading message="Cargando eventos..." size="small" />
            ) : detailEvents.length === 0 ? (
              <div className={styles.detailEmpty}>
                No tienes eventos registrados en este mes.
              </div>
            ) : (
              <div className={styles.detailList}>
                {detailEvents.map((event) => (
                  <div key={event.id} className={styles.detailItem}>
                    <div>
                      <strong>
                        {event.fecha_evento
                          ? format(new Date(event.fecha_evento), 'dd/MM/yyyy')
                          : '--/--'}
                      </strong>
                      <span>{event.salon_nombre || 'Sin salón'}</span>
                    </div>
                    <span className={styles.detailStatus}>
                      {event.confirmado ? 'Confirmado' : 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      )}
    </div>
  );
}


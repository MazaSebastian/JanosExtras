import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { eventosAPI } from '@/services/api';
import styles from '@/styles/Dashboard.module.css';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    loadSummary();
  }, [selectedYear, selectedMonth]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const response = await eventosAPI.getMonthlySummary(selectedYear, selectedMonth);
      setSummary(response.data);
    } catch (err) {
      console.error('Error al cargar resumen:', err);
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
      )}
    </div>
  );
}


import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { adminAPI } from '@/services/api';
import { getAuth, clearAuth } from '@/utils/auth';
import { getSalonColor } from '@/utils/colors';
import Calendar from '@/components/Calendar';
import styles from '@/styles/AdminDashboard.module.css';

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const years = (() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, index) => currentYear - 2 + index);
})();

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDjId, setSelectedDjId] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth.token || !auth.user) {
      router.push('/login');
      return;
    }
    if (auth.user.rol !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setUser(auth.user);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user, selectedYear, selectedMonth]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getDashboard(selectedYear, selectedMonth);
      setData(response.data);
      if (!selectedDjId && response.data.djs.length > 0) {
        setSelectedDjId(response.data.djs[0].id);
      }
    } catch (err) {
      console.error('Error al cargar dashboard admin:', err);
      setError(err.response?.data?.error || 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const handleGoToDJ = () => {
    router.push('/dashboard');
  };

  const formatNumber = (value) => {
    return (value ?? 0).toLocaleString('es-AR');
  };

  const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
    });
  };

  if (!user) {
    return <div className={styles.loading}>Verificando credenciales...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.subtitle}>Panel Administrativo</p>
          <h1 className={styles.title}>Control General DJs</h1>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.secondaryButton} onClick={handleGoToDJ}>
            Ir al Dashboard de DJ
          </button>
          <button className={styles.logoutButton} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Año</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Mes</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {months.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>
        <button
          className={styles.refreshButton}
          onClick={loadDashboardData}
          disabled={loading}
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </section>

      {error && <div className={styles.error}>{error}</div>}

      {loading && !data ? (
        <div className={styles.loading}>Cargando información...</div>
      ) : (
        data && (
          <>
            <section className={styles.summaryGrid}>
              <div className={styles.card}>
                <h3>Total DJs</h3>
                <p>{formatNumber(data.summary.total_djs)}</p>
              </div>
              <div className={styles.card}>
                <h3>Salones activos</h3>
                <p>
                  {formatNumber(data.summary.salones_con_eventos)} /{' '}
                  {formatNumber(data.summary.total_salones)}
                </p>
              </div>
              <div className={styles.card}>
                <h3>Eventos del mes</h3>
                <p>{formatNumber(data.summary.total_eventos_mes)}</p>
              </div>
              <div className={styles.card}>
                <h3>DJs con actividad</h3>
                <p>
                  {formatNumber(data.summary.djs_con_eventos)} /{' '}
                  {formatNumber(data.summary.total_djs)}
                </p>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>DJs</h2>
                  <p>Actividad mensual por DJ</p>
                </div>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>DJ</th>
                      <th>Rol</th>
                      <th>Salón</th>
                      <th>Eventos</th>
                      <th>Extras</th>
                      <th>Último evento</th>
                    </tr>
                  </thead>
                  <tbody>
            {data.djs.map((dj) => {
                      const color = getSalonColor(dj.salon_id || dj.id);
                      return (
                        <tr key={dj.id}>
                          <td data-label="DJ" className={styles.djNameCell}>
                            <span
                              className={styles.djColorDot}
                              style={{ backgroundColor: color }}
                              title={`Salón: ${dj.salon_nombre || 'Sin salón'}`}
                            />
                            {dj.nombre}
                          </td>
                        <td data-label="Rol">
                          <span
                            className={
                              dj.rol === 'admin'
                                ? styles.badgeAdmin
                                : styles.badgeDj
                            }
                          >
                            {dj.rol}
                          </span>
                        </td>
                        <td data-label="Salón">{dj.salon_nombre || 'Sin salón'}</td>
                        <td data-label="Eventos">{formatNumber(dj.total_eventos)}</td>
                        <td
                          data-label="Extras"
                          className={dj.eventos_extras > 0 ? styles.highlight : ''}
                        >
                          {formatNumber(dj.eventos_extras)}
                        </td>
                          <td data-label="Último evento">{formatDate(dj.ultimo_evento)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Salones</h2>
                  <p>Distribución de eventos por salón</p>
                </div>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Salón</th>
                      <th>Eventos del mes</th>
                      <th>DJs activos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.salones.map((salon) => (
                      <tr key={salon.id}>
                        <td data-label="Salón">{salon.nombre}</td>
                        <td data-label="Eventos del mes">{formatNumber(salon.total_eventos)}</td>
                        <td data-label="DJs activos">{formatNumber(salon.djs_activos)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Calendario anual por DJ</h2>
                  <p>Seleccioná un DJ para visualizar sus eventos del año</p>
                </div>
                <div className={styles.djSelector}>
                  <label htmlFor="dj-calendar-select">DJ</label>
                  <select
                    id="dj-calendar-select"
                    value={selectedDjId || ''}
                    onChange={(e) => setSelectedDjId(parseInt(e.target.value, 10))}
                  >
                    {data.djs.map((dj) => (
                      <option key={dj.id} value={dj.id}>
                        {dj.nombre} {dj.salon_nombre ? `(${dj.salon_nombre})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedDjId ? (
                (() => {
                  const selectedDj = data.djs.find((dj) => dj.id === selectedDjId);
                  if (!selectedDj) {
                    return (
                      <div className={styles.emptyState}>
                        No se encontró información del DJ seleccionado.
                      </div>
                    );
                  }

                  if (!selectedDj.salon_id) {
                    return (
                      <div className={styles.emptyState}>
                        Este DJ no tiene un salón asignado, no es posible mostrar su calendario.
                      </div>
                    );
                  }

                  return (
                    <Calendar
                      salonId={selectedDj.salon_id}
                      filterDjId={selectedDj.id}
                      readOnly
                    />
                  );
                })()
              ) : (
                <div className={styles.emptyState}>No hay DJs disponibles.</div>
              )}
            </section>
          </>
        )
      )}
    </div>
  );
}


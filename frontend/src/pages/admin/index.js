import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { adminAPI } from '@/services/api';
import { getAuth, clearAuth } from '@/utils/auth';
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
                <h3>Eventos extras</h3>
                <p>{formatNumber(data.summary.total_eventos_extras)}</p>
              </div>
              <div className={styles.card}>
                <h3>DJs con actividad</h3>
                <p>
                  {formatNumber(data.summary.djs_con_eventos)} /{' '}
                  {formatNumber(data.summary.total_djs)}
                </p>
              </div>
              <div className={styles.card}>
                <h3>Promedio eventos por DJ</h3>
                <p>{data.summary.promedio_eventos_por_dj}</p>
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
                    {data.djs.map((dj) => (
                      <tr key={dj.id}>
                        <td>{dj.nombre}</td>
                        <td>
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
                        <td>{dj.salon_nombre || 'Sin salón'}</td>
                        <td>{formatNumber(dj.total_eventos)}</td>
                        <td className={dj.eventos_extras > 0 ? styles.highlight : ''}>
                          {formatNumber(dj.eventos_extras)}
                        </td>
                        <td>{formatDate(dj.ultimo_evento)}</td>
                      </tr>
                    ))}
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
                        <td>{salon.nombre}</td>
                        <td>{formatNumber(salon.total_eventos)}</td>
                        <td>{formatNumber(salon.djs_activos)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )
      )}
    </div>
  );
}


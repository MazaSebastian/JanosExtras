import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAuth } from '@/utils/auth';
import { eventosAPI, fichadasAPI, coordinacionesAPI } from '@/services/api';
import DJLayout from '@/components/DJLayout';
import Loading, { SkeletonCard } from '@/components/Loading';
import styles from '@/styles/Home.module.css';

export default function DJHomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [recentFichadas, setRecentFichadas] = useState([]);
  const [upcomingCoordinaciones, setUpcomingCoordinaciones] = useState([]);

  useEffect(() => {
    const auth = getAuth();
    if (!auth.token || !auth.user) {
      router.push('/login');
      return;
    }
    setUser(auth.user);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    loadHomeData();
  }, [user]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      // Cargar resumen de eventos
      const summaryRes = await eventosAPI.getMonthlySummary(year, month);
      setSummary(summaryRes.data);

      // Cargar últimas fichadas (últimas 5)
      const fichadasRes = await fichadasAPI.list({ limit: 5 });
      setRecentFichadas(fichadasRes.data?.slice(0, 5) || []);

      // Cargar coordinaciones próximas (próximas 5)
      const coordinacionesRes = await coordinacionesAPI.getAll({ activo: true });
      const allCoordinaciones = coordinacionesRes.data || [];
      const upcoming = allCoordinaciones
        .filter(c => {
          if (!c.fecha_evento) return false;
          const eventDate = new Date(c.fecha_evento);
          return eventDate >= currentDate;
        })
        .sort((a, b) => new Date(a.fecha_evento) - new Date(b.fecha_evento))
        .slice(0, 5);
      setUpcomingCoordinaciones(upcoming);

    } catch (err) {
      console.error('Error al cargar datos del home:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Loading message="Cargando..." fullScreen />;
  }

  return (
    <DJLayout user={user}>
      <div className={styles.homeContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Bienvenido, {user.nombre}</h1>
          <p className={styles.subtitle}>Resumen de tus actividades</p>
        </div>

        {loading ? (
          <SkeletonCard count={4} />
        ) : (
          <div className={styles.grid}>
            {/* Resumen de Eventos */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>📊</span>
                <h2 className={styles.cardTitle}>Eventos y Extras</h2>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Total de Eventos</span>
                  <span className={styles.statValue}>{summary?.total_eventos || 0}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Eventos del Mes</span>
                  <span className={styles.statValue}>{summary?.eventos_mes || 0}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Eventos Extras</span>
                  <span className={styles.statValue}>{summary?.eventos_extras || 0}</span>
                </div>
                {summary?.sueldo_adicional && (
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Sueldo Adicional</span>
                    <span className={styles.statValue}>${summary.sueldo_adicional.toLocaleString()}</span>
                  </div>
                )}
                <button
                  className={styles.cardAction}
                  onClick={() => router.push('/dashboard')}
                >
                  Ver Detalles →
                </button>
              </div>
            </div>

            {/* Últimas Fichadas */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>⏱️</span>
                <h2 className={styles.cardTitle}>Últimas Fichadas</h2>
              </div>
              <div className={styles.cardContent}>
                {recentFichadas.length === 0 ? (
                  <p className={styles.emptyMessage}>No hay fichadas registradas</p>
                ) : (
                  <div className={styles.list}>
                    {recentFichadas.map((fichada) => (
                      <div key={fichada.id} className={styles.listItem}>
                        <span className={styles.listItemIcon}>
                          {fichada.tipo === 'ingreso' ? '⬇️' : '⬆️'}
                        </span>
                        <div className={styles.listItemContent}>
                          <span className={styles.listItemTitle}>
                            {fichada.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                          </span>
                          <span className={styles.listItemSubtitle}>
                            {format(new Date(fichada.registrado_en), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  className={styles.cardAction}
                  onClick={() => router.push('/dashboard/fichadas')}
                >
                  Ver Todas →
                </button>
              </div>
            </div>

            {/* Coordinaciones Próximas */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>📋</span>
                <h2 className={styles.cardTitle}>Coordinaciones Próximas</h2>
              </div>
              <div className={styles.cardContent}>
                {upcomingCoordinaciones.length === 0 ? (
                  <p className={styles.emptyMessage}>No hay coordinaciones próximas</p>
                ) : (
                  <div className={styles.list}>
                    {upcomingCoordinaciones.map((coord) => (
                      <div key={coord.id} className={styles.listItem}>
                        <div className={styles.listItemContent}>
                          <span className={styles.listItemTitle}>{coord.nombre_cliente || coord.titulo}</span>
                          <span className={styles.listItemSubtitle}>
                            {coord.fecha_evento && format(new Date(coord.fecha_evento), 'dd/MM/yyyy', { locale: es })}
                            {coord.tipo_evento && ` • ${coord.tipo_evento}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  className={styles.cardAction}
                  onClick={() => router.push('/dashboard/coordinaciones')}
                >
                  Ver Todas →
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </DJLayout>
  );
}


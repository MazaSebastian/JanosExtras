import { useEffect, useState, useMemo } from 'react';
import { format, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import ContenidoPanel from './ContenidoPanel';
import styles from '@/styles/LiveFichadasPanel.module.css';

// Usaremos un hook interno o fetch directo si no hay servicio expuesto aún
// Pero lo ideal es usar adminAPI. 
// Asumiremos que adminAPI.getLiveStatus existe o lo agregaremos.
import { adminAPI } from '@/services/api';
import Loading from '@/components/Loading';

export default function LiveFichadasPanel() {
    const [djs, setDjs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdate, setLastUpdate] = useState(new Date());

    const fetchLiveStatus = async () => {
        try {
            setLoading(true);
            // Nota: Debemos asegurarnos de agregar getLiveStatus a adminAPI en services/api.js
            // Si no existe, lo agregaremos en el siguiente paso.
            const response = await adminAPI.getLiveStatus();
            setDjs(response.data || []);
            setLastUpdate(new Date());
            setError('');
        } catch (err) {
            console.error('Error fetching live status:', err);
            setError('No se pudo cargar el estado en vivo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveStatus();
        // Auto-refresh cada minuto
        const interval = setInterval(fetchLiveStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    const stats = useMemo(() => {
        const total = djs.length;
        const working = djs.filter(dj => dj.ultimo_tipo === 'ingreso').length;
        const inactive = total - working;

        // Detectar alertas (ej. ingreso hace más de 12 horas)
        const alerts = djs.filter(dj => {
            if (dj.ultimo_tipo === 'ingreso' && dj.ultima_fichada) {
                const hours = differenceInHours(new Date(), new Date(dj.ultima_fichada));
                return hours > 12;
            }
            return false;
        }).length;

        return { total, working, inactive, alerts };
    }, [djs]);

    const getStatusColor = (dj) => {
        if (dj.ultimo_tipo === 'ingreso') {
            // Verificar si lleva demasiadas horas
            const hours = differenceInHours(new Date(), new Date(dj.ultima_fichada));
            if (hours > 12) return styles.statusWarning;
            return styles.statusActive;
        }
        return styles.statusInactive;
    };

    const getStatusText = (dj) => {
        if (dj.ultimo_tipo === 'ingreso') return 'En turno';
        if (dj.ultimo_tipo === 'egreso') return 'Fuera de turno';
        return 'Sin actividad';
    };

    return (
        <div className={styles.panel}>
            {/* Stats Summary */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Actualmente trabajando</span>
                    <span className={styles.statValue} style={{ color: '#10b981' }}>{stats.working}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Fuera de turno</span>
                    <span className={styles.statValue} style={{ color: '#9ca3af' }}>{stats.inactive}</span>
                </div>
                {stats.alerts > 0 && (
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Posibles olvidos de salida</span>
                        <span className={styles.statValue} style={{ color: '#f59e0b' }}>{stats.alerts}</span>
                    </div>
                )}
            </div>

            <div className={styles.headerRow}>
                <h3>Estado de DJs en Tiempo Real</h3>
                <button onClick={fetchLiveStatus} className={styles.refreshButton}>
                    🔄 Actualizar
                </button>
            </div>

            {loading && djs.length === 0 ? (
                <Loading message="Cargando estado..." size="small" />
            ) : error ? (
                <div className={styles.error}>{error}</div>
            ) : (
                <div className={styles.grid}>
                    {djs.map((dj) => (
                        <div key={dj.id} className={styles.djCard}>
                            <div className={styles.cardHeader}>
                                <div
                                    className={styles.djAvatar}
                                    style={{ backgroundColor: dj.color_hex || '#eee', color: '#fff' }}
                                >
                                    {dj.nombre.substring(0, 2).toUpperCase()}
                                </div>
                                <div className={styles.djInfo}>
                                    <span className={styles.djName}>{dj.nombre}</span>
                                    <span className={styles.djSalon}>{dj.salon_nombre || 'Sin salón asignado'}</span>
                                </div>
                                <div
                                    className={`${styles.statusIndicator} ${getStatusColor(dj)}`}
                                    title={getStatusText(dj)}
                                />
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.timeRow}>
                                    <span className={styles.timeLabel}>Estado:</span>
                                    <span className={styles.timeValue}>{getStatusText(dj)}</span>
                                </div>
                                {dj.ultima_fichada && (
                                    <div className={styles.timeRow}>
                                        <span className={styles.timeLabel}>Desde:</span>
                                        <span className={styles.timeValue}>
                                            {format(new Date(dj.ultima_fichada), 'HH:mm', { locale: es })} hs
                                            <small style={{ color: '#888', marginLeft: '4px' }}>
                                                ({format(new Date(dj.ultima_fichada), 'dd/MM')})
                                            </small>
                                        </span>
                                    </div>
                                )}
                                {dj.latitud && dj.longitud && dj.ultimo_tipo === 'ingreso' && (
                                    <div className={styles.locationRow}>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${dj.latitud},${dj.longitud}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.mapLink}
                                        >
                                            📍 Ver ubicación de ingreso
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {djs.length === 0 && (
                        <div className={styles.emptyState}>
                            No hay DJs activos en el sistema.
                        </div>
                    )}
                </div>
            )}
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#999' }}>
                Última actualización: {format(lastUpdate, 'HH:mm:ss')}
            </div>
        </div>
    );
}

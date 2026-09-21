import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { disponibilidadBloquesAPI } from '@/services/api';
import styles from '@/styles/GestionBloquesModal.module.css';

const PRESET_HOURS = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

// Lista de horarios en formato 24hs (intervalos de 15 minutos de 00:00 a 23:45)
const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
    const h = Math.floor(i / 4);
    const m = (i % 4) * 15;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

export default function GestionBloquesModal({
    date,
    salonId,
    djId,
    isOpen,
    onClose,
    onUpdated
}) {
    const [bloques, setBloques] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedHour, setSelectedHour] = useState('15:00');
    const [error, setError] = useState('');

    const formattedDate = date ? format(date, "EEEE d 'de' MMMM", { locale: es }) : '';
    const dateStr = date ? format(date, 'yyyy-MM-dd') : '';

    const fetchBloques = useCallback(async () => {
        if (!dateStr) return;
        try {
            setLoading(true);
            setError('');
            const res = await disponibilidadBloquesAPI.getByFecha(dateStr, {
                salon_id: salonId,
                dj_id: djId
            });
            setBloques(res.data?.bloques || []);
        } catch (err) {
            console.error('Error cargando bloques de disponibilidad:', err);
            setError('No se pudieron cargar los bloques del día');
        } finally {
            setLoading(false);
        }
    }, [dateStr, salonId, djId]);

    useEffect(() => {
        if (isOpen && date) {
            fetchBloques();
        }
    }, [isOpen, date, fetchBloques]);

    const handleAddBlock = async (hourToAdd) => {
        const hour = hourToAdd || selectedHour;
        if (!hour) return;

        // Validar si ya existe
        if (bloques.some(b => b.hora_inicio === hour)) {
            setError(`El horario ${hour} ya está en la lista.`);
            return;
        }

        try {
            setActionLoading(true);
            setError('');
            const res = await disponibilidadBloquesAPI.create({
                fecha: dateStr,
                hora_inicio: hour,
                salon_id: salonId
            });
            setBloques(res.data?.bloques || []);
            if (onUpdated) onUpdated();
        } catch (err) {
            console.error('Error al agregar bloque:', err);
            setError(err.response?.data?.error || 'Error al agregar bloque de horario');
        } finally {
            setActionLoading(false);
        }
    };

    const handleImportHabituales = async () => {
        try {
            setActionLoading(true);
            setError('');
            const res = await disponibilidadBloquesAPI.importarHabituales(dateStr, salonId);
            setBloques(res.data?.bloques || []);
            if (res.data?.message) {
                alert(res.data.message);
            }
            if (onUpdated) onUpdated();
        } catch (err) {
            console.error('Error al importar horarios habituales:', err);
            setError(err.response?.data?.error || 'Error al importar horarios');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteBlock = async (bloqueId) => {
        try {
            setActionLoading(true);
            await disponibilidadBloquesAPI.delete(bloqueId);
            setBloques(prev => prev.filter(b => b.id !== bloqueId));
            if (onUpdated) onUpdated();
        } catch (err) {
            console.error('Error al eliminar bloque:', err);
            setError('Error al eliminar el bloque');
        } finally {
            setActionLoading(false);
        }
    };

    const handleClearFree = async () => {
        if (!confirm('¿Deseas eliminar todos los horarios que aún no han sido asignados a clientes?')) {
            return;
        }
        try {
            setActionLoading(true);
            await disponibilidadBloquesAPI.clearFreeByFecha(dateStr);
            setBloques(prev => prev.filter(b => b.estado !== 'disponible'));
            if (onUpdated) onUpdated();
        } catch (err) {
            console.error('Error limpiando horarios libres:', err);
            setError('Error al limpiar horarios');
        } finally {
            setActionLoading(false);
        }
    };

    if (!isOpen) return null;

    const freeCount = bloques.filter(b => b.estado === 'disponible').length;
    const occupiedCount = bloques.filter(b => b.estado === 'ocupado').length;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div>
                        <h3 className={styles.title}>Bloques de Horarios Disponibles</h3>
                        <p className={styles.subtitle}>{formattedDate}</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} title="Cerrar">×</button>
                </div>

                {error && (
                    <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '12px' }}>
                        ⚠️ {error}
                    </div>
                )}

                <div className={styles.quickActions}>
                    <button
                        className={styles.importBtn}
                        onClick={handleImportHabituales}
                        disabled={actionLoading}
                        title="Carga automáticamente los horarios habituales configurados en tu perfil de DJ para este día"
                    >
                        <span>⚡</span>
                        <span>Cargar mis horarios habituales para este día</span>
                    </button>

                    <div className={styles.addBlockRow}>
                        <select
                            className={styles.timeSelect}
                            value={selectedHour}
                            onChange={(e) => setSelectedHour(e.target.value)}
                        >
                            {TIME_OPTIONS.map((time) => (
                                <option key={time} value={time}>
                                    {time} hs
                                </option>
                            ))}
                        </select>
                        <button
                            className={styles.addBtn}
                            onClick={() => handleAddBlock()}
                            disabled={actionLoading || !selectedHour}
                        >
                            + Agregar Bloque
                        </button>
                    </div>

                    <div className={styles.presetChips}>
                        <span style={{ fontSize: '0.75rem', color: '#a0a0b0', alignSelf: 'center', marginRight: '4px' }}>
                            Comunes:
                        </span>
                        {PRESET_HOURS.map(hour => {
                            const exists = bloques.some(b => b.hora_inicio === hour);
                            if (exists) return null;
                            return (
                                <button
                                    key={hour}
                                    type="button"
                                    className={styles.presetChip}
                                    onClick={() => handleAddBlock(hour)}
                                    disabled={actionLoading}
                                >
                                    + {hour}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className={styles.sectionHeader}>
                    <span className={styles.sectionTitle}>
                        Horarios del Día ({freeCount} libres, {occupiedCount} ocupados)
                    </span>
                    {freeCount > 0 && (
                        <button
                            className={styles.clearFreeBtn}
                            onClick={handleClearFree}
                            disabled={actionLoading}
                            title="Eliminar todos los horarios libres de este día"
                        >
                            Limpiar libres
                        </button>
                    )}
                </div>

                <div className={styles.blocksSection}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                            Cargando bloques...
                        </div>
                    ) : bloques.length === 0 ? (
                        <div className={styles.emptyState}>
                            No hay bloques de horarios creados para este día.<br />
                            Agrega horarios arriba o carga tus horarios habituales.
                        </div>
                    ) : (
                        bloques.map((b) => {
                            const isOcupado = b.estado === 'ocupado';
                            const clientDisplay = b.nombre_cliente
                                ? `${b.nombre_cliente} ${b.apellido_cliente || ''}`.trim()
                                : (b.coordinacion_titulo || 'Cliente asignado');

                            return (
                                <div
                                    key={b.id}
                                    className={`${styles.blockCard} ${isOcupado ? styles.blockOcupado : styles.blockDisponible}`}
                                >
                                    <div className={styles.blockInfo}>
                                        <span className={styles.blockTime}>{b.hora_inicio} hs</span>
                                        <div className={styles.blockDetails}>
                                            <span
                                                className={`${styles.blockBadge} ${isOcupado ? styles.badgeOcupado : styles.badgeDisponible}`}
                                            >
                                                {isOcupado ? '🔒 Ocupado / Asignado' : '🟢 Disponible'}
                                            </span>
                                            {isOcupado && (
                                                <span className={styles.blockClient} title={clientDisplay}>
                                                    {clientDisplay} {b.tipo_evento ? `(${b.tipo_evento})` : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {!isOcupado && (
                                        <button
                                            className={styles.deleteBlockBtn}
                                            onClick={() => handleDeleteBlock(b.id)}
                                            disabled={actionLoading}
                                            title="Eliminar este horario"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className={styles.footer}>
                    <button className={styles.doneBtn} onClick={onClose}>
                        Listo
                    </button>
                </div>
            </div>
        </div>
    );
}

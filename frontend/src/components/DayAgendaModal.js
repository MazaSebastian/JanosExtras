import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { coordinacionesAPI, disponibilidadBloquesAPI } from '@/services/api';
import styles from '@/styles/DayAgendaModal.module.css';
import EditCoordinationModal from './EditCoordinationModal';
import GestionBloquesModal from './GestionBloquesModal';

export default function DayAgendaModal({
    date,
    events,
    videocalls,
    onClose,
    onAddClick,
    onEventClick,
    onRefresh
}) {
    const [deletingId, setDeletingId] = useState(null);
    const [editingVideocall, setEditingVideocall] = useState(null);
    const [bloques, setBloques] = useState([]);
    const [loadingBloques, setLoadingBloques] = useState(false);
    const [showGestionBloques, setShowGestionBloques] = useState(false);

    const dateStr = date ? format(date, 'yyyy-MM-dd') : '';

    const fetchBloques = useCallback(async () => {
        if (!dateStr) return;
        try {
            setLoadingBloques(true);
            const res = await disponibilidadBloquesAPI.getByFecha(dateStr);
            setBloques(res.data?.bloques || []);
        } catch (err) {
            console.error('Error al cargar bloques en DayAgendaModal:', err);
        } finally {
            setLoadingBloques(false);
        }
    }, [dateStr]);

    useEffect(() => {
        fetchBloques();
    }, [fetchBloques]);

    const handleDeleteVideocall = async (colId) => {
        if (!confirm('¿Estás seguro de que deseas quitar esta reunión? La coordinación y los datos del evento se mantendrán intactos.')) {
            return;
        }
        try {
            setDeletingId(colId);
            await coordinacionesAPI.update(colId, {
                videollamada_agendada: false,
                videollamada_fecha: null,
                videollamada_completada: false,
                videollamada_meet_link: null
            });
            if (onRefresh) onRefresh();

            // Si era la última cosa agendada, podríamos cerrar el modal,
            // pero el parent lo re-evaluará.
            if (events.length === 0 && videocalls.length === 1) {
                onClose();
            }
        } catch (err) {
            console.error('Error al quitar reunión:', err);
            alert('Hubo un error al quitar la reunión. Por favor intenta de nuevo.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleCompletada = async (vc) => {
        try {
            await coordinacionesAPI.update(vc.id, {
                videollamada_completada: !vc.videollamada_completada
            });
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Error actualizando estado de reunión:', err);
            alert('Hubo un error al actualizar el estado de la reunión. Intenta nuevamente.');
        }
    };

    const formattedDate = format(date, "EEEE d 'de' MMMM", { locale: es });

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>Agenda del Día</h3>
                    <p className={styles.subtitle} style={{ textTransform: 'capitalize' }}>{formattedDate}</p>
                </div>

                <div className={styles.listContainer}>
                    {events.length > 0 && (
                        <div className={styles.section}>
                            <h4 className={styles.sectionTitle}>Eventos Asignados</h4>
                            {events.map((ev) => (
                                <div key={ev.id} className={`${styles.listItem} ${styles.eventItem}`}>
                                    <div className={styles.itemInfo}>
                                        <div className={styles.itemTitle}>
                                            Fiesta en {ev.salon_nombre || `Salón #${ev.salon_id}`}
                                        </div>
                                        <div className={styles.itemSubtitle}>
                                            DJ: {ev.dj_nombre || 'Tú'}
                                        </div>
                                    </div>
                                    <div className={styles.itemActions}>
                                        <button
                                            className={styles.actionBtn}
                                            onClick={() => onEventClick(ev)}
                                            title="Ver / Editar Evento"
                                        >
                                            👁 Ver Evento
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {videocalls.length > 0 && (
                        <div className={styles.section}>
                            <h4 className={styles.sectionTitle}>Reuniones / Videollamadas</h4>
                            {videocalls.map((vc) => {
                                let timeStr = '';
                                if (vc.videollamada_fecha) {
                                    try {
                                        const cleanStr = String(vc.videollamada_fecha).replace(' ', 'T').replace(/Z$/, '');
                                        timeStr = format(new Date(cleanStr), 'HH:mm');
                                    } catch (e) { }
                                }
                                return (
                                    <div key={vc.id} className={`${styles.listItem} ${styles.videocallItem}`}>
                                        <div className={styles.itemInfo}>
                                            <div className={styles.itemTitle} style={{ textDecoration: vc.videollamada_completada ? 'line-through' : 'none', color: vc.videollamada_completada ? '#888' : 'inherit' }}>
                                                Reunión: {vc.nombre_cliente || vc.titulo}
                                            </div>
                                            {timeStr && (
                                                <div className={styles.itemSubtitle}>
                                                    ⏰ Hora: {timeStr}hs
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.itemActions}>
                                            <button
                                                className={styles.actionBtn}
                                                onClick={() => handleToggleCompletada(vc)}
                                                disabled={deletingId === vc.id}
                                                title={vc.videollamada_completada ? "Marcar como pendiente" : "Marcar como completada"}
                                                style={{ filter: vc.videollamada_completada ? 'grayscale(0.8) opacity(0.5)' : 'none' }}
                                            >
                                                ✅
                                            </button>
                                            <button
                                                className={styles.actionBtn}
                                                onClick={() => setEditingVideocall(vc)}
                                                disabled={deletingId === vc.id}
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                onClick={() => handleDeleteVideocall(vc.id)}
                                                disabled={deletingId === vc.id}
                                                title="Eliminar"
                                            >
                                                {deletingId === vc.id ? '⏳' : '🗑'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Sección de Bloques de Horarios Disponibles */}
                    <div className={styles.blocksSection}>
                        <div className={styles.blocksHeader}>
                            <h4 className={styles.sectionTitle} style={{ margin: 0, fontSize: '0.9rem' }}>
                                ⏰ Bloques de Horarios ({bloques.filter(b => b.estado === 'disponible').length} libres)
                            </h4>
                            <button
                                className={styles.configLinkBtn}
                                onClick={() => setShowGestionBloques(true)}
                            >
                                {bloques.length === 0 ? '+ Crear bloques' : '⚙️ Configurar'}
                            </button>
                        </div>
                        {bloques.length === 0 ? (
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>
                                No hay bloques creados para este día.
                            </p>
                        ) : (
                            <div className={styles.blocksChipsList}>
                                {bloques.map(b => (
                                    <span
                                        key={b.id}
                                        className={b.estado === 'disponible' ? styles.freeChip : styles.occupiedChip}
                                        title={b.estado === 'disponible' ? 'Disponible para agendar' : `Asignado a ${b.nombre_cliente || 'cliente'}`}
                                    >
                                        {b.estado === 'disponible' ? '🟢' : '🔒'} {b.hora_inicio} hs
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {events.length === 0 && videocalls.length === 0 && bloques.length === 0 && (
                        <div className={styles.emptyState}>
                            No hay nada agendado ni horarios configurados para este día.
                        </div>
                    )}
                </div>

                <div className={styles.footerActions}>
                    <button
                        className={styles.manageBlocksBtn}
                        onClick={() => setShowGestionBloques(true)}
                    >
                        ⚙️ Gestionar Horarios Disponibles del Día
                    </button>
                    <button className={styles.addButton} onClick={() => {
                        onClose();
                        onAddClick();
                    }}>
                        + Agendar nueva reunión o evento
                    </button>
                    <button className={styles.cancelButton} onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>

            {showGestionBloques && (
                <GestionBloquesModal
                    date={date}
                    isOpen={showGestionBloques}
                    onClose={() => setShowGestionBloques(false)}
                    onUpdated={() => {
                        fetchBloques();
                        if (onRefresh) onRefresh();
                    }}
                />
            )}

            {editingVideocall && (
                <EditCoordinationModal
                    coordinacion={editingVideocall}
                    onClose={() => setEditingVideocall(null)}
                    onSave={() => {
                        setEditingVideocall(null);
                        fetchBloques();
                        if (onRefresh) onRefresh();
                    }}
                />
            )}
        </div>
    );
}

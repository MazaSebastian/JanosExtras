import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { coordinacionesAPI } from '@/services/api';
import styles from '@/styles/DayAgendaModal.module.css';
import EditCoordinationModal from './EditCoordinationModal';

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

    const handleDeleteVideocall = async (colId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta reunión? Esta acción es irreversible.')) {
            return;
        }
        try {
            setDeletingId(colId);
            await coordinacionesAPI.delete(colId);
            if (onRefresh) onRefresh();

            // Si era la última cosa agendada, podríamos cerrar el modal,
            // pero el parent lo re-evaluará.
            if (events.length === 0 && videocalls.length === 1) {
                onClose();
            }
        } catch (err) {
            console.error('Error eliminando reunión:', err);
            alert('Hubo un error al eliminar la reunión. Por favor intenta de nuevo.');
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
                                        timeStr = format(new Date(vc.videollamada_fecha), 'HH:mm');
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

                    {events.length === 0 && videocalls.length === 0 && (
                        <div className={styles.emptyState}>
                            No hay nada agendado para este día.
                        </div>
                    )}
                </div>

                <div className={styles.footerActions}>
                    <button className={styles.addButton} onClick={() => {
                        onClose();
                        onAddClick();
                    }}>
                        + Agendar nueva disponibilidad
                    </button>
                    <button className={styles.cancelButton} onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>

            {editingVideocall && (
                <EditCoordinationModal
                    coordinacion={editingVideocall}
                    onClose={() => setEditingVideocall(null)}
                    onSave={() => {
                        setEditingVideocall(null);
                        if (onRefresh) onRefresh();
                    }}
                />
            )}
        </div>
    );
}

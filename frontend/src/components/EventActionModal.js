import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { coordinacionesAPI, eventosAPI } from '@/services/api';
import WhatsAppTemplateModal from '@/components/WhatsAppTemplateModal';
import EditCoordinationModal from '@/components/EditCoordinationModal';
import styles from '@/styles/EventActionModal.module.css';
import { FLUJOS_POR_TIPO } from '@/components/CoordinacionFlujo';
import { exportarCoordinacionPDF } from '@/utils/pdfExport';

export default function EventActionModal({ event, onClose, onRefresh }) {
    const router = useRouter();
    const [coordinacion, setCoordinacion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [showWhatsAppTemplates, setShowWhatsAppTemplates] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [notas, setNotas] = useState('');
    const [savingNotas, setSavingNotas] = useState(false);
    const [contactado, setContactado] = useState(false);
    const [savingContactado, setSavingContactado] = useState(false);
    const [showEncuestaResults, setShowEncuestaResults] = useState(false);

    useEffect(() => {
        const fetchCoordination = async () => {
            try {
                const res = await coordinacionesAPI.getAll({ activo: true });

                // Find matching coordination mapped to this event's Date and Salon
                // the event.fecha_evento is returned from server, usually starting with 'YYYY-MM-DD'
                const rawDate = event.fecha_evento || '';
                let searchDate = '';
                if (typeof rawDate === 'string') {
                    searchDate = rawDate.split('T')[0];
                } else if (rawDate instanceof Date) {
                    searchDate = rawDate.toISOString().split('T')[0];
                }

                const matching = res.data?.find((c) => {
                    const cDate = typeof c.fecha_evento === 'string' ? c.fecha_evento.split('T')[0] : '';
                    return String(c.salon_id) === String(event.salon_id) && cDate === searchDate;
                });

                if (matching) {
                    setCoordinacion(matching);
                    setNotas(matching.notas || '');
                    setContactado(matching.contactado || false);
                }
            } catch (err) {
                console.error('Error fetching coordination:', err);
                setError('No se pudo cargar la configuración de la coordinación. Verifica tu conexión.');
            } finally {
                setLoading(false);
            }
        };

        if (event) {
            fetchCoordination();
        }
    }, [event]);

    const handleToggleContacto = async () => {
        const newValue = !contactado;
        setContactado(newValue);
        setSavingContactado(true);
        try {
            await coordinacionesAPI.update(coordinacion.id, { contactado: newValue });
            setCoordinacion(prev => ({ ...prev, contactado: newValue }));
            if (onRefresh) onRefresh();
        } catch (e) {
            console.error('Error actualizando contacto:', e);
            alert('Error al guardar estado de contacto.');
            setContactado(!newValue);
        } finally {
            setSavingContactado(false);
        }
    };

    const handleSaveNotas = async () => {
        if (!coordinacion || notas === (coordinacion.notas || '')) return;
        try {
            setSavingNotas(true);
            await coordinacionesAPI.update(coordinacion.id, { notas });
            setCoordinacion(prev => ({ ...prev, notas }));
        } catch (e) {
            console.error('Error guardando notas:', e);
            alert('Error al guardar las notas. Intenta de nuevo.');
        } finally {
            setSavingNotas(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que deseas eliminar este evento y liberar la fecha? Esta acción es irreversible.')) {
            return;
        }
        try {
            setIsDeleting(true);
            await eventosAPI.delete(event.id);

            if (coordinacion && coordinacion.id) {
                try {
                    await coordinacionesAPI.delete(coordinacion.id);
                } catch (e) {
                    console.warn("Error al borrar coordinación asoccidada: ", e);
                }
            }

            onRefresh();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar el evento. Por favor, intenta nuevamente.');
            setIsDeleting(false);
        }
    };

    const handleExportPDF = async () => {
        if (exportingPdf) return;
        setExportingPdf(true);
        try {
            await exportarCoordinacionPDF(coordinacion, coordinacionesAPI, FLUJOS_POR_TIPO);
        } catch (error) {
            console.error('Error generando PDF:', error);
            alert('Hubo un error al generar el PDF. Por favor intentarlo nuevamente.');
        } finally {
            setExportingPdf(false);
        }
    };

    const getStatusBadge = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'completado':
            case 'completada':
                return <span className={`${styles.badge} ${styles.statusVerde}`}>COMPLETADO</span>;
            case 'en_proceso':
                return <span className={`${styles.badge} ${styles.statusProceso}`}>EN PROCESO</span>;
            case 'cancelada':
                return <span className={`${styles.badge} ${styles.statusRoja}`}>CANCELADA</span>;
            default:
                return <span className={`${styles.badge} ${styles.statusPendiente}`}>PENDIENTE</span>;
        }
    };

    if (loading) {
        return (
            <div className={styles.overlay} onClick={onClose}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.loader}>
                        <div className={styles.spinner}></div>
                        Cargando información del evento...
                    </div>
                </div>
            </div>
        );
    }

    // Fallback if no coordination is mapped to this event yet
    if (!coordinacion) {
        return (
            <div className={styles.overlay} onClick={onClose}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.header}>
                        <h3 className={styles.title}>Evento Reservado</h3>
                        <span className={`${styles.badge} ${styles.statusPendiente}`}>SIN COORDINACIÓN</span>
                    </div>

                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            📅 <strong>{event.fecha_evento ? format(new Date(event.fecha_evento.split('T')[0] + 'T00:00:00'), 'dd/MM/yyyy') : 'Fecha no disponible'}</strong>
                        </div>
                        <div className={styles.infoItem}>
                            ⚠️ <em>No se encontraron datos de coordinación para este día. Quizás fue creado por un sistema antiguo.</em>
                        </div>
                    </div>

                    <div className={styles.actionsContainer} style={{ gridTemplateColumns: '1fr' }}>
                        <button className={`${styles.actionButton} ${styles.deleteAction}`} onClick={handleDelete} disabled={isDeleting}>
                            <span className={styles.actionIcon}>🗑</span>
                            {isDeleting ? 'Eliminando...' : 'Eliminar Evento'}
                        </button>
                    </div>

                    <button className={styles.cancelButton} onClick={onClose}>Volver al Calendario</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{coordinacion.titulo || 'Evento en Salón'}</h3>
                    {getStatusBadge(coordinacion.estado)}
                </div>

                <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                        👤 <strong>Cliente:</strong> {coordinacion.nombre_cliente ? `${coordinacion.nombre_cliente} ${coordinacion.apellido_cliente || ''}`.trim() : 'N/A'}
                    </div>
                    <div className={styles.infoItem}>
                        📅 <strong>Fecha:</strong> {event.fecha_evento ? format(new Date(event.fecha_evento.split('T')[0] + 'T00:00:00'), 'dd/MM/yyyy') : 'N/A'}
                    </div>
                    <div className={styles.infoItem}>
                        📞 <strong>Tel:</strong> {coordinacion.telefono || 'N/A'}
                    </div>
                    <div className={styles.infoItem}>
                        #️⃣ <strong>Código:</strong> {coordinacion.codigo_evento || 'N/A'}
                    </div>
                    <div className={styles.infoItem}>
                        🎉 <strong>Tipo:</strong> {coordinacion.tipo_evento || 'N/A'}
                    </div>
                    {coordinacion.nombre_agasajado && (
                        <div className={styles.infoItem}>
                            👑 <strong>Agasajado/a:</strong> {coordinacion.nombre_agasajado}
                        </div>
                    )}
                    {coordinacion.videollamada_agendada && coordinacion.videollamada_fecha && (
                        <div className={styles.infoItem} style={{ gridColumn: '1 / -1', marginTop: '8px', padding: '12px', background: '#e0e7ff', borderRadius: '8px', border: '1px solid #c7d2fe', color: '#3730a3', textAlign: 'center' }}>
                            📅 <strong style={{ marginLeft: '4px' }}>
                                Videollamada/Reunión agendada el día <span style={{ textTransform: 'capitalize' }}>{format(new Date(coordinacion.videollamada_fecha), "EEEE d 'de' MMMM, HH:mm'hs'", { locale: es })}</span>
                            </strong>
                            {coordinacion.videollamada_completada && <span style={{ marginLeft: '10px', backgroundColor: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>COMPLETADA ✅</span>}
                        </div>
                    )}
                    <div className={styles.infoItem} style={{ gridColumn: '1 / -1', marginTop: '8px', padding: '12px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}>
                        💬 <strong style={{ marginRight: '12px' }}>Primer Contacto Realizado:</strong>
                        <button
                            className={styles.contactToggleButton}
                            onClick={handleToggleContacto}
                            disabled={savingContactado}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '20px',
                                border: 'none',
                                fontWeight: 'bold',
                                cursor: savingContactado ? 'wait' : 'pointer',
                                opacity: savingContactado ? 0.7 : 1,
                                transition: 'all 0.2s',
                                backgroundColor: contactado ? '#e8f5e9' : '#ffebee',
                                color: contactado ? '#2e7d32' : '#c62828',
                                border: `1px solid ${contactado ? '#c8e6c9' : '#ffcdd2'}`
                            }}
                        >
                            {contactado ? '✅ SÍ, CONTACTADO' : '❌ NO, PENDIENTE'}
                        </button>
                        {savingContactado && <span style={{ marginLeft: '10px', fontSize: '12px', color: '#772c87', fontWeight: 'bold', fontStyle: 'italic' }}>Guardando...</span>}
                    </div>
                </div>

                <div className={styles.notasContainer}>
                    <div className={styles.notasLabel}>
                        <label>📝 Notas Generales</label>
                        {savingNotas && <span className={styles.savingIndicator}>Guardando...</span>}
                    </div>
                    <textarea
                        className={styles.notasInput}
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        onBlur={handleSaveNotas}
                        placeholder="Ingresá información específica de este evento aquí... (Se guarda automáticamente al hacer click afuera)"
                        rows={3}
                    />
                </div>

                <div className={styles.actionsContainer}>
                    <button
                        className={`${styles.actionButton} ${styles.primaryAction}`}
                        onClick={() => router.push(`/dashboard/coordinaciones/${coordinacion.id}/iniciar`)}
                    >
                        <span className={styles.actionIcon}>▶️</span>
                        Iniciar Coordinación
                    </button>

                    <button
                        className={styles.actionButton}
                        onClick={async () => {
                            try {
                                const res = await coordinacionesAPI.generarPreCoordinacion(coordinacion.id);
                                if (res.data?.success) {
                                    prompt('Copia esta URL y compártela con el cliente:', res.data.url);
                                } else {
                                    alert('Ocurrió un problema generando el enlace.');
                                }
                            } catch (e) {
                                alert('No se pudo generar la pre-coordinación en este momento.');
                            }
                        }}
                    >
                        <span className={styles.actionIcon}>🔗</span>
                        Link Pre-Coordinación
                    </button>

                    <button
                        className={`${styles.actionButton} ${coordinacion.encuesta_completada ? '' : styles.whatsappAction}`}
                        style={coordinacion.encuesta_completada ? { backgroundColor: '#facc15', color: '#111', border: 'none' } : {}}
                        onClick={() => {
                            if (coordinacion.encuesta_completada) {
                                setShowEncuestaResults(true);
                            } else {
                                const url = `${window.location.origin}/encuesta/${coordinacion.id}`;
                                const text = `¡Hola ${coordinacion.nombre_cliente}! Ojalá hayas pasado una fiesta increíble. 🥳 Me encantaría que me dejes tu opinión sobre el evento midiendo nuestro desempeño en este link cortito (te lleva 1 minuto): ${url}`;
                                window.open(`https://wa.me/${(coordinacion.telefono || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                            }
                        }}
                    >
                        <span className={styles.actionIcon}>{coordinacion.encuesta_completada ? '⭐' : '📤'}</span>
                        {coordinacion.encuesta_completada ? 'Ver Resultados Encuesta' : 'Enviar Encuesta'}
                    </button>

                    <button
                        className={`${styles.actionButton} ${styles.whatsappAction}`}
                        onClick={() => {
                            if (!coordinacion.telefono) {
                                alert('Este evento no tiene número de teléfono asignado.');
                                return;
                            }
                            setShowWhatsAppTemplates(true);
                        }}
                    >
                        <span className={styles.actionIcon}>💬</span>
                        Plantillas WhatsApp
                    </button>

                    <button
                        className={`${styles.actionButton} ${styles.whatsappAction}`}
                        style={{ backgroundColor: '#25D366', color: 'white' }}
                        onClick={() => {
                            if (!coordinacion.telefono) {
                                alert('Este evento no tiene número de teléfono asignado.');
                                return;
                            }
                            let num = coordinacion.telefono.replace(/[^0-9]/g, '');
                            // Normalización básica para Argentina (si empieza sin 549, agregarlo)
                            if (num.startsWith('54') && !num.startsWith('549')) {
                                num = '549' + num.substring(2);
                            } else if (!num.startsWith('54')) {
                                num = '549' + num;
                            }
                            window.open(`https://wa.me/${num}`, '_blank');
                        }}
                    >
                        <span className={styles.actionIcon}>📱</span>
                        Ir al chat
                    </button>

                    <button
                        className={styles.actionButton}
                        onClick={() => router.push(`/dashboard`)} // They can go to the specific dashboard tab
                    >
                        <span className={styles.actionIcon}>👁</span>
                        Ver Flujo Completo
                    </button>

                    <button
                        className={styles.actionButton}
                        onClick={() => setShowEditModal(true)}
                    >
                        <span className={styles.actionIcon}>✏️</span>
                        Editar Datos
                    </button>

                    <button
                        className={`${styles.actionButton} ${styles.pdfAction}`}
                        onClick={handleExportPDF}
                        disabled={exportingPdf || isDeleting}
                    >
                        <span className={styles.actionIcon}>{exportingPdf ? '⏳' : '📄'}</span>
                        {exportingPdf ? 'Generando PDF...' : 'Exportar a PDF'}
                    </button>

                    <button
                        className={`${styles.actionButton} ${styles.deleteAction}`}
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        <span className={styles.actionIcon}>🗑</span>
                        {isDeleting ? 'Eliminando...' : 'Eliminar Evento'}
                    </button>
                </div>

                <button className={styles.cancelButton} onClick={onClose} disabled={isDeleting}>
                    Cerrar Pantalla
                </button>
            </div>

            {showWhatsAppTemplates && (
                <WhatsAppTemplateModal
                    coordinacion={coordinacion}
                    event={event}
                    onClose={() => setShowWhatsAppTemplates(false)}
                />
            )}

            {showEncuestaResults && coordinacion.encuesta_respuestas && (
                <div className={styles.overlay} onClick={() => setShowEncuestaResults(false)} style={{ zIndex: 10001 }}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className={styles.header}>
                            <h3 className={styles.title}>⭐ Resultados de la Encuesta</h3>
                        </div>
                        <div style={{ padding: '15px 0' }}>
                            <p style={{ color: '#bbb', marginBottom: '20px' }}>
                                A continuación, los puntajes que el cliente ({coordinacion.nombre_cliente}) asignó a este evento:
                            </p>

                            {(() => {
                                const parseRespuestas = () => {
                                    try {
                                        return typeof coordinacion.encuesta_respuestas === 'string'
                                            ? JSON.parse(coordinacion.encuesta_respuestas)
                                            : coordinacion.encuesta_respuestas;
                                    } catch (e) {
                                        return null;
                                    }
                                };
                                const data = parseRespuestas();
                                if (!data) return <p>Hubo un error cargando las respuestas.</p>;

                                const StarRow = ({ label, val }) => (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', background: '#333', padding: '10px 15px', borderRadius: '8px' }}>
                                        <span style={{ fontWeight: '600' }}>{label}</span>
                                        <span style={{ display: 'flex', gap: '4px' }}>
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <span key={i} style={{ color: i <= val ? '#facc15' : '#555', fontSize: '20px' }}>★</span>
                                            ))}
                                        </span>
                                    </div>
                                );

                                return (
                                    <>
                                        <StarRow label="Atención en la coordinación" val={data.atencion_coordinacion || 0} />
                                        <StarRow label="Presencia en el evento" val={data.presencia_evento || 0} />
                                        <StarRow label="Musicalización y Pista" val={data.musicalizacion || 0} />
                                        <StarRow label="Calidad Técnica" val={data.calidad_tecnica || 0} />
                                        <StarRow label="Calificación General" val={data.calificacion_general || 0} />

                                        {data.comentarios && data.comentarios.trim() !== '' && (
                                            <div style={{ marginTop: '20px', background: 'rgba(250, 204, 21, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(250, 204, 21, 0.3)' }}>
                                                <strong style={{ color: '#facc15', display: 'block', marginBottom: '8px' }}>Comentarios del Cliente:</strong>
                                                <span style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>"{data.comentarios}"</span>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                        <button className={styles.cancelButton} onClick={() => setShowEncuestaResults(false)} style={{ marginTop: '20px' }}>Cerrar</button>
                    </div>
                </div>
            )}

            {showEditModal && (
                <EditCoordinationModal
                    coordinacion={coordinacion}
                    onClose={() => setShowEditModal(false)}
                    onSave={() => {
                        setShowEditModal(false);
                        onClose(); // Close the main modal to reflect changes from parent fetch
                        if (onRefresh) onRefresh();
                    }}
                />
            )}
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { coordinacionesAPI, eventosAPI } from '@/services/api';
import WhatsAppTemplateModal from '@/components/WhatsAppTemplateModal';
import EditCoordinationModal from '@/components/EditCoordinationModal';
import styles from '@/styles/EventActionModal.module.css';

export default function EventActionModal({ event, onClose, onRefresh }) {
    const router = useRouter();
    const [coordinacion, setCoordinacion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showWhatsAppTemplates, setShowWhatsAppTemplates] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [notas, setNotas] = useState('');
    const [savingNotas, setSavingNotas] = useState(false);
    const [contactado, setContactado] = useState(false);
    const [savingContactado, setSavingContactado] = useState(false);

    useEffect(() => {
        const fetchCoordination = async () => {
            try {
                const res = await coordinacionesAPI.getAll({ activo: true });

                // Find matching coordination mapped to this event's Date and Salon
                // the event.fecha_evento is returned from server, usually starting with 'YYYY-MM-DD'
                const rawDate = event.fecha_evento || '';
                const searchDate = typeof rawDate === 'string' ? rawDate.split('T')[0] : '';

                const matching = res.data?.find((c) => {
                    const cDate = typeof c.fecha_evento === 'string' ? c.fecha_evento.split('T')[0] : '';
                    return c.salon_id === event.salon_id && cDate === searchDate;
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
        try {
            alert("Generando PDF... por favor espera unos segundos.");
            const html2pdf = (await import('html2pdf.js')).default;

            // Creamos un wrapper invisible pero presentable para exportar al A4
            const reportDiv = document.createElement('div');
            reportDiv.style.padding = '40px';
            reportDiv.style.fontFamily = 'Arial, sans-serif';
            reportDiv.style.color = '#333';

            const contentHtml = `
        <div style="border-bottom: 2px solid #772c87; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #772c87; margin: 0;">REPORTE DE COORDINACIÓN JANOS</h1>
          <p style="color: #666; font-size: 14px; margin-top: 5px;">Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        </div>
        
        <div style="margin-bottom: 30px; line-height: 1.8; font-size: 16px;">
          <h2 style="font-size: 20px; color: #444; border-bottom: 1px solid #eee; padding-bottom: 8px;">Información General</h2>
          <p><strong>Evento:</strong> ${coordinacion.titulo || 'Sin título'} </p>
          <p><strong>Cliente:</strong> ${coordinacion.nombre_cliente ? `${coordinacion.nombre_cliente} ${coordinacion.apellido_cliente || ''}`.trim() : 'N/A'}</p>
          <p><strong>Teléfono:</strong> ${coordinacion.telefono || 'N/A'}</p>
          <p><strong>Tipo:</strong> ${coordinacion.tipo_evento || 'N/A'}</p>
          <p><strong>Código:</strong> ${coordinacion.codigo_evento || 'N/A'}</p>
          <p><strong>Estado:</strong> ${coordinacion.estado ? coordinacion.estado.toUpperCase() : 'PENDIENTE'}</p>
        </div>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <h2 style="font-size: 20px; color: #444; margin-top: 0;">Resumen del Evento</h2>
          <p style="color: #555;">La coordinación y el flujo de detalles correspondientes se encuentran almacenados y auditados en el sistema central de Janos DJ Dashboard.</p>
        </div>
      `;

            reportDiv.innerHTML = contentHtml;
            document.body.appendChild(reportDiv);

            const opt = {
                margin: 15,
                filename: `Coordinacion_${(coordinacion.nombre_cliente ? `${coordinacion.nombre_cliente} ${coordinacion.apellido_cliente || ''}`.trim() : 'Evento').replace(/[^a-z0-9]/gi, '_')}_${coordinacion.codigo_evento || ''}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(reportDiv).save();

            // Cleanup DOM
            document.body.removeChild(reportDiv);
        } catch (error) {
            console.error('Error generando PDF:', error);
            alert('Hubo un error al generar el PDF. Verifica la consola para más detalles.');
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
                        Contactar por WhatsApp
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
                    >
                        <span className={styles.actionIcon}>📄</span>
                        Exportar a PDF
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

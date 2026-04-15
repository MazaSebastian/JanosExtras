import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { coordinacionesAPI } from '@/services/api';
import styles from '@/styles/WhatsAppTemplateModal.module.css';

/**
 * WhatsAppTemplateModal — Selector de plantillas de mensaje pre-armadas.
 * Auto-genera el link de pre-coordinación si no existe al momento de enviar.
 */
export default function WhatsAppTemplateModal({ coordinacion, event, onClose }) {
    const [selectedId, setSelectedId] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [livePreCoordUrl, setLivePreCoordUrl] = useState(coordinacion?.pre_coordinacion_url || null);

    // ── Datos dinámicos ──
    const nombreCliente = coordinacion?.nombre_cliente || 'cliente';
    const nombreDj = (() => {
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            return u.nombre || 'tu DJ';
        } catch { return 'tu DJ'; }
    })();
    const fechaEvento = (() => {
        const raw = coordinacion?.fecha_evento || event?.fecha_evento;
        if (!raw) return 'próximo evento';
        try {
            const d = new Date(String(raw).split('T')[0] + 'T12:00:00');
            return format(d, "EEEE d 'de' MMMM", { locale: es });
        } catch { return String(raw); }
    })();
    const salonNombre = coordinacion?.salon_nombre || 'el salón';
    const telefono = coordinacion?.telefono || '';

    // ── Helper: asegurar que el link de pre-coord exista ──
    const ensurePreCoordUrl = async () => {
        if (livePreCoordUrl) return livePreCoordUrl;
        if (!coordinacion?.id) return null;

        try {
            setGenerating(true);
            const res = await coordinacionesAPI.generarPreCoordinacion(coordinacion.id);
            const url = res.data?.url || null;
            if (url) {
                setLivePreCoordUrl(url);
            }
            return url;
        } catch (err) {
            console.error('Error generando link de pre-coordinación:', err);
            return null;
        } finally {
            setGenerating(false);
        }
    };

    // ── Build message text (uses the live URL, not the stale one) ──
    const buildMessage = (templateId, url) => {
        switch (templateId) {
            case 'presentacion':
                return `¡Hola ${nombreCliente}! Mi nombre es ${nombreDj}, DJ y técnico de ${salonNombre} para tu evento del ${fechaEvento}. 🎵

Te escribo para presentarme formalmente y quedar a tu entera disposición para cualquier consulta musical o técnica que necesites a medida que nos acerquemos a la fecha.

¡Un saludo grande y seguimos en contacto!`;

            case 'pre-coord':
                return `¡Hola ${nombreCliente}! Mi nombre es ${nombreDj}, ¡espero que te encuentres muy bien! 🎵

Me pongo en contacto para que juntos comencemos a preparar los detalles técnicos y musicales de tu evento del ${fechaEvento} en ${salonNombre}. Para conocer mejor tus gustos y asegurar que todo salga perfecto, preparé un breve formulario interactivo de pre-coordinación para que lo vayas completando:

${url}

Una vez que lo envíes, te invito a que coordinemos una videollamada, o bien una reunión presencial directamente en el salón. La idea es repasar tus respuestas juntos, confirmar los últimos detalles técnicos y despejar cualquier duda.

¡Quedo a la espera de tu confirmación para avanzar!`;

            case 'agendar':
                return `¡Hola ${nombreCliente}! Acá ${nombreDj} nuevamente.

Ya estuve viendo tu formulario de pre-coordinación, ¡excelentes elecciones! Para avanzar, el siguiente paso es organizar nuestra reunión para repasar todos los detalles técnicos y dejar el cronograma cerrado.

¿Preferís que hagamos una videollamada o que nos encontremos directamente en ${salonNombre}? Te dejo el link a mi agenda para que elijas el día y horario que te quede más cómodo:

[Pegar aquí tu link de agenda]

¡Cualquier cosa me escribís!`;

            case 'recordar':
                return `¡Hola ${nombreCliente}! Acá ${nombreDj} nuevamente.

Paso a dejarte un recordatorio rápido: vi en el sistema que todavía tenemos algunas cositas pendientes de definir para tu evento.

Te dejo el link a mano para que, cuando tengan un ratito, puedan completarlo:

${url}

Si están trabados con alguna elección o necesitan recomendaciones de canciones para esos momentos, ¡avísenme y los ayudo a elegir!`;

            default:
                return '';
        }
    };

    // ── Template cards config ──
    const templates = [
        {
            id: 'presentacion',
            icon: '👋',
            title: 'Presentación Formal / Neutra',
            needsUrl: false,
            description: 'Primer contacto amigable sin link (Ideal para eventos corporativos)',
        },
        {
            id: 'pre-coord',
            icon: '📋',
            title: 'Envío de Pre-Coordinación',
            needsUrl: true,
            description: 'Genera y envía el formulario de pre-coordinación al cliente',
        },
        {
            id: 'agendar',
            icon: '📅',
            title: 'Agendar Videollamada / Reunión',
            needsUrl: false,
            description: 'Invitá al cliente a coordinar la reunión de repaso',
        },
        {
            id: 'recordar',
            icon: '⏰',
            title: 'Recordar Items Faltantes',
            needsUrl: true,
            description: 'Recordale al cliente que complete los datos pendientes',
        },
    ];

    // ── Handle send ──
    const handleSend = async (template) => {
        let url = livePreCoordUrl;

        // Auto-generate URL if the template needs it and it doesn't exist
        if (template.needsUrl && !url) {
            url = await ensurePreCoordUrl();
            if (!url) {
                alert('No se pudo generar el link de pre-coordinación. Intentá de nuevo.');
                return;
            }
        }

        const message = buildMessage(template.id, url);
        const cleanPhone = telefono.replace(/[\s\-\(\)]/g, '');
        const encodedText = encodeURIComponent(message);
        // Usar api.whatsapp.com nativo para esquivar la corrupción de emojis de wa.me
        window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`, '_blank');
        onClose();
    };

    // ── Get preview text for expanded card ──
    const getPreview = (templateId) => {
        return buildMessage(templateId, livePreCoordUrl || '🔗 [Se generará automáticamente al enviar]');
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>💬 Mensajes WhatsApp</h3>
                    <p className={styles.subtitle}>Seleccioná una plantilla para enviar a <strong>{nombreCliente}</strong></p>
                </div>

                <div className={styles.templateList}>
                    {templates.map((t) => (
                        <div
                            key={t.id}
                            className={`${styles.templateCard} ${selectedId === t.id ? styles.expanded : ''}`}
                            onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
                        >
                            <div className={styles.templateHeader}>
                                <span className={styles.templateIcon}>{t.icon}</span>
                                <div className={styles.templateInfo}>
                                    <span className={styles.templateTitle}>{t.title}</span>
                                    <span className={styles.templateDesc}>{t.description}</span>
                                </div>
                                <span className={styles.expandArrow}>{selectedId === t.id ? '▲' : '▼'}</span>
                            </div>

                            {selectedId === t.id && (
                                <div className={styles.previewSection}>
                                    <div className={styles.messagePreview}>
                                        {getPreview(t.id)}
                                    </div>
                                    <button
                                        className={styles.sendButton}
                                        disabled={generating}
                                        onClick={(e) => { e.stopPropagation(); handleSend(t); }}
                                    >
                                        {generating ? (
                                            <><span className={styles.miniSpinner}></span> Generando link...</>
                                        ) : (
                                            <><span>📲</span> Enviar por WhatsApp</>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <button className={styles.closeButton} onClick={onClose}>
                    Cerrar
                </button>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { coordinacionesAPI } from '@/services/api';
import { FLUJOS_POR_TIPO } from './CoordinacionFlujo';
import styles from '@/styles/WhatsAppTemplateModal.module.css';

/**
 * WhatsAppTemplateModal — Selector de plantillas de mensaje pre-armadas.
 * Auto-genera el link de pre-coordinación si no existe al momento de enviar.
 */
export default function WhatsAppTemplateModal({ coordinacion, event, onClose }) {
    const [selectedId, setSelectedId] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [livePreCoordUrl, setLivePreCoordUrl] = useState(coordinacion?.pre_coordinacion_url || null);
    const [missingItems, setMissingItems] = useState([]);

    useEffect(() => {
        const fetchFlujoStatus = async () => {
            if (!coordinacion?.id) return;
            try {
                const flujoResponse = await coordinacionesAPI.getFlujo(coordinacion.id);
                const flujoData = flujoResponse?.data || flujoResponse;

                let respuestasObj = {};
                if (flujoData && flujoData.respuestas) {
                    respuestasObj = typeof flujoData.respuestas === 'string'
                        ? JSON.parse(flujoData.respuestas)
                        : flujoData.respuestas;
                }

                // Normalizar tipo de evento
                const rawTipo = coordinacion?.tipo_evento || '';
                let tipoEventoNormalizado = '';
                if (typeof rawTipo === 'string' && rawTipo.toLowerCase().includes('casamiento')) {
                    tipoEventoNormalizado = 'Casamiento';
                } else if (typeof rawTipo === 'string' && rawTipo.toLowerCase().includes('cumple')) {
                    tipoEventoNormalizado = 'Cumpleaños';
                } else {
                    tipoEventoNormalizado = rawTipo; // Corporativo, XV, Religioso
                }

                const flujo = FLUJOS_POR_TIPO[tipoEventoNormalizado] || [];
                const faltantes = [];

                flujo.forEach(paso => {
                    let pasoFaltante = false;
                    paso.preguntas.forEach(pregunta => {
                        const esCondicional = pregunta.condicional && pregunta.condicional.pregunta;
                        const valorCondicion = respuestasObj[pregunta.condicional?.pregunta];
                        const debeMostrar = !esCondicional || (valorCondicion === pregunta.condicional.valor);

                        if (debeMostrar) {
                            const val = respuestasObj[pregunta.id];
                            const isPendiente = val === '__PENDIENTE__';
                            const isUndefined = (val === undefined || val === null || String(val).trim() === '') && pregunta.requerido;
                            const isPlaylistPendiente = pregunta.id === 'playlist_pendiente' && String(val).includes('Pendiente');

                            if (isUndefined || isPendiente || isPlaylistPendiente) {
                                pasoFaltante = true;
                            }
                        }
                    });

                    if (pasoFaltante) {
                        faltantes.push(paso.titulo);
                    }
                });

                setMissingItems(faltantes);
            } catch (err) {
                console.error("Error al recuperar respuestas del flujo:", err);
            }
        };

        fetchFlujoStatus();
    }, [coordinacion]);

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

Me gustaría ver la posibilidad de coordinar una reunión presencial o videollamada para repasar todos los detalles técnicos de nuestro evento con fecha ${fechaEvento}.

¿Qué días y en qué horarios te quedaría mejor así lo vamos coordinando?`;

            case 'recordar':
                const listaItems = missingItems.length > 0
                    ? missingItems.map(item => `- ${item}`).join('\n')
                    : '- Completar datos pendientes de la pre-coordinación';

                return `¡Hola ${nombreCliente}! Acá ${nombreDj} nuevamente.

Paso a dejarte un recordatorio rápido: vi en el sistema que todavía tenemos algunas cositas pendientes de definir para tu evento:

${listaItems}

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
            needsUrl: false,
            description: 'Explicita por texto qué pasos tiene pendientes',
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

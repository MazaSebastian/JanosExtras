import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { coordinacionesAPI } from '@/services/api';
import { LoadingButton } from '@/components/Loading';
import CustomSelect from '@/components/CustomSelect';
import styles from '@/styles/EventMarker.module.css';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

export default function ReunionMarker({ date, salonId, djId, onEventCreated, onClose }) {
    const [loading, setLoading] = useState(false);
    const [fetchingEvents, setFetchingEvents] = useState(true);
    const [availableEvents, setAvailableEvents] = useState([]);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        coordinacion_id: '',
        hora: '15:00',
    });

    useEffect(() => {
        const fetchEventsForSalon = async () => {
            try {
                setFetchingEvents(true);
                const res = await coordinacionesAPI.getAll({ activo: true });
                const events = res.data || [];

                // Filtrar eventos del salón actual que NO sean reuniones
                const filtered = events.filter(e => {
                    // Mismo salón
                    if (String(e.salon_id) !== String(salonId)) return false;

                    // No ser un evento "Reunión" del modelo antiguo
                    const isReunionTipo = e.tipo_evento && e.tipo_evento.toLowerCase().includes('reuni');
                    const isReunionTitulo = e.titulo && e.titulo.toLowerCase().includes('reuni');
                    if (isReunionTipo || isReunionTitulo) return false;

                    // Para coordinaciones NO completadas, no debe tener reunión ya agendada (se reprograma desde la agenda)
                    // Para coordinaciones completadas, permitimos volver a agendar videollamada de refuerzo/confirmación
                    const estado = (e.estado || '').toLowerCase();
                    const isCompletada = estado === 'completado' || estado === 'completada';
                    if (!isCompletada && (e.videollamada_agendada || e.videollamada_fecha)) return false;

                    return true;
                });

                // Sort by date ascending
                filtered.sort((a, b) => new Date(a.fecha_evento) - new Date(b.fecha_evento));

                setAvailableEvents(filtered);
                if (filtered.length > 0) {
                    setFormData(prev => ({ ...prev, coordinacion_id: filtered[0].id }));
                }
            } catch (err) {
                console.error("Error al obtener eventos del salón:", err);
                setError('No se pudieron cargar los eventos disponibles.');
            } finally {
                setFetchingEvents(false);
            }
        };

        if (salonId) {
            fetchEventsForSalon();
        }
    }, [salonId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.coordinacion_id) {
            setError('Debes seleccionar un evento primero.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const combinedDate = `${format(date, 'yyyy-MM-dd')}T${formData.hora}:00`;

            // Update existing coordination instead of creating a new one
            await coordinacionesAPI.update(formData.coordinacion_id, {
                videollamada_agendada: true,
                videollamada_fecha: combinedDate,
                videollamada_completada: false
            });

            if (onEventCreated) {
                onEventCreated();
            }
            onClose();
        } catch (err) {
            console.error('Error al marcar la reunión', err);
            const errorMessage = err.response?.data?.error || 'Error al vincular la reunión al evento';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Mapear eventos a opciones para CustomSelect
    const selectOptions = availableEvents.map(event => {
        const eventDate = event.fecha_evento ? format(new Date(event.fecha_evento.split('T')[0] + 'T00:00:00'), 'dd/MM/yyyy') : 'Sin Fecha';
        const clientName = event.nombre_cliente ? `${event.nombre_cliente} ${event.apellido_cliente || ''}`.trim() : 'Sin Nombre';
        const title = event.titulo || event.tipo_evento || 'Evento';
        
        const estado = (event.estado || '').toLowerCase();
        const isCompletada = estado === 'completado' || estado === 'completada';
        const statusLabel = isCompletada ? '🟢 Coordinación Completada' : '🔴 Coordinación Pendiente';
        const textColor = isCompletada ? '#10B981' : '#EF4444';

        return {
            value: event.id,
            label: `${statusLabel} | [${eventDate}] - ${title} (${clientName})`,
            color: textColor
        };
    });

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.title} style={{ color: '#4285F4' }}>Agendar Nueva Reunión</h3>

                <div className={styles.dateInfo}>
                    <strong>Día:</strong>{' '}
                    {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label>Evento a Vincular *</label>
                        {fetchingEvents ? (
                            <p style={{ color: '#666', fontSize: '14px', margin: '10px 0' }}>Cargando eventos del salón...</p>
                        ) : availableEvents.length === 0 ? (
                            <p style={{ color: '#ef4444', fontSize: '14px', margin: '10px 0' }}>No hay eventos cargados para este salón.</p>
                        ) : (
                            <CustomSelect
                                value={formData.coordinacion_id}
                                options={selectOptions}
                                onChange={(val) => setFormData({ ...formData, coordinacion_id: val })}
                                required
                                placeholder="Seleccionar coordinación..."
                            />
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Horario (Formato 24hs) *</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <CustomSelect
                                    value={formData.hora.split(':')[0]}
                                    options={HOURS}
                                    onChange={(h) => {
                                        const mins = formData.hora.split(':')[1] || '00';
                                        setFormData({ ...formData, hora: `${h}:${mins}` });
                                    }}
                                    placeholder="HH"
                                />
                            </div>
                            <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#772c87' }}>:</span>
                            <div style={{ flex: 1 }}>
                                <CustomSelect
                                    value={formData.hora.split(':')[1] || '00'}
                                    options={MINUTES}
                                    onChange={(m) => {
                                        const hrs = formData.hora.split(':')[0] || '15';
                                        setFormData({ ...formData, hora: `${hrs}:${m}` });
                                    }}
                                    placeholder="MM"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <LoadingButton
                            type="submit"
                            className={styles.confirmButton}
                            style={{ background: 'linear-gradient(135deg, #4285F4 0%, #1967D2 100%)' }}
                            loading={loading}
                            disabled={availableEvents.length === 0 || fetchingEvents}
                        >
                            Vincular y Agendar
                        </LoadingButton>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.cancelButton}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

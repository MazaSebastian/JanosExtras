import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { coordinacionesAPI, disponibilidadBloquesAPI } from '@/services/api';
import { LoadingButton } from '@/components/Loading';
import CustomSelect from '@/components/CustomSelect';
import styles from '@/styles/EventMarker.module.css';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

export default function ReunionMarker({ date, salonId, djId, onEventCreated, onClose }) {
    const [loading, setLoading] = useState(false);
    const [fetchingEvents, setFetchingEvents] = useState(true);
    const [allEvents, setAllEvents] = useState([]);
    const [showCompleted, setShowCompleted] = useState(false);
    const [error, setError] = useState('');
    const [bloques, setBloques] = useState([]);
    const [loadingBloques, setLoadingBloques] = useState(false);
    const [selectedBloqueId, setSelectedBloqueId] = useState(null);
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

                    return true;
                });

                // Sort by date ascending
                filtered.sort((a, b) => new Date(a.fecha_evento) - new Date(b.fecha_evento));

                setAllEvents(filtered);
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

    // Identificar si una coordinación está completada o cargada (verde)
    const isEventCompleted = (e) => {
        const estado = (e.estado || '').toLowerCase();
        return estado === 'completado' || estado === 'completada' || estado === 'cargado' || estado === 'cargada';
    };

    // Eventos disponibles según el filtro inteligente:
    // Por defecto, se ocultan todas las coordinaciones ya cargadas/completadas (verdes)
    // y las pendientes que ya tienen reunión agendada.
    const availableEvents = useMemo(() => {
        return allEvents.filter(e => {
            const completada = isEventCompleted(e);

            if (completada) {
                // Solo incluir si el usuario activó explícitamente ver completadas
                return showCompleted;
            }

            // Para coordinaciones pendientes/en proceso, no debe tener reunión ya agendada
            if (e.videollamada_agendada || e.videollamada_fecha) {
                return false;
            }

            return true;
        });
    }, [allEvents, showCompleted]);

    // Contar cuántas coordinaciones completadas existen para este salón
    const completedCount = useMemo(() => {
        return allEvents.filter(e => isEventCompleted(e)).length;
    }, [allEvents]);

    // Mantener la selección válida al cambiar la lista
    useEffect(() => {
        if (availableEvents.length > 0) {
            const currentExists = availableEvents.some(e => e.id === formData.coordinacion_id);
            if (!currentExists) {
                setFormData(prev => ({ ...prev, coordinacion_id: availableEvents[0].id }));
            }
        } else {
            setFormData(prev => ({ ...prev, coordinacion_id: '' }));
        }
    }, [availableEvents]);

    const dateStr = date ? format(date, 'yyyy-MM-dd') : '';

    useEffect(() => {
        const fetchBloques = async () => {
            if (!dateStr) return;
            try {
                setLoadingBloques(true);
                const res = await disponibilidadBloquesAPI.getByFecha(dateStr, { salon_id: salonId });
                const bList = res.data?.bloques || [];
                setBloques(bList);
                // Si hay bloques libres, auto-seleccionar el primero disponible
                const primerLibre = bList.find(b => b.estado === 'disponible');
                if (primerLibre) {
                    setSelectedBloqueId(primerLibre.id);
                    setFormData(prev => ({ ...prev, hora: primerLibre.hora_inicio }));
                }
            } catch (err) {
                console.error('Error cargando bloques para el día en ReunionMarker:', err);
            } finally {
                setLoadingBloques(false);
            }
        };

        fetchBloques();
    }, [dateStr, salonId]);

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
                videollamada_completada: false,
                bloque_id: selectedBloqueId || undefined
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
        
        const completada = isEventCompleted(event);
        const estado = (event.estado || '').toLowerCase();
        const enProceso = estado === 'en_proceso' || Boolean(event.pre_coordinacion_completado_por_cliente);

        let statusLabel = '🔴 Coordinación Pendiente';
        let textColor = '#EF4444';

        if (completada) {
            statusLabel = '🟢 Coordinación Completada';
            textColor = '#10B981';
        } else if (enProceso) {
            statusLabel = '🟡 Coordinación En Proceso';
            textColor = '#F59E0B';
        }

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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ margin: 0 }}>Evento a Vincular *</label>
                            {completedCount > 0 && (
                                <label style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '6px', 
                                    fontSize: '12px', 
                                    color: '#64748b', 
                                    cursor: 'pointer',
                                    fontWeight: 'normal',
                                    userSelect: 'none'
                                }}>
                                    <input 
                                        type="checkbox" 
                                        checked={showCompleted} 
                                        onChange={(e) => setShowCompleted(e.target.checked)} 
                                        style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
                                    />
                                    Ver completadas ({completedCount})
                                </label>
                            )}
                        </div>

                        {fetchingEvents ? (
                            <p style={{ color: '#666', fontSize: '14px', margin: '10px 0' }}>Cargando eventos del salón...</p>
                        ) : availableEvents.length === 0 ? (
                            <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', margin: '10px 0' }}>
                                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                                    {completedCount > 0 && !showCompleted
                                        ? `No hay coordinaciones pendientes para vincular en este salón (${completedCount} ya completadas).`
                                        : 'No hay eventos cargados para este salón.'}
                                </p>
                                {completedCount > 0 && !showCompleted && (
                                    <button
                                        type="button"
                                        onClick={() => setShowCompleted(true)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#4285F4',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            padding: 0,
                                            marginTop: '6px',
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        Mostrar las {completedCount} completadas
                                    </button>
                                )}
                            </div>
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

                    {/* Bloques de Disponibilidad para este día */}
                    <div className={styles.formGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ margin: 0, fontWeight: '600' }}>
                                Bloques de Horarios Disponibles
                            </label>
                            {loadingBloques && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Cargando...</span>}
                        </div>

                        {bloques.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                {bloques.map((b) => {
                                    const isOcupado = b.estado === 'ocupado';
                                    const isSelected = selectedBloqueId === b.id;
                                    return (
                                        <button
                                            key={b.id}
                                            type="button"
                                            disabled={isOcupado}
                                            onClick={() => {
                                                setSelectedBloqueId(b.id);
                                                setFormData(prev => ({ ...prev, hora: b.hora_inicio }));
                                            }}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                border: isSelected ? '2px solid #4285F4' : '1px solid #cbd5e1',
                                                background: isOcupado 
                                                    ? '#fee2e2' 
                                                    : isSelected 
                                                    ? '#eff6ff' 
                                                    : '#ffffff',
                                                color: isOcupado ? '#991b1b' : isSelected ? '#1d4ed8' : '#334155',
                                                fontWeight: isSelected ? '700' : '500',
                                                cursor: isOcupado ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '0.88rem',
                                                transition: 'all 0.15s'
                                            }}
                                            title={isOcupado ? `Horario ocupado por ${b.nombre_cliente || 'otro cliente'}` : 'Seleccionar este bloque de horario'}
                                        >
                                            <span>{isOcupado ? '🔒' : isSelected ? '✅' : '🟢'}</span>
                                            <span>{b.hora_inicio} hs</span>
                                            {isOcupado && <span style={{ fontSize: '0.75rem' }}>(Ocupado)</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p style={{ margin: '0 0 10px 0', fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>
                                ℹ️ No hay bloques pre-configurados para este día. Puedes elegir la hora abajo directamente.
                            </p>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Horario Seleccionado (Formato 24hs) *</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <CustomSelect
                                    value={formData.hora.split(':')[0]}
                                    options={HOURS}
                                    onChange={(h) => {
                                        const mins = formData.hora.split(':')[1] || '00';
                                        setSelectedBloqueId(null);
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
                                        setSelectedBloqueId(null);
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

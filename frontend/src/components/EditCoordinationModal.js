import { useState } from 'react';
import { coordinacionesAPI } from '@/services/api';
import CustomSelect from '@/components/CustomSelect';
import styles from '@/styles/EditCoordinationModal.module.css';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

function parseInitialVideollamada(fechaStr) {
    if (!fechaStr) return { fecha: '', hora: '15', minuto: '00' };

    if (typeof fechaStr === 'string' && fechaStr.includes('T')) {
        const [datePart, timePart] = fechaStr.split('T');
        const timeComponents = (timePart || '').split(':');
        const hh = timeComponents[0] || '15';
        const mm = timeComponents[1] || '00';
        return {
            fecha: datePart,
            hora: String(hh).padStart(2, '0'),
            minuto: String(mm).substring(0, 2).padStart(2, '0')
        };
    }
    const dateObj = new Date(fechaStr);
    if (!isNaN(dateObj.getTime())) {
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const hh = String(dateObj.getHours()).padStart(2, '0');
        const min = String(dateObj.getMinutes()).padStart(2, '0');
        return { fecha: `${yyyy}-${mm}-${dd}`, hora: hh, minuto: min };
    }
    return { fecha: '', hora: '15', minuto: '00' };
}

export default function EditCoordinationModal({ coordinacion, onClose, onSave }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const initialMeeting = parseInitialVideollamada(coordinacion?.videollamada_fecha);

    const [formData, setFormData] = useState({
        nombre_cliente: coordinacion?.nombre_cliente || '',
        apellido_cliente: coordinacion?.apellido_cliente || '',
        nombre_agasajado: coordinacion?.nombre_agasajado || '',
        telefono: coordinacion?.telefono || '',
        tipo_evento: coordinacion?.tipo_evento || '',
        codigo_evento: coordinacion?.codigo_evento || '',
        videollamada_agendada: coordinacion?.videollamada_agendada ?? false,
        videollamada_fecha_dia: initialMeeting.fecha,
        videollamada_hora: initialMeeting.hora,
        videollamada_minuto: initialMeeting.minuto,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError('');

            const nombreCompleto = `${formData.nombre_cliente} ${formData.apellido_cliente}`.trim();
            const payload = {
                titulo: `${formData.tipo_evento} - ${nombreCompleto}`,
                nombre_cliente: formData.nombre_cliente || null,
                apellido_cliente: formData.apellido_cliente || null,
                nombre_agasajado: formData.tipo_evento !== 'Corporativo' ? formData.nombre_agasajado : null,
                telefono: formData.telefono || null,
                tipo_evento: formData.tipo_evento || null,
                codigo_evento: formData.codigo_evento || null,
            };

            if (formData.videollamada_fecha_dia) {
                payload.videollamada_agendada = true;
                payload.videollamada_fecha = `${formData.videollamada_fecha_dia}T${formData.videollamada_hora}:${formData.videollamada_minuto}:00`;
            }

            await coordinacionesAPI.update(coordinacion.id, payload);

            if (onSave) {
                onSave();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Error al actualizar los datos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.title}>✏️ Editar Datos y Reunión</h3>
                <p className={styles.subtitle}>Modificá la fecha y hora de la reunión o los datos de la coordinación</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div style={{ background: '#f4effa', padding: '16px', borderRadius: '12px', border: '1px solid #e1d4f0', marginBottom: '8px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#772c87', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            ⏰ Horario y Fecha de la Reunión
                        </h4>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label style={{ color: '#555' }}>Fecha de la Reunión</label>
                                <input
                                    type="date"
                                    value={formData.videollamada_fecha_dia}
                                    onChange={(e) => setFormData({ ...formData, videollamada_fecha_dia: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label style={{ color: '#555' }}>Horario (HH:MM)</label>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <CustomSelect
                                            value={formData.videollamada_hora}
                                            options={HOURS}
                                            onChange={(h) => setFormData({ ...formData, videollamada_hora: h })}
                                            placeholder="HH"
                                        />
                                    </div>
                                    <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#772c87' }}>:</span>
                                    <div style={{ flex: 1 }}>
                                        <CustomSelect
                                            value={formData.videollamada_minuto}
                                            options={MINUTES}
                                            onChange={(m) => setFormData({ ...formData, videollamada_minuto: m })}
                                            placeholder="MM"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Nombre *</label>
                            <input
                                type="text"
                                value={formData.nombre_cliente}
                                onChange={(e) => setFormData({ ...formData, nombre_cliente: e.target.value })}
                                required
                                placeholder="Nombre del cliente"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Apellido</label>
                            <input
                                type="text"
                                value={formData.apellido_cliente}
                                onChange={(e) => setFormData({ ...formData, apellido_cliente: e.target.value })}
                                placeholder="Apellido del cliente"
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Teléfono</label>
                            <input
                                type="tel"
                                value={formData.telefono}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                placeholder="Ej: 5491122334455"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Tipo de Evento *</label>
                            <CustomSelect
                                value={formData.tipo_evento}
                                options={['XV', 'Casamiento', 'Corporativo', 'Religioso', 'Cumpleaños']}
                                onChange={(val) => setFormData({ ...formData, tipo_evento: val })}
                                required
                            />
                        </div>
                    </div>

                    {formData.tipo_evento && formData.tipo_evento !== 'Corporativo' && (
                        <div className={styles.formGroup}>
                            <label>Nombre del Agasajado/a {formData.tipo_evento === 'XV' || formData.tipo_evento === 'Religioso' ? '*' : ''}</label>
                            <input
                                type="text"
                                value={formData.nombre_agasajado}
                                onChange={(e) => setFormData({ ...formData, nombre_agasajado: e.target.value })}
                                required={formData.tipo_evento === 'XV' || formData.tipo_evento === 'Religioso'}
                                placeholder="Nombre de/los protagonista/s"
                            />
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label>Código de Evento</label>
                        <input
                            type="text"
                            value={formData.codigo_evento}
                            onChange={(e) => setFormData({ ...formData, codigo_evento: e.target.value })}
                            placeholder="Código del evento (opcional)"
                        />
                    </div>

                    <div className={styles.actions}>
                        <button type="submit" className={styles.submitButton} disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                        <button type="button" className={styles.cancelButton} onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

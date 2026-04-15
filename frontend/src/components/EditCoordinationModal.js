import { useState } from 'react';
import { coordinacionesAPI } from '@/services/api';
import CustomSelect from '@/components/CustomSelect';
import styles from '@/styles/EditCoordinationModal.module.css';

export default function EditCoordinationModal({ coordinacion, onClose, onSave }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        nombre_cliente: coordinacion?.nombre_cliente || '',
        apellido_cliente: coordinacion?.apellido_cliente || '',
        nombre_agasajado: coordinacion?.nombre_agasajado || '',
        telefono: coordinacion?.telefono || '',
        tipo_evento: coordinacion?.tipo_evento || '',
        codigo_evento: coordinacion?.codigo_evento || '',
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
        <div className={styles.overlay}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.title}>✏️ Editar Datos</h3>
                <p className={styles.subtitle}>Modificá la información de la coordinación actual</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
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

                    {formData.tipo_evento !== 'Corporativo' && (
                        <div className={styles.formGroup}>
                            <label>Nombre del Agasajado/a</label>
                            <input
                                type="text"
                                value={formData.nombre_agasajado}
                                onChange={(e) => setFormData({ ...formData, nombre_agasajado: e.target.value })}
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

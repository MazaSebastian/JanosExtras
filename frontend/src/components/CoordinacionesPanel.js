import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { coordinacionesAPI, salonesAPI, authAPI } from '@/services/api';
import { SkeletonCard } from '@/components/Loading';
import styles from '@/styles/CoordinacionesPanel.module.css';

export default function CoordinacionesPanel() {
  const router = useRouter();
  const [coordinaciones, setCoordinaciones] = useState([]);
  const [salones, setSalones] = useState([]);
  const [djs, setDjs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    nombre_cliente: '',
    tipo_evento: '',
    codigo_evento: '',
    fecha_evento: '',
    descripcion: '',
    hora_evento: '',
    salon_id: '',
    dj_responsable_id: '',
    estado: 'pendiente',
    prioridad: 'normal',
    notas: '',
  });
  const [filterEstado, setFilterEstado] = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState('');
  const [playMenuOpen, setPlayMenuOpen] = useState(null);
  const [loadingSalones, setLoadingSalones] = useState(false);

  // Cargar coordinaciones al montar y cuando cambian los filtros
  useEffect(() => {
    loadCoordinaciones();
  }, [filterEstado, filterPrioridad]);

  // Cargar salones solo cuando se abre el modal
  useEffect(() => {
    if (showForm && salones.length === 0) {
      loadSalones();
    }
  }, [showForm]);

  // Cerrar menú Play al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (playMenuOpen && !event.target.closest(`.${styles.playMenuContainer}`)) {
        setPlayMenuOpen(null);
      }
    };
    if (playMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [playMenuOpen]);

  const loadCoordinaciones = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { activo: true };
      if (filterEstado) params.estado = filterEstado;
      if (filterPrioridad) params.prioridad = filterPrioridad;
      const response = await coordinacionesAPI.getAll(params);
      setCoordinaciones(response.data || []);
    } catch (err) {
      console.error('Error al cargar coordinaciones:', err);
      setError('No se pudieron cargar las coordinaciones.');
    } finally {
      setLoading(false);
    }
  };

  const loadSalones = useCallback(async () => {
    if (salones.length > 0) return; // Ya están cargados
    try {
      setLoadingSalones(true);
      const response = await salonesAPI.getAll();
      setSalones(response.data || []);
    } catch (err) {
      console.error('Error al cargar salones:', err);
    } finally {
      setLoadingSalones(false);
    }
  }, [salones.length]);

  const loadDJs = async () => {
    try {
      // Obtener DJs desde el perfil o crear un endpoint si es necesario
      // Por ahora, usaremos una lista vacía y se puede expandir
      setDjs([]);
    } catch (err) {
      console.error('Error al cargar DJs:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const data = {
        ...formData,
        titulo: formData.titulo || null, // Título opcional
        salon_id: formData.salon_id || null,
        dj_responsable_id: formData.dj_responsable_id || null,
      };
      if (editingId) {
        await coordinacionesAPI.update(editingId, data);
      } else {
        await coordinacionesAPI.create(data);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        titulo: '',
        nombre_cliente: '',
        tipo_evento: '',
        codigo_evento: '',
        fecha_evento: '',
        descripcion: '',
        hora_evento: '',
        salon_id: '',
        dj_responsable_id: '',
        estado: 'pendiente',
        prioridad: 'normal',
        notas: '',
      });
      loadCoordinaciones();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la coordinación.');
    }
  };

  const handleEdit = useCallback((item) => {
    setFormData({
      titulo: item.titulo,
      nombre_cliente: item.nombre_cliente || '',
      tipo_evento: item.tipo_evento || '',
      codigo_evento: item.codigo_evento || '',
      fecha_evento: item.fecha_evento ? format(new Date(item.fecha_evento), 'yyyy-MM-dd') : '',
      descripcion: item.descripcion || '',
      hora_evento: item.hora_evento || '',
      salon_id: item.salon_id ? String(item.salon_id) : '',
      dj_responsable_id: item.dj_responsable_id ? String(item.dj_responsable_id) : '',
      estado: item.estado || 'pendiente',
      prioridad: item.prioridad || 'normal',
      notas: item.notas || '',
    });
    setEditingId(item.id);
    setShowForm(true);
    // Cargar salones si no están cargados
    if (salones.length === 0) {
      loadSalones();
    }
  }, [salones.length, loadSalones]);

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta coordinación?')) {
      return;
    }
    try {
      await coordinacionesAPI.delete(id);
      loadCoordinaciones();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar la coordinación.');
    }
  };

  const handleIniciarCoordinacion = async (id) => {
    try {
      // Buscar la coordinación para obtener el tipo de evento
      const coordinacion = coordinaciones.find(c => c.id === id);
      
      // Verificar si la coordinación está completada
      if (coordinacion.estado === 'completado' || coordinacion.estado === 'completada') {
        setError('No se puede iniciar una coordinación que ya está completada.');
        setPlayMenuOpen(null);
        return;
      }
      
      if (!coordinacion || !coordinacion.tipo_evento) {
        setError('La coordinación debe tener un tipo de evento definido.');
        setPlayMenuOpen(null);
        return;
      }

      // Actualizar estado a "en_proceso"
      await coordinacionesAPI.update(id, { estado: 'en_proceso' });
      setPlayMenuOpen(null);
      
      // Redirigir a la página del flujo de coordinación
      router.push(`/dashboard/coordinaciones/${id}/iniciar`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar la coordinación.');
      setPlayMenuOpen(null);
    }
  };

  const handleEnviarPreCoordinacion = async (id) => {
    try {
      // Aquí se puede implementar la lógica para enviar pre-coordinación
      // Por ahora, solo mostramos un mensaje
      setPlayMenuOpen(null);
      alert('Función "Enviar Pre-Coordinación" en desarrollo. Se enviará un email/notificación con los detalles de la coordinación.');
      // TODO: Implementar envío de pre-coordinación
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar la pre-coordinación.');
      setPlayMenuOpen(null);
    }
  };

  const togglePlayMenu = (id) => {
    setPlayMenuOpen(playMenuOpen === id ? null : id);
  };

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (playMenuOpen && !event.target.closest(`.${styles.playMenuContainer}`)) {
        setPlayMenuOpen(null);
      }
    };
    if (playMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [playMenuOpen]);

  const getEstadoColor = (estado) => {
    const colors = {
      pendiente: '#ff9800',
      en_proceso: '#2196f3',
      completada: '#4caf50',
      completado: '#4caf50', // Verde para "Completado"
      cancelada: '#f44336',
    };
    return colors[estado] || '#999';
  };

  const getPrioridadColor = (prioridad) => {
    const colors = {
      baja: '#9e9e9e',
      normal: '#2196f3',
      alta: '#ff9800',
      urgente: '#f44336',
    };
    return colors[prioridad] || '#999';
  };

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <p className={styles.subtitle}>Comunicación y organización</p>
          <h3 className={styles.title}>Coordinaciones</h3>
        </div>
        <button
          type="button"
          className={styles.addButton}
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            // Cargar salones si no están cargados
            if (salones.length === 0) {
              loadSalones();
            }
            setFormData({
              titulo: '',
              descripcion: '',
              fecha_evento: '',
              hora_evento: '',
              salon_id: '',
              dj_responsable_id: '',
              estado: 'pendiente',
              prioridad: 'normal',
              notas: '',
            });
          }}
        >
          + Nueva Coordinación
        </button>
      </header>

      {error && (
        <div className={styles.error}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <div className={styles.formModal}>
          <div className={styles.formContent}>
            <h4>{editingId ? 'Editar Coordinación' : 'Nueva Coordinación'}</h4>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Nombre del Cliente *</label>
                <input
                  type="text"
                  value={formData.nombre_cliente}
                  onChange={(e) => setFormData({ ...formData, nombre_cliente: e.target.value })}
                  required
                  placeholder="Ingrese el nombre del cliente"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Fecha del Evento *</label>
                <input
                  type="date"
                  value={formData.fecha_evento}
                  onChange={(e) => setFormData({ ...formData, fecha_evento: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Tipo de Evento *</label>
                <select
                  value={formData.tipo_evento}
                  onChange={(e) => setFormData({ ...formData, tipo_evento: e.target.value })}
                  required
                >
                  <option value="">Seleccionar tipo de evento</option>
                  <option value="XV">XV</option>
                  <option value="Casamiento">Casamiento</option>
                  <option value="Corporativo">Corporativo</option>
                  <option value="Religioso">Religioso</option>
                  <option value="Cumpleaños">Cumpleaños</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Código de Evento</label>
                <input
                  type="text"
                  value={formData.codigo_evento}
                  onChange={(e) => setFormData({ ...formData, codigo_evento: e.target.value })}
                  placeholder="Ingrese el código del evento"
                />
              </div>
              {editingId && (
                <>
                  <div className={styles.formGroup}>
                    <label>Título</label>
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      placeholder="Título de la coordinación"
                    />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Hora</label>
                      <input
                        type="time"
                        value={formData.hora_evento}
                        onChange={(e) => setFormData({ ...formData, hora_evento: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Salón</label>
                      <select
                        value={formData.salon_id}
                        onChange={(e) => setFormData({ ...formData, salon_id: e.target.value })}
                      >
                        <option value="">Seleccionar salón</option>
                        {salones.map((salon) => (
                          <option key={salon.id} value={salon.id}>
                            {salon.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Estado</label>
                      <select
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="completada">Completada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Prioridad</label>
                      <select
                        value={formData.prioridad}
                        onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                      >
                        <option value="baja">Baja</option>
                        <option value="normal">Normal</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>DJ Responsable</label>
                    <input
                      type="text"
                      value={formData.dj_responsable_id}
                      onChange={(e) => setFormData({ ...formData, dj_responsable_id: e.target.value })}
                      placeholder="ID del DJ (opcional)"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Descripción</label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      rows="4"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Notas</label>
                    <textarea
                      value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                      rows="3"
                      placeholder="Notas adicionales..."
                    />
                  </div>
                </>
              )}
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton}>
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      titulo: '',
                      nombre_cliente: '',
                      tipo_evento: '',
                      codigo_evento: '',
                      fecha_evento: '',
                      descripcion: '',
                      hora_evento: '',
                      salon_id: '',
                      dj_responsable_id: '',
                      estado: 'pendiente',
                      prioridad: 'normal',
                      notas: '',
                    });
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <button
          type="button"
          className={!filterEstado ? styles.filterActive : styles.filterButton}
          onClick={() => setFilterEstado('')}
        >
          Todos los Estados
        </button>
        <button
          type="button"
          className={filterEstado === 'pendiente' ? styles.filterActive : styles.filterButton}
          onClick={() => setFilterEstado('pendiente')}
        >
          Pendientes
        </button>
        <button
          type="button"
          className={filterEstado === 'en_proceso' ? styles.filterActive : styles.filterButton}
          onClick={() => setFilterEstado('en_proceso')}
        >
          En Proceso
        </button>
        <button
          type="button"
          className={filterEstado === 'completada' ? styles.filterActive : styles.filterButton}
          onClick={() => setFilterEstado('completada')}
        >
          Completadas
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <select
            value={filterPrioridad}
            onChange={(e) => setFilterPrioridad(e.target.value)}
            className={styles.priorityFilter}
          >
            <option value="">Todas las Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="normal">Normal</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonCard count={5} />
      ) : coordinaciones.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay coordinaciones disponibles. ¡Crea la primera!</p>
        </div>
      ) : (
        <div className={styles.list}>
          {coordinaciones.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={styles.cardTitleRow}>
                    <h4>{item.titulo}</h4>
                    <div className={styles.cardMetaInfo}>
                      {item.fecha_evento && (
                        <span className={styles.metaItem}>
                          📅 Fecha del Evento: {format(new Date(item.fecha_evento), "dd/MM/yyyy", { locale: es })}
                        </span>
                      )}
                      {item.tipo_evento && (
                        <span className={styles.metaItem}>
                          🎉 Tipo: {item.tipo_evento}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.badges}>
                    <span
                      className={styles.badge}
                      style={{ backgroundColor: getEstadoColor(item.estado) }}
                    >
                      {item.estado.replace('_', ' ').toUpperCase()}
                    </span>
                    {item.prioridad && item.prioridad !== 'normal' && (
                      <span
                        className={styles.badge}
                        style={{ backgroundColor: getPrioridadColor(item.prioridad) }}
                      >
                        {item.prioridad.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <div className={styles.playMenuContainer}>
                    <button
                      type="button"
                      className={`${styles.playButton} ${(item.estado === 'completado' || item.estado === 'completada') ? styles.playButtonDisabled : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.estado === 'completado' || item.estado === 'completada') {
                          return;
                        }
                        togglePlayMenu(item.id);
                      }}
                      disabled={item.estado === 'completado' || item.estado === 'completada'}
                    >
                      ▶️
                    </button>
                    {playMenuOpen === item.id && (
                      <div className={styles.playMenu}>
                        <button
                          type="button"
                          className={`${styles.playMenuItem} ${(item.estado === 'completado' || item.estado === 'completada') ? styles.playMenuItemDisabled : ''}`}
                          onClick={() => handleIniciarCoordinacion(item.id)}
                          disabled={item.estado === 'completado' || item.estado === 'completada'}
                        >
                          Iniciar Coordinación
                        </button>
                        <button
                          type="button"
                          className={styles.playMenuItem}
                          onClick={() => handleEnviarPreCoordinacion(item.id)}
                        >
                          Enviar Pre-Coordinación
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.editButton}
                    onClick={() => handleEdit(item)}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => handleDelete(item.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              {item.descripcion && <p className={styles.description}>{item.descripcion}</p>}
              <div className={styles.cardDetails}>
                {item.codigo_evento && (
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>🔢 Código:</span>
                    <span><strong>{item.codigo_evento}</strong></span>
                  </div>
                )}
                {item.hora_evento && (
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>🕐 Hora:</span>
                    <span>{item.hora_evento}</span>
                  </div>
                )}
                {item.salon_nombre && (
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>🏢 Salón:</span>
                    <span>{item.salon_nombre}</span>
                  </div>
                )}
                {item.dj_responsable_nombre && (
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>👤 Responsable:</span>
                    <span>{item.dj_responsable_nombre}</span>
                  </div>
                )}
              </div>
              {item.notas && (
                <div className={styles.notas}>
                  <strong>Notas:</strong> {item.notas}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


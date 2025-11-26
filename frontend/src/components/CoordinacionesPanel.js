import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { coordinacionesAPI, salonesAPI, authAPI } from '@/services/api';
import { getAuth } from '@/utils/auth';
import { SkeletonCard } from '@/components/Loading';
import styles from '@/styles/CoordinacionesPanel.module.css';
import { FLUJOS_POR_TIPO } from '@/components/CoordinacionFlujo';

export default function CoordinacionesPanel() {
  const router = useRouter();
  const [user, setUser] = useState(null);
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
  const [viewingResumen, setViewingResumen] = useState(null);
  const [resumenData, setResumenData] = useState(null);

  // Cargar información del usuario
  useEffect(() => {
    const auth = getAuth();
    if (auth?.user) {
      setUser(auth.user);
    }
  }, []);
  const [loadingResumen, setLoadingResumen] = useState(false);

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
      };
      
      // Solo incluir dj_responsable_id si el usuario es admin
      // Para DJs, el backend lo asignará automáticamente
      if (user?.rol === 'admin' && formData.dj_responsable_id) {
        data.dj_responsable_id = formData.dj_responsable_id || null;
      }
      
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

  const handleGenerarPreCoordinacion = async (id) => {
    try {
      setGenerandoPreCoordinacion(true);
      setError('');
      setPlayMenuOpen(null);

      const response = await coordinacionesAPI.generarPreCoordinacion(id);
      
      if (response.data.success) {
        setPreCoordinacionUrl(response.data.url);
        setShowPreCoordinacionModal(true);
        
        // Recargar coordinaciones para actualizar el estado
        loadCoordinaciones();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar la pre-coordinación.');
    } finally {
      setGenerandoPreCoordinacion(false);
    }
  };

  const copiarUrl = () => {
    navigator.clipboard.writeText(preCoordinacionUrl).then(() => {
      alert('¡URL copiada al portapapeles! Ahora puedes compartirla con tu cliente.');
    }).catch(() => {
      // Fallback para navegadores que no soportan clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = preCoordinacionUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('¡URL copiada al portapapeles!');
    });
  };

  const togglePlayMenu = (id) => {
    setPlayMenuOpen(playMenuOpen === id ? null : id);
  };

  const handleVerResumen = async (coordinacion) => {
    try {
      setLoadingResumen(true);
      setViewingResumen(coordinacion.id);
      
      // Cargar el flujo de coordinación si existe
      let flujo = null;
      try {
        const flujoResponse = await coordinacionesAPI.getFlujo(coordinacion.id);
        flujo = flujoResponse.data || flujoResponse;
      } catch (err) {
        // Si no existe flujo, no es un error, simplemente no hay datos del flujo
        console.log('No se encontró flujo de coordinación para esta coordinación');
      }
      
      setResumenData({
        coordinacion,
        flujo,
      });
    } catch (err) {
      console.error('Error al cargar resumen:', err);
      setError('Error al cargar el resumen de la coordinación.');
      setViewingResumen(null);
    } finally {
      setLoadingResumen(false);
    }
  };

  const closeResumenModal = () => {
    setViewingResumen(null);
    setResumenData(null);
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
                        <option value="completado">Completada</option>
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
                  {user?.rol === 'admin' && (
                    <div className={styles.formGroup}>
                      <label>DJ Responsable</label>
                      <input
                        type="text"
                        value={formData.dj_responsable_id}
                        onChange={(e) => setFormData({ ...formData, dj_responsable_id: e.target.value })}
                        placeholder="ID del DJ (opcional, se asignará automáticamente si se deja vacío)"
                      />
                    </div>
                  )}
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
          className={filterEstado === 'completado' ? styles.filterActive : styles.filterButton}
          onClick={() => setFilterEstado('completado')}
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
                          onClick={() => {
                            if (item.pre_coordinacion_url) {
                              setPreCoordinacionUrl(item.pre_coordinacion_url);
                              setShowPreCoordinacionModal(true);
                            } else {
                              handleGenerarPreCoordinacion(item.id);
                            }
                          }}
                          disabled={generandoPreCoordinacion || !item.tipo_evento}
                          title={!item.tipo_evento ? 'La coordinación debe tener un tipo de evento' : ''}
                        >
                          {generandoPreCoordinacion ? 'Generando...' : item.pre_coordinacion_url ? 'Ver Link de Pre-Coordinación' : 'Generar Pre-Coordinación'}
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.viewButton}
                    onClick={() => handleVerResumen(item)}
                    title="Ver Coordinación"
                  >
                    👁️
                  </button>
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
                {item.pre_coordinacion_completado_por_cliente && (
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>✅ Pre-Coordinación:</span>
                    <span style={{ color: '#4caf50', fontWeight: 600 }}>Completada por cliente</span>
                  </div>
                )}
                {item.pre_coordinacion_url && !item.pre_coordinacion_completado_por_cliente && (
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>📋 Pre-Coordinación:</span>
                    <span style={{ color: '#ff9800', fontWeight: 600 }}>Pendiente de completar</span>
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

      {/* Modal de Pre-Coordinación */}
      {showPreCoordinacionModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPreCoordinacionModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Link de Pre-Coordinación</h2>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={() => setShowPreCoordinacionModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                Comparte este link con tu cliente para que complete la información del evento antes de la reunión.
              </p>
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginBottom: '1rem',
                padding: '1rem',
                background: '#f5f5f5',
                borderRadius: '8px',
                wordBreak: 'break-all'
              }}>
                <input
                  type="text"
                  value={preCoordinacionUrl}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                />
                <button
                  type="button"
                  onClick={copiarUrl}
                  className={styles.saveButton}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  📋 Copiar
                </button>
              </div>
              {preCoordinacionUrl && (
                <div style={{ 
                  padding: '1rem', 
                  background: '#e8f5e9', 
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: '#2e7d32'
                }}>
                  <strong>💡 Tip:</strong> Puedes copiar este link y enviarlo por WhatsApp, email o cualquier medio a tu cliente.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resumen de Coordinación */}
      {viewingResumen && (
        <div className={styles.modalOverlay} onClick={closeResumenModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Resumen de Coordinación</h2>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={closeResumenModal}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              {loadingResumen ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>Cargando resumen...</p>
                </div>
              ) : resumenData ? (
                <div className={styles.resumenContainer}>
                  <div className={styles.resumenSeccion}>
                    <h3 className={styles.resumenSeccionTitulo}>Información General</h3>
                    <div className={styles.resumenCampo}>
                      <span className={styles.resumenLabel}>Cliente:</span>
                      <span className={styles.resumenValor}>
                        {resumenData.coordinacion?.nombre_cliente || 'N/A'}
                      </span>
                    </div>
                    <div className={styles.resumenCampo}>
                      <span className={styles.resumenLabel}>Tipo de Evento:</span>
                      <span className={styles.resumenValor}>
                        {resumenData.coordinacion?.tipo_evento || 'N/A'}
                      </span>
                    </div>
                    {resumenData.coordinacion?.codigo_evento && (
                      <div className={styles.resumenCampo}>
                        <span className={styles.resumenLabel}>Código de Evento:</span>
                        <span className={styles.resumenValor}>
                          {resumenData.coordinacion.codigo_evento}
                        </span>
                      </div>
                    )}
                    {resumenData.coordinacion?.fecha_evento && (
                      <div className={styles.resumenCampo}>
                        <span className={styles.resumenLabel}>Fecha del Evento:</span>
                        <span className={styles.resumenValor}>
                          {format(
                            new Date(resumenData.coordinacion.fecha_evento),
                            'dd/MM/yyyy',
                            { locale: es }
                          )}
                        </span>
                      </div>
                    )}
                    {resumenData.coordinacion?.salon_nombre && (
                      <div className={styles.resumenCampo}>
                        <span className={styles.resumenLabel}>Salón:</span>
                        <span className={styles.resumenValor}>
                          {resumenData.coordinacion.salon_nombre}
                        </span>
                      </div>
                    )}
                  </div>

                  {resumenData.flujo && resumenData.flujo.respuestas ? (
                    (() => {
                      const tipoEvento = resumenData.coordinacion?.tipo_evento?.trim();
                      const pasos = tipoEvento ? FLUJOS_POR_TIPO[tipoEvento] || [] : [];
                      const respuestas = resumenData.flujo.respuestas;

                      return pasos.map((paso) => {
                        const tieneRespuestas = paso.preguntas.some((p) => {
                          const esCondicional = p.condicional && p.condicional.pregunta;
                          const debeMostrar =
                            !esCondicional ||
                            respuestas[p.condicional.pregunta] === p.condicional.valor;
                          if (!debeMostrar) return false;
                          const valor = respuestas[p.id];
                          return (
                            valor !== undefined &&
                            valor !== null &&
                            valor !== '' &&
                            (p.tipo !== 'velas' || (Array.isArray(valor) && valor.length > 0))
                          );
                        });

                        if (!tieneRespuestas) return null;

                        return (
                          <div key={paso.id} className={styles.resumenSeccion}>
                            <h3 className={styles.resumenSeccionTitulo}>{paso.titulo}</h3>
                            {paso.preguntas.map((pregunta) => {
                              const esCondicional =
                                pregunta.condicional && pregunta.condicional.pregunta;
                              const debeMostrar =
                                !esCondicional ||
                                respuestas[pregunta.condicional.pregunta] ===
                                  pregunta.condicional.valor;

                              if (!debeMostrar) return null;

                              const valor = respuestas[pregunta.id];

                              if (
                                pregunta.tipo === 'velas' &&
                                Array.isArray(valor) &&
                                valor.length > 0
                              ) {
                                return (
                                  <div key={pregunta.id} className={styles.resumenCampo}>
                                    <span className={styles.resumenLabel}>
                                      {pregunta.label}:
                                    </span>
                                    <div className={styles.resumenVelas}>
                                      {valor.map((vela) => (
                                        <div key={vela.id} className={styles.resumenVelaItem}>
                                          <strong>{vela.nombre}</strong> - {vela.familiar}
                                          <div className={styles.resumenVelaCancion}>
                                            🎵 {vela.cancion}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }

                              if (valor !== undefined && valor !== null && valor !== '') {
                                return (
                                  <div key={pregunta.id} className={styles.resumenCampo}>
                                    <span className={styles.resumenLabel}>
                                      {pregunta.label}:
                                    </span>
                                    <span className={styles.resumenValor}>
                                      {String(valor)
                                        .split('\n')
                                        .map((line, i) => (
                                          <span key={i}>
                                            {line}
                                            <br />
                                          </span>
                                        ))}
                                    </span>
                                  </div>
                                );
                              }

                              return null;
                            })}
                          </div>
                        );
                      });
                    })()
                  ) : (
                    <div className={styles.resumenSeccion}>
                      <p style={{ color: '#666', fontStyle: 'italic' }}>
                        Esta coordinación aún no tiene un flujo completado. Inicia la coordinación
                        para comenzar a recopilar información.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>No se pudo cargar el resumen.</p>
                </div>
              )}
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.buttonSecondary}
                onClick={closeResumenModal}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


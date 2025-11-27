import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { coordinacionesAPI, salonesAPI, adminAPI } from '@/services/api';
import { SkeletonCard } from '@/components/Loading';
import styles from '@/styles/CoordinacionesAdminPanel.module.css';
import { FLUJOS_POR_TIPO } from '@/components/CoordinacionFlujo';
import { CLIENTE_FLUJOS_POR_TIPO } from '@/utils/flujosCliente';

export default function CoordinacionesAdminPanel() {
  const [coordinaciones, setCoordinaciones] = useState([]);
  const [salones, setSalones] = useState([]);
  const [djs, setDjs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    djId: '',
    estado: '',
    tipoEvento: '',
    salonId: '',
    fechaDesde: '',
    fechaHasta: '',
  });
  const [viewingResumen, setViewingResumen] = useState(null);
  const [resumenData, setResumenData] = useState(null);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    nombre_cliente: '',
    telefono: '',
    tipo_evento: '',
    codigo_evento: '',
    fecha_evento: '',
    dj_responsable_id: '',
    estado: 'pendiente',
    notas: '',
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadCoordinaciones();
    loadSalones();
    loadDjs();
  }, []);

  // Recargar coordinaciones cuando cambian los filtros
  useEffect(() => {
    loadCoordinaciones();
  }, [filters]);

  const loadCoordinaciones = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        activo: 'true',
      };
      
      if (filters.djId) {
        params.dj_responsable_id = filters.djId;
      }
      if (filters.estado) {
        params.estado = filters.estado;
      }
      if (filters.salonId) {
        params.salon_id = filters.salonId;
      }
      
      const response = await coordinacionesAPI.getAll(params);
      let coordinacionesData = response.data || [];
      
      // Filtrar por tipo de evento si está seleccionado
      if (filters.tipoEvento) {
        coordinacionesData = coordinacionesData.filter(c => c.tipo_evento === filters.tipoEvento);
      }
      
      // Filtrar por rango de fechas si está seleccionado
      if (filters.fechaDesde || filters.fechaHasta) {
        coordinacionesData = coordinacionesData.filter(c => {
          if (!c.fecha_evento) return false;
          const fechaEvento = new Date(c.fecha_evento);
          if (filters.fechaDesde) {
            const desde = new Date(filters.fechaDesde);
            if (fechaEvento < desde) return false;
          }
          if (filters.fechaHasta) {
            const hasta = new Date(filters.fechaHasta);
            hasta.setHours(23, 59, 59, 999); // Incluir todo el día
            if (fechaEvento > hasta) return false;
          }
          return true;
        });
      }
      
      setCoordinaciones(coordinacionesData);
    } catch (err) {
      console.error('Error al cargar coordinaciones:', err);
      setError('Error al cargar coordinaciones');
    } finally {
      setLoading(false);
    }
  };

  const loadSalones = async () => {
    try {
      const response = await salonesAPI.getAll();
      setSalones(response.data || []);
    } catch (err) {
      console.error('Error al cargar salones:', err);
    }
  };

  const loadDjs = async () => {
    try {
      // Usar el endpoint de admin dashboard que devuelve los DJs
      const response = await adminAPI.getDashboard(new Date().getFullYear(), new Date().getMonth() + 1);
      const djsData = (response.data?.djs || []);
      setDjs(djsData);
    } catch (err) {
      console.error('Error al cargar DJs:', err);
    }
  };

  const handleViewResumen = async (coordinacion) => {
    try {
      setLoadingResumen(true);
      setViewingResumen(coordinacion.id);
      
      // Cargar coordinación completa
      const coordResponse = await coordinacionesAPI.getById(coordinacion.id);
      const coordinacionData = coordResponse.data || coordResponse;
      
      // Cargar flujo si existe
      let flujo = null;
      try {
        const flujoResponse = await coordinacionesAPI.getFlujo(coordinacion.id);
        flujo = flujoResponse.data || flujoResponse;
      } catch (err) {
        console.log('No se encontró flujo de coordinación');
      }
      
      setResumenData({
        coordinacion: coordinacionData,
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

  const handleEdit = (coordinacion) => {
    setEditingId(coordinacion.id);
    setFormData({
      titulo: coordinacion.titulo || '',
      nombre_cliente: coordinacion.nombre_cliente || '',
      telefono: coordinacion.telefono || '',
      tipo_evento: coordinacion.tipo_evento || '',
      codigo_evento: coordinacion.codigo_evento || '',
      fecha_evento: coordinacion.fecha_evento ? format(new Date(coordinacion.fecha_evento), 'yyyy-MM-dd') : '',
      dj_responsable_id: coordinacion.dj_responsable_id || '',
      estado: coordinacion.estado || 'pendiente',
      notas: coordinacion.notas || '',
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta coordinación?')) {
      return;
    }

    try {
      await coordinacionesAPI.delete(id);
      setCoordinaciones(coordinaciones.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error al eliminar coordinación:', err);
      alert('Error al eliminar la coordinación');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await coordinacionesAPI.update(editingId, formData);
      }
      
      setEditingId(null);
      setFormData({
        titulo: '',
        nombre_cliente: '',
        telefono: '',
        tipo_evento: '',
        codigo_evento: '',
        fecha_evento: '',
        dj_responsable_id: '',
        estado: 'pendiente',
        notas: '',
      });
      loadCoordinaciones();
    } catch (err) {
      console.error('Error al guardar coordinación:', err);
      alert('Error al guardar la coordinación');
    }
  };

  const getDjName = (djId) => {
    const dj = djs.find(d => d.id === djId);
    return dj ? dj.nombre : 'N/A';
  };

  const getSalonName = (salonId) => {
    const salon = salones.find(s => s.id === salonId);
    return salon ? salon.nombre : 'N/A';
  };

  // Estadísticas
  const stats = useMemo(() => {
    const total = coordinaciones.length;
    const porEstado = coordinaciones.reduce((acc, c) => {
      acc[c.estado] = (acc[c.estado] || 0) + 1;
      return acc;
    }, {});
    const porDj = coordinaciones.reduce((acc, c) => {
      const djName = getDjName(c.dj_responsable_id);
      acc[djName] = (acc[djName] || 0) + 1;
      return acc;
    }, {});
    
    return { total, porEstado, porDj };
  }, [coordinaciones, djs]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gestión de Coordinaciones</h2>
        <p>Administra, audita y verifica todas las coordinaciones de los DJs</p>
      </div>

      {/* Estadísticas */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Coordinaciones</div>
        </div>
        {Object.entries(stats.porEstado).map(([estado, count]) => (
          <div key={estado} className={styles.statCard}>
            <div className={styles.statValue}>{count}</div>
            <div className={styles.statLabel}>{estado}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>DJ Responsable:</label>
          <select
            value={filters.djId}
            onChange={(e) => setFilters({ ...filters, djId: e.target.value })}
          >
            <option value="">Todos los DJs</option>
            {djs.map(dj => (
              <option key={dj.id} value={dj.id}>{dj.nombre}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Estado:</label>
          <select
            value={filters.estado}
            onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En Proceso</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Tipo de Evento:</label>
          <select
            value={filters.tipoEvento}
            onChange={(e) => setFilters({ ...filters, tipoEvento: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="XV">XV</option>
            <option value="Casamiento">Casamiento</option>
            <option value="Corporativo">Corporativo</option>
            <option value="Cumpleaños">Cumpleaños</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Salón:</label>
          <select
            value={filters.salonId}
            onChange={(e) => setFilters({ ...filters, salonId: e.target.value })}
          >
            <option value="">Todos</option>
            {salones.map(salon => (
              <option key={salon.id} value={salon.id}>{salon.nombre}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Fecha Desde:</label>
          <input
            type="date"
            value={filters.fechaDesde}
            onChange={(e) => setFilters({ ...filters, fechaDesde: e.target.value })}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Fecha Hasta:</label>
          <input
            type="date"
            value={filters.fechaHasta}
            onChange={(e) => setFilters({ ...filters, fechaHasta: e.target.value })}
          />
        </div>

        <button
          type="button"
          onClick={() => setFilters({
            djId: '',
            estado: '',
            tipoEvento: '',
            salonId: '',
            fechaDesde: '',
            fechaHasta: '',
          })}
          className={styles.clearFilters}
        >
          Limpiar Filtros
        </button>
      </div>

      {/* Tabla de Coordinaciones */}
      {loading ? (
        <div className={styles.loading}>
          <SkeletonCard count={5} />
        </div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : coordinaciones.length === 0 ? (
        <div className={styles.empty}>
          <p>No se encontraron coordinaciones con los filtros seleccionados</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>DJ Responsable</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Salón</th>
                <th>Estado</th>
                <th>Pre-Coord.</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {coordinaciones.map((coordinacion) => (
                <tr key={coordinacion.id}>
                  <td>{coordinacion.id}</td>
                  <td>{coordinacion.nombre_cliente || 'N/A'}</td>
                  <td>{getDjName(coordinacion.dj_responsable_id)}</td>
                  <td>{coordinacion.tipo_evento || 'N/A'}</td>
                  <td>
                    {coordinacion.fecha_evento
                      ? format(new Date(coordinacion.fecha_evento), 'dd/MM/yyyy', { locale: es })
                      : 'N/A'}
                  </td>
                  <td>{getSalonName(coordinacion.salon_id)}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge_${coordinacion.estado}`]}`}>
                      {coordinacion.estado || 'pendiente'}
                    </span>
                  </td>
                  <td>
                    {coordinacion.pre_coordinacion_completado_por_cliente ? (
                      <span className={styles.badge + ' ' + styles.badge_success}>✓ Completada</span>
                    ) : coordinacion.pre_coordinacion_url ? (
                      <span className={styles.badge + ' ' + styles.badge_warning}>Pendiente</span>
                    ) : (
                      <span className={styles.badge}>No generada</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        onClick={() => handleViewResumen(coordinacion)}
                        className={styles.actionButton}
                        title="Ver Resumen"
                      >
                        👁️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(coordinacion)}
                        className={styles.actionButton}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(coordinacion.id)}
                        className={styles.actionButton + ' ' + styles.deleteButton}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Edición */}
      {editingId && (
        <div className={styles.modalOverlay} onClick={() => setEditingId(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Editar Coordinación</h3>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className={styles.modalCloseButton}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Título:</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Cliente:</label>
                <input
                  type="text"
                  value={formData.nombre_cliente}
                  onChange={(e) => setFormData({ ...formData, nombre_cliente: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Teléfono:</label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Tipo de Evento:</label>
                <select
                  value={formData.tipo_evento}
                  onChange={(e) => setFormData({ ...formData, tipo_evento: e.target.value })}
                  required
                >
                  <option value="">Seleccionar...</option>
                  <option value="XV">XV</option>
                  <option value="Casamiento">Casamiento</option>
                  <option value="Corporativo">Corporativo</option>
                  <option value="Cumpleaños">Cumpleaños</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Código de Evento:</label>
                <input
                  type="text"
                  value={formData.codigo_evento}
                  onChange={(e) => setFormData({ ...formData, codigo_evento: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Fecha del Evento:</label>
                <input
                  type="date"
                  value={formData.fecha_evento}
                  onChange={(e) => setFormData({ ...formData, fecha_evento: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>DJ Responsable:</label>
                <select
                  value={formData.dj_responsable_id}
                  onChange={(e) => setFormData({ ...formData, dj_responsable_id: e.target.value })}
                  required
                >
                  <option value="">Seleccionar DJ...</option>
                  {djs.map(dj => (
                    <option key={dj.id} value={dj.id}>{dj.nombre}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Estado:</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  required
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Notas:</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={4}
                />
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton}>
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className={styles.cancelButton}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Resumen */}
      {viewingResumen && resumenData && (
        <div className={styles.modalOverlay} onClick={closeResumenModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Resumen de Coordinación</h2>
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
                    <h3>Información General</h3>
                    <div className={styles.resumenCampo}>
                      <span className={styles.resumenLabel}>Cliente:</span>
                      <span className={styles.resumenValor}>
                        {resumenData.coordinacion?.nombre_cliente || 'N/A'}
                      </span>
                    </div>
                    {resumenData.coordinacion?.telefono && (
                      <div className={styles.resumenCampo}>
                        <span className={styles.resumenLabel}>Teléfono:</span>
                        <span className={styles.resumenValor}>
                          {resumenData.coordinacion.telefono}
                        </span>
                      </div>
                    )}
                    <div className={styles.resumenCampo}>
                      <span className={styles.resumenLabel}>DJ Responsable:</span>
                      <span className={styles.resumenValor}>
                        {getDjName(resumenData.coordinacion?.dj_responsable_id)}
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
                    <div className={styles.resumenCampo}>
                      <span className={styles.resumenLabel}>Estado:</span>
                      <span className={styles.resumenValor}>
                        {resumenData.coordinacion?.estado || 'pendiente'}
                      </span>
                    </div>
                  </div>

                  {/* Respuestas del Cliente */}
                  {resumenData.coordinacion?.pre_coordinacion_completado_por_cliente && resumenData.flujo && resumenData.flujo.respuestas && (
                    <div className={styles.resumenSeccion} style={{ 
                      background: '#e8f5e9', 
                      padding: '1rem', 
                      borderRadius: '8px',
                      marginBottom: '1.5rem',
                    }}>
                      <h4 style={{ color: '#2e7d32', marginBottom: '0.75rem', fontSize: '1rem' }}>
                        Respuestas del Cliente:
                      </h4>
                      {(() => {
                        const tipoEvento = resumenData.coordinacion?.tipo_evento?.trim();
                        const pasos = tipoEvento ? CLIENTE_FLUJOS_POR_TIPO[tipoEvento] || [] : [];
                        
                        let respuestas = resumenData.flujo.respuestas;
                        
                        if (typeof respuestas === 'string') {
                          try {
                            respuestas = JSON.parse(respuestas);
                          } catch (e) {
                            console.error('Error al parsear respuestas:', e);
                            respuestas = {};
                          }
                        }
                        
                        // Asegurar que velas sea siempre un array válido
                        if (respuestas.velas) {
                          if (typeof respuestas.velas === 'string') {
                            try {
                              respuestas.velas = JSON.parse(respuestas.velas);
                            } catch (e) {
                              console.error('Error al parsear velas desde string:', e);
                              respuestas.velas = [];
                            }
                          }
                          if (!Array.isArray(respuestas.velas)) {
                            respuestas.velas = [];
                          }
                          respuestas.velas = respuestas.velas.filter(v => 
                            v && typeof v === 'object' && (v.nombre || v.familiar || v.cancion)
                          );
                        } else {
                          respuestas.velas = [];
                        }
                        
                        return pasos.map((paso) => {
                          const preguntasRespondidas = paso.preguntas.filter((p) => {
                            const esCondicional = p.condicional && p.condicional.pregunta;
                            let debeMostrar = true;
                            
                            if (esCondicional) {
                              const valorCondicional = respuestas[p.condicional.pregunta];
                              const valorEsperado = p.condicional.valor;
                              
                              if (Array.isArray(valorCondicional)) {
                                debeMostrar = valorCondicional.includes(valorEsperado);
                              } else if (typeof valorCondicional === 'string') {
                                debeMostrar = valorCondicional === valorEsperado || 
                                             valorCondicional.includes(valorEsperado);
                              } else {
                                debeMostrar = false;
                              }
                            }
                            
                            if (!debeMostrar) return false;
                            
                            const valor = respuestas[p.id];
                            if (p.tipo === 'velas') {
                              return Array.isArray(valor) && valor.length > 0;
                            }
                            if (p.tipo === 'buttons') {
                              return Array.isArray(valor) && valor.length > 0;
                            }
                            return valor !== undefined && valor !== null && valor !== '';
                          });

                          if (preguntasRespondidas.length === 0) return null;

                          return (
                            <div key={paso.id} style={{ marginBottom: '1.5rem' }}>
                              <h5 style={{ 
                                color: '#2e7d32', 
                                fontSize: '0.95rem', 
                                fontWeight: 600,
                                marginBottom: '0.5rem',
                                paddingBottom: '0.5rem',
                                borderBottom: '1px solid #c8e6c9'
                              }}>
                                {paso.titulo}
                              </h5>
                              {paso.preguntas.map((pregunta) => {
                                const esCondicional = pregunta.condicional && pregunta.condicional.pregunta;
                                let debeMostrar = true;
                                
                                if (esCondicional) {
                                  const valorCondicional = respuestas[pregunta.condicional.pregunta];
                                  const valorEsperado = pregunta.condicional.valor;
                                  
                                  if (Array.isArray(valorCondicional)) {
                                    debeMostrar = valorCondicional.includes(valorEsperado);
                                  } else if (typeof valorCondicional === 'string') {
                                    debeMostrar = valorCondicional === valorEsperado;
                                  } else {
                                    debeMostrar = false;
                                  }
                                }
                                
                                if (!debeMostrar) return null;

                                const valor = respuestas[pregunta.id];
                                if (valor === undefined || valor === null || valor === '') return null;

                                if (pregunta.tipo === 'velas' && Array.isArray(valor)) {
                                  return (
                                    <div key={pregunta.id} className={styles.resumenCampo} style={{ marginBottom: '0.75rem' }}>
                                      <span className={styles.resumenLabel}>{pregunta.label}:</span>
                                      <div className={styles.resumenValor}>
                                        {valor.map((vela, idx) => (
                                          <div key={idx} style={{ 
                                            marginBottom: '0.5rem',
                                            padding: '0.5rem',
                                            background: '#f1f8f4',
                                            borderRadius: '4px'
                                          }}>
                                            <strong>{vela.nombre || 'Sin nombre'}</strong> - {vela.familiar || 'Sin familiar'}
                                            <br />
                                            🎵 {vela.cancion || 'Sin canción'}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }

                                if (pregunta.tipo === 'buttons' && Array.isArray(valor)) {
                                  const valoresTexto = valor.map(v => {
                                    if (typeof v === 'object' && v.tipo === 'otro') {
                                      return `Otro: ${v.valor}`;
                                    }
                                    return v;
                                  });
                                  return (
                                    <div key={pregunta.id} className={styles.resumenCampo} style={{ marginBottom: '0.75rem' }}>
                                      <span className={styles.resumenLabel}>{pregunta.label}:</span>
                                      <span className={styles.resumenValor}>
                                        {valoresTexto.join(', ')}
                                      </span>
                                    </div>
                                  );
                                }

                                return (
                                  <div key={pregunta.id} className={styles.resumenCampo} style={{ marginBottom: '0.75rem' }}>
                                    <span className={styles.resumenLabel}>{pregunta.label}:</span>
                                    <span className={styles.resumenValor}>
                                      {String(valor).split('\n').map((line, i) => (
                                        <span key={i}>
                                          {line}
                                          {i < String(valor).split('\n').length - 1 && <br />}
                                        </span>
                                      ))}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}

                  {resumenData.coordinacion?.notas && (
                    <div className={styles.resumenSeccion}>
                      <h3>Notas</h3>
                      <p>{resumenData.coordinacion.notas}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


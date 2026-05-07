import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { coordinacionesAPI, salonesAPI, authAPI } from '@/services/api';
import { getAuth } from '@/utils/auth';
import { SkeletonCard } from '@/components/Loading';
import CustomSelect from '@/components/CustomSelect';
import styles from '@/styles/CoordinacionesPanel.module.css';
import { FLUJOS_POR_TIPO } from '@/components/CoordinacionFlujo';
import { CLIENTE_FLUJOS_POR_TIPO } from '@/utils/flujosCliente';
import { formatDateFromDB, formatDateFromDBForInput } from '@/utils/dateFormat';
import AgendarVideollamadaModal from '@/components/AgendarVideollamadaModal';
import GoogleCalendarConnect from '@/components/GoogleCalendarConnect';
import WhatsAppTemplateModal from '@/components/WhatsAppTemplateModal';
import { exportarCoordinacionPDF } from '@/utils/pdfExport';

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
    apellido_cliente: '',
    telefono: '',
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
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [showPreCoordinacionModal, setShowPreCoordinacionModal] = useState(false);
  const [preCoordinacionUrl, setPreCoordinacionUrl] = useState('');
  const [generandoPreCoordinacion, setGenerandoPreCoordinacion] = useState(false);
  const [showAgendarVideollamada, setShowAgendarVideollamada] = useState(false);
  const [coordinacionParaVideollamada, setCoordinacionParaVideollamada] = useState(null);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [flujosCache, setFlujosCache] = useState({}); // Cache de flujos para detectar pendientes
  const [exportingPdfId, setExportingPdfId] = useState(null);
  const [tooltipData, setTooltipData] = useState({ show: false, items: [], x: 0, y: 0 });
  const [whatsappMenuOpen, setWhatsappMenuOpen] = useState(null);
  const [showWhatsAppTemplates, setShowWhatsAppTemplates] = useState(false);
  const [selectedCoordForWhatsApp, setSelectedCoordForWhatsApp] = useState(null);

  // El componente GoogleCalendarConnect manejará la verificación del estado
  // No necesitamos verificarlo aquí, solo mostramos el componente si hay user

  // Verificar si hay parámetros de Google Calendar en la URL (después de OAuth)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('google_calendar_connected') === 'true') {
        setGoogleCalendarConnected(true);
        // Limpiar URL
        window.history.replaceState({}, '', window.location.pathname);
      }
      if (params.get('google_calendar_error')) {
        const error = params.get('google_calendar_error');
        alert(`Error al conectar Google Calendar: ${error}`);
        // Limpiar URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Cargar información del usuario
  useEffect(() => {
    const auth = getAuth();
    if (auth?.user) {
      setUser(auth.user);
    }
  }, []);

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

  // Cerrar menú Play al hacer clic fuera (solo en desktop)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (playMenuOpen) {
        // En móviles, el overlay maneja el cierre - no hacer nada aquí
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          return;
        }
        // En desktop, cerrar si se hace clic fuera del contenedor
        if (!event.target.closest(`.${styles.playMenuContainer}`) &&
          !event.target.closest(`.${styles.playMenu}`)) {
          setPlayMenuOpen(null);
        }
      }
    };
    if (playMenuOpen) {
      // Usar capture phase para detectar antes que otros handlers
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('touchend', handleClickOutside, true);
      return () => {
        document.removeEventListener('click', handleClickOutside, true);
        document.removeEventListener('touchend', handleClickOutside, true);
      };
    }
  }, [playMenuOpen]);

  // Prevenir scroll del body cuando el menú está abierto en móvil
  useEffect(() => {
    if (playMenuOpen) {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        // Guardar la posición actual del scroll
        const scrollY = window.scrollY;
        // Prevenir scroll del body
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        return () => {
          // Restaurar scroll al cerrar
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '';
          document.body.style.overflow = '';
          window.scrollTo(0, scrollY);
        };
      }
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

      if (editingId) {
        // Para edición: solo enviar los campos que están en el formulario
        const finalTipoEvento = formData.tipo_evento === 'Religioso' && formData.subtipo_evento
          ? `Religioso - ${formData.subtipo_evento}`
          : formData.tipo_evento;

        const data = {
          titulo: formData.titulo || null,
          nombre_cliente: formData.nombre_cliente || null,
          apellido_cliente: formData.apellido_cliente || null,
          nombre_agasajado: formData.nombre_agasajado || null,
          telefono: formData.telefono || null,
          tipo_evento: finalTipoEvento || null,
          codigo_evento: formData.codigo_evento || null,
          fecha_evento: formData.fecha_evento || null,
          estado: formData.estado || 'pendiente',
          notas: formData.notas || null,
        };

        // Solo incluir dj_responsable_id si el usuario es admin
        if (user?.rol === 'admin' && formData.dj_responsable_id) {
          data.dj_responsable_id = formData.dj_responsable_id || null;
        }

        await coordinacionesAPI.update(editingId, data);
      } else {
        // Para creación: enviar todos los campos necesarios
        const finalTipoEvento = formData.tipo_evento === 'Religioso' && formData.subtipo_evento
          ? `Religioso - ${formData.subtipo_evento}`
          : formData.tipo_evento;

        const finalTitulo = formData.titulo || (
          formData.tipo_evento === 'Religioso' && formData.subtipo_evento
            ? `Religioso - ${formData.subtipo_evento} de ${formData.nombre_agasajado || formData.nombre_cliente}`
            : null
        );

        const data = {
          ...formData,
          tipo_evento: finalTipoEvento,
          titulo: finalTitulo,
          salon_id: formData.salon_id || null,
        };

        // Solo incluir dj_responsable_id si el usuario es admin
        if (user?.rol === 'admin' && formData.dj_responsable_id) {
          data.dj_responsable_id = formData.dj_responsable_id || null;
        }

        await coordinacionesAPI.create(data);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        titulo: '',
        nombre_cliente: '',
        apellido_cliente: '',
        nombre_agasajado: '',
        tipo_evento: '',
        subtipo_evento: '',
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
    let tipo = item.tipo_evento || '';
    let subtipo = '';
    if (tipo.startsWith('Religioso - ')) {
      subtipo = tipo.split(' - ')[1];
      tipo = 'Religioso';
    }

    setFormData({
      titulo: item.titulo,
      nombre_cliente: item.nombre_cliente || '',
      apellido_cliente: item.apellido_cliente || '',
      nombre_agasajado: item.nombre_agasajado || '',
      telefono: item.telefono || '',
      tipo_evento: tipo,
      subtipo_evento: subtipo,
      codigo_evento: item.codigo_evento || '',
      fecha_evento: item.fecha_evento ? formatDateFromDBForInput(item.fecha_evento) : '',
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

  const handleCompletarInformacion = (id) => {
    router.push(`/dashboard/coordinaciones/${id}/iniciar?soloPendientes=true`);
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
    setWhatsappMenuOpen(null);
  };

  const toggleWhatsappMenu = (id) => {
    setWhatsappMenuOpen(whatsappMenuOpen === id ? null : id);
    setPlayMenuOpen(null);
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
        console.log('Flujo cargado desde API:', flujo);
        console.log('Respuestas del flujo:', flujo?.respuestas);
        console.log('Tipo de respuestas:', typeof flujo?.respuestas);
        if (flujo?.respuestas) {
          console.log('Keys de respuestas en el flujo:', Object.keys(flujo.respuestas));
          console.log('Total de respuestas:', Object.keys(flujo.respuestas).length);
        }
      } catch (err) {
        // Si no existe flujo, no es un error, simplemente no hay datos del flujo
        console.log('No se encontró flujo de coordinación para esta coordinación');
        console.error('Error al cargar flujo:', err);
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

  const handleAgendarVideollamada = (coordinacion) => {
    if (!googleCalendarConnected) {
      alert('Por favor, conecta tu Google Calendar primero para poder agendar videollamadas.');
      return;
    }
    setCoordinacionParaVideollamada(coordinacion);
    setShowAgendarVideollamada(true);
  };

  const handleVideollamadaAgendada = (eventData) => {
    // Recargar coordinaciones para mostrar la información actualizada
    loadCoordinaciones();
    alert('¡Videollamada agendada exitosamente! Se ha creado el evento en tu Google Calendar con link de Google Meet.');
  };

  const handleWhatsApp = (coordinacion) => {
    if (!coordinacion.telefono) {
      alert('Esta coordinación no tiene teléfono registrado. Por favor, edítala y agrega el teléfono del cliente.');
      return;
    }

    // Abrir WhatsApp Web con el número usando la API limpia
    const phoneNumber = coordinacion.telefono.replace(/[\s\-\(\)]/g, '');
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleExportPDF = async (coordinacion) => {
    if (exportingPdfId) return;
    setExportingPdfId(coordinacion.id);
    try {
      await exportarCoordinacionPDF(coordinacion, coordinacionesAPI, FLUJOS_POR_TIPO);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor intentarlo nuevamente.');
    } finally {
      setExportingPdfId(null);
    }
  };

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (playMenuOpen && !event.target.closest(`.${styles.playMenuContainer}`)) {
        setPlayMenuOpen(null);
      }
      if (whatsappMenuOpen && !event.target.closest(`.${styles.playMenuContainer}`)) {
        setWhatsappMenuOpen(null);
      }
    };
    if (playMenuOpen || whatsappMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [playMenuOpen, whatsappMenuOpen]);

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

  // Constante para identificar respuestas pendientes
  const VALOR_PENDIENTE = '__PENDIENTE__';
  const esPendiente = (valor) => {
    return valor === VALOR_PENDIENTE || valor === '__PENDIENTE__';
  };

  // Función para obtener items pendientes de una coordinación
  const obtenerItemsPendientes = useCallback(async (coordinacion) => {
    // Si ya está en cache, devolverlo
    if (flujosCache[coordinacion.id]) {
      return flujosCache[coordinacion.id];
    }

    // Solo verificar si la coordinación está completada
    if (coordinacion.estado !== 'completado' && coordinacion.estado !== 'completada') {
      return { items: [], count: 0 };
    }

    try {
      // Cargar el flujo de la coordinación
      const flujoResponse = await coordinacionesAPI.getFlujo(coordinacion.id);
      const flujo = flujoResponse.data || flujoResponse;

      if (!flujo || !flujo.respuestas) {
        return { items: [], count: 0 };
      }

      const tipoEvento = coordinacion.tipo_evento?.trim();
      const baseTipoEvento = tipoEvento?.startsWith('Religioso') ? 'Religioso' : tipoEvento;
      const pasos = baseTipoEvento ? FLUJOS_POR_TIPO[baseTipoEvento] || [] : [];

      let respuestas = flujo.respuestas;

      // Parsear respuestas si es string
      if (typeof respuestas === 'string') {
        try {
          respuestas = JSON.parse(respuestas);
        } catch (e) {
          console.error('Error al parsear respuestas:', e);
          respuestas = {};
        }
      }

      const itemsPendientes = [];
      pasos.forEach((paso) => {
        paso.preguntas.forEach((pregunta) => {
          const esCondicional = pregunta.condicional && pregunta.condicional.pregunta;
          const debeMostrar = !esCondicional ||
            (respuestas[pregunta.condicional.pregunta] === pregunta.condicional.valor);

          if (!debeMostrar) return;

          const valor = respuestas[pregunta.id];
          if (esPendiente(valor)) {
            itemsPendientes.push({
              paso: paso.titulo,
              pregunta: pregunta.label
            });
          }
        });
      });

      const result = {
        items: itemsPendientes,
        count: itemsPendientes.length
      };

      // Guardar en cache
      setFlujosCache(prev => ({
        ...prev,
        [coordinacion.id]: result
      }));

      return result;
    } catch (err) {
      console.error('Error al obtener items pendientes:', err);
      return { items: [], count: 0 };
    }
  }, [flujosCache]);

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
              nombre_cliente: '',
              apellido_cliente: '',
              telefono: '',
              tipo_evento: '',
              codigo_evento: '',
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

      {/* Componente de conexión Google Calendar */}
      {user && (
        <div style={{ marginBottom: '2rem' }}>
          <GoogleCalendarConnect onStatusChange={setGoogleCalendarConnected} />
        </div>
      )}

      {showForm && (
        <div className={styles.formModal}>
          <div className={styles.formContent}>
            <h4>{editingId ? 'Editar Coordinación' : 'Nueva Coordinación'}</h4>
            <form onSubmit={handleSubmit}>
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
              <div className={styles.formGroup}>
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Ingrese el teléfono del cliente"
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
                <CustomSelect
                  value={formData.tipo_evento}
                  options={['XV', 'Casamiento', 'Corporativo', 'Religioso', 'Cumpleaños']}
                  onChange={(val) => setFormData({ ...formData, tipo_evento: val, subtipo_evento: '' })}
                  required
                  placeholder="Seleccionar tipo de evento"
                />
              </div>
              {formData.tipo_evento === 'Religioso' && (
                <>
                  <div className={styles.formGroup}>
                    <label>Subtipo de Evento *</label>
                    <CustomSelect
                      value={formData.subtipo_evento}
                      options={['Bat', 'Bar', 'Boda']}
                      onChange={(val) => setFormData({ ...formData, subtipo_evento: val })}
                      required
                      placeholder="Seleccionar subtipo"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Nombre del Agasajado/a *</label>
                    <input
                      type="text"
                      value={formData.nombre_agasajado}
                      onChange={(e) => setFormData({ ...formData, nombre_agasajado: e.target.value })}
                      required={formData.tipo_evento === 'Religioso'}
                      placeholder="Nombre del agasajado/a"
                    />
                  </div>
                </>
              )}
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
                      <label>Estado</label>
                      <CustomSelect
                        value={formData.estado}
                        options={[
                          { label: 'Pendiente', value: 'pendiente' },
                          { label: 'En Proceso', value: 'en_proceso' },
                          { label: 'Completada', value: 'completado' },
                          { label: 'Cancelada', value: 'cancelada' }
                        ]}
                        onChange={(val) => setFormData({ ...formData, estado: val })}
                        placeholder="Pendiente"
                      />
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
                      apellido_cliente: '',
                      telefono: '',
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
          <div style={{ width: '200px' }}>
            <CustomSelect
              value={filterPrioridad}
              options={[
                { label: 'Todas las Prioridades', value: '' },
                { label: 'Urgente', value: 'urgente' },
                { label: 'Alta', value: 'alta' },
                { label: 'Normal', value: 'normal' },
                { label: 'Baja', value: 'baja' }
              ]}
              onChange={(val) => setFilterPrioridad(val)}
              placeholder="Todas las Prioridades"
            />
          </div>
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
          {coordinaciones.map((item) => {
            return (
              <div key={item.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderLeft}>
                    <div className={styles.cardTitleRow}>
                      <h4>{item.titulo}</h4>
                      <div className={styles.cardMetaInfo}>
                        {item.fecha_evento && (
                          <span className={styles.metaItem}>
                            📅 Fecha del Evento: {formatDateFromDB(item.fecha_evento)}
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
                      <PendientesBadge
                        coordinacion={item}
                        obtenerItemsPendientes={obtenerItemsPendientes}
                        getEstadoColor={getEstadoColor}
                        onShowTooltip={(items, e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltipData({
                            show: true,
                            items: items,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 10
                          });
                        }}
                        onHideTooltip={() => {
                          setTooltipData({ show: false, items: [], x: 0, y: 0 });
                        }}
                      />
                      {item.contactado ? (
                        <span className={`${styles.badge} ${styles.contactadoBadge}`} title="Primer contacto realizado">
                          ✅ Contactado
                        </span>
                      ) : (
                        <span className={`${styles.badge} ${styles.noContactadoBadge}`} title="Pendiente de contacto inicial">
                          ⚠️ Pendiente Contacto
                        </span>
                      )}
                      {
                        item.prioridad && item.prioridad !== 'normal' && (
                          <span
                            className={styles.badge}
                            style={{ backgroundColor: getPrioridadColor(item.prioridad) }}
                          >
                            {item.prioridad.toUpperCase()}
                          </span>
                        )
                      }
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
                        <>
                          <div
                            className={styles.playMenuOverlay}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPlayMenuOpen(null);
                            }}
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPlayMenuOpen(null);
                            }}
                            onTouchStart={(e) => {
                              // Prevenir que el touch se propague pero permitir el cierre
                              e.stopPropagation();
                            }}
                          />
                          <div
                            className={styles.playMenu}
                            onClick={(e) => {
                              // Prevenir que clicks dentro del menú cierren el overlay
                              e.stopPropagation();
                            }}
                            onTouchEnd={(e) => {
                              // Prevenir que touches dentro del menú cierren el overlay
                              e.stopPropagation();
                            }}
                          >
                            <button
                              type="button"
                              className={`${styles.playMenuItem} ${(item.estado === 'completado' || item.estado === 'completada') ? styles.playMenuItemDisabled : ''}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleIniciarCoordinacion(item.id);
                                setPlayMenuOpen(null);
                              }}
                              onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleIniciarCoordinacion(item.id);
                                setPlayMenuOpen(null);
                              }}
                              disabled={item.estado === 'completado' || item.estado === 'completada'}
                            >
                              Iniciar Coordinación
                            </button>
                            <button
                              type="button"
                              className={styles.playMenuItem}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (item.pre_coordinacion_url) {
                                  setPreCoordinacionUrl(item.pre_coordinacion_url);
                                  setShowPreCoordinacionModal(true);
                                } else {
                                  handleGenerarPreCoordinacion(item.id);
                                }
                                setPlayMenuOpen(null);
                              }}
                              onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (item.pre_coordinacion_url) {
                                  setPreCoordinacionUrl(item.pre_coordinacion_url);
                                  setShowPreCoordinacionModal(true);
                                } else {
                                  handleGenerarPreCoordinacion(item.id);
                                }
                                setPlayMenuOpen(null);
                              }}
                              disabled={generandoPreCoordinacion || !item.tipo_evento}
                              title={!item.tipo_evento ? 'La coordinación debe tener un tipo de evento' : ''}
                            >
                              {generandoPreCoordinacion ? 'Generando...' : item.pre_coordinacion_url ? 'Ver Link de Pre-Coordinación' : 'Generar Pre-Coordinación'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <div className={styles.playMenuContainer}>
                      <button
                        type="button"
                        className={styles.whatsappButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!item.telefono) return;
                          toggleWhatsappMenu(item.id);
                        }}
                        title={item.telefono ? `Opciones de WhatsApp para ${item.telefono}` : 'Agregar teléfono para enviar WhatsApp'}
                        disabled={!item.telefono}
                        style={!item.telefono ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      >
                        💬
                      </button>
                      {whatsappMenuOpen === item.id && (
                        <>
                          <div
                            className={styles.playMenuOverlay}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setWhatsappMenuOpen(null);
                            }}
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setWhatsappMenuOpen(null);
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                            }}
                          />
                          <div
                            className={styles.playMenu}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            onTouchEnd={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <button
                              type="button"
                              className={styles.playMenuItem}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedCoordForWhatsApp(item);
                                setShowWhatsAppTemplates(true);
                                setWhatsappMenuOpen(null);
                              }}
                              onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedCoordForWhatsApp(item);
                                setShowWhatsAppTemplates(true);
                                setWhatsappMenuOpen(null);
                              }}
                            >
                              Plantillas WhatsApp
                            </button>
                            <button
                              type="button"
                              className={styles.playMenuItem}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleWhatsApp(item);
                                setWhatsappMenuOpen(null);
                              }}
                              onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleWhatsApp(item);
                                setWhatsappMenuOpen(null);
                              }}
                            >
                              Ir al chat
                            </button>
                            <button
                              type="button"
                              className={styles.playMenuItem}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const url = `${window.location.origin}/encuesta/${item.id}`;
                                const text = `¡Hola ${item.nombre_cliente}! Ojalá hayas pasado una fiesta increíble. 🥳 Me encantaría que me dejes tu opinión sobre el evento midiendo nuestro desempeño en este link cortito (te lleva 1 minuto): ${url}`;
                                window.open(`https://wa.me/${(item.telefono || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                                setWhatsappMenuOpen(null);
                              }}
                              onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const url = `${window.location.origin}/encuesta/${item.id}`;
                                const text = `¡Hola ${item.nombre_cliente}! Ojalá hayas pasado una fiesta increíble. 🥳 Me encantaría que me dejes tu opinión sobre el evento midiendo nuestro desempeño en este link cortito (te lleva 1 minuto): ${url}`;
                                window.open(`https://wa.me/${(item.telefono || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                                setWhatsappMenuOpen(null);
                              }}
                            >
                              Enviar Encuesta
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    {googleCalendarConnected && (
                      <button
                        type="button"
                        className={styles.videocallButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAgendarVideollamada(item);
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation();
                          handleAgendarVideollamada(item);
                        }}
                        title={item.videollamada_agendada ? `Videollamada agendada para ${item.videollamada_fecha ? formatDateFromDB(item.videollamada_fecha) : 'fecha no disponible'}` : 'Agendar Videollamada'}
                      >
                        {item.videollamada_agendada ? '📹' : '📅'}
                      </button>
                    )}
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
                      className={styles.pdfButton}
                      onClick={() => handleExportPDF(item)}
                      title="Exportar a PDF"
                      disabled={exportingPdfId === item.id}
                      style={exportingPdfId === item.id ? { opacity: 0.6, cursor: 'wait' } : {}}
                    >
                      {exportingPdfId === item.id ? '⏳' : '📄'}
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
                  {item.telefono && (
                    <div className={styles.detail}>
                      <span className={styles.detailLabel}>📞 Teléfono:</span>
                      <span>{item.telefono}</span>
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
                {flujosCache[item.id]?.count > 0 && (
                  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f0f0f0', paddingTop: '1rem' }}>
                    <button
                      type="button"
                      className={styles.saveButton}
                      style={{ background: '#ff9800', border: 'none', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      onClick={() => handleCompletarInformacion(item.id)}
                    >
                      <span>📝</span> Completar información restante
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Agendar Videollamada */}
      {showAgendarVideollamada && coordinacionParaVideollamada && (
        <AgendarVideollamadaModal
          coordinacion={coordinacionParaVideollamada}
          isOpen={showAgendarVideollamada}
          onClose={() => {
            setShowAgendarVideollamada(false);
            setCoordinacionParaVideollamada(null);
          }}
          onSuccess={handleVideollamadaAgendada}
        />
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
        <div className={styles.modalOverlay}>
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
                        {resumenData.coordinacion?.nombre_cliente ? `${resumenData.coordinacion.nombre_cliente} ${resumenData.coordinacion.apellido_cliente || ''}`.trim() : 'N/A'}
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
                          {formatDateFromDB(resumenData.coordinacion.fecha_evento)}
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

                  {/* Sección de Pre-Coordinación Completada */}
                  {resumenData.coordinacion?.pre_coordinacion_completado_por_cliente && (
                    <div className={styles.resumenSeccion} style={{
                      background: '#e8f5e9',
                      padding: '1rem',
                      borderRadius: '8px',
                      marginBottom: '1.5rem',
                      border: '2px solid #4caf50'
                    }}>
                      <h3 className={styles.resumenSeccionTitulo} style={{ color: '#2e7d32' }}>
                        ✅ Pre-Coordinación Completada por el Cliente
                      </h3>
                      <p style={{ color: '#2e7d32', marginBottom: '1rem', fontSize: '0.95rem' }}>
                        El cliente completó la pre-coordinación el{' '}
                        {resumenData.coordinacion.pre_coordinacion_fecha_completado
                          ? format(new Date(resumenData.coordinacion.pre_coordinacion_fecha_completado), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
                          : 'fecha no disponible'}
                      </p>
                      {resumenData.flujo && resumenData.flujo.respuestas && (
                        <div style={{ marginTop: '1rem' }}>
                          <h4 style={{ color: '#2e7d32', marginBottom: '0.75rem', fontSize: '1rem' }}>
                            Respuestas del Cliente:
                          </h4>
                          {(() => {
                            const tipoEvento = resumenData.coordinacion?.tipo_evento?.trim();
                            // Usar el flujo del cliente ya que las respuestas fueron guardadas con ese flujo
                            const baseTipoEvento = tipoEvento?.startsWith('Religioso') ? 'Religioso' : tipoEvento;
                            const pasos = baseTipoEvento ? CLIENTE_FLUJOS_POR_TIPO[baseTipoEvento] || [] : [];

                            // Parsear respuestas correctamente
                            let respuestas = resumenData.flujo.respuestas;

                            // Si respuestas es null o undefined, intentar obtenerlas de otra forma
                            if (!respuestas && resumenData.flujo) {
                              respuestas = resumenData.flujo.respuestas || {};
                            }

                            if (typeof respuestas === 'string') {
                              try {
                                respuestas = JSON.parse(respuestas);
                              } catch (e) {
                                console.error('Error al parsear respuestas:', e);
                                console.error('String que falló:', respuestas);
                                respuestas = {};
                              }
                            }

                            // Asegurar que velas sea siempre un array válido
                            console.log('🔍 Parseando respuestas del cliente:', {
                              tieneVelas: !!respuestas.velas,
                              tipoVelas: typeof respuestas.velas,
                              valorVelas: respuestas.velas
                            });

                            if (respuestas.velas) {
                              if (typeof respuestas.velas === 'string') {
                                try {
                                  respuestas.velas = JSON.parse(respuestas.velas);
                                  console.log('✅ Velas parseadas desde string:', respuestas.velas);
                                } catch (e) {
                                  console.error('Error al parsear velas desde string:', e);
                                  respuestas.velas = [];
                                }
                              }
                              if (!Array.isArray(respuestas.velas)) {
                                console.warn('⚠️ velas no es un array, convirtiendo a array vacío:', respuestas.velas);
                                respuestas.velas = [];
                              } else {
                                console.log('✅ Velas es un array con', respuestas.velas.length, 'elementos');
                                // Filtrar solo objetos válidos
                                const antesFiltro = respuestas.velas.length;
                                respuestas.velas = respuestas.velas.filter(v => {
                                  const esValido = v && typeof v === 'object' && (v.nombre || v.familiar || v.cancion);
                                  if (!esValido) {
                                    console.warn('⚠️ Vela inválida filtrada:', v);
                                  }
                                  return esValido;
                                });
                                console.log(`✅ Velas válidas: ${respuestas.velas.length} de ${antesFiltro}`);
                              }
                            } else {
                              console.warn('⚠️ No hay campo velas en respuestas');
                              respuestas.velas = [];
                            }

                            // Si respuestas sigue siendo null/undefined, usar objeto vacío
                            if (!respuestas || typeof respuestas !== 'object') {
                              console.warn('Respuestas no válidas, usando objeto vacío:', respuestas);
                              respuestas = {};
                            }

                            console.log('Tipo evento:', tipoEvento);
                            console.log('Pasos disponibles:', pasos.length);
                            console.log('Respuestas RAW:', resumenData.flujo?.respuestas);
                            console.log('Respuestas parseadas:', respuestas);
                            console.log('Total de respuestas:', Object.keys(respuestas).length);
                            console.log('Keys de respuestas:', Object.keys(respuestas));

                            if (!respuestas || Object.keys(respuestas).length === 0) {
                              return <p style={{ color: '#666', fontStyle: 'italic' }}>No hay respuestas disponibles</p>;
                            }

                            // Replicar exactamente la lógica del cliente - mostrar todos los pasos con respuestas
                            return pasos.map((paso) => {
                              const preguntasRespondidas = paso.preguntas.filter(p => {
                                const esCondicional = p.condicional && p.condicional.pregunta;
                                let debeMostrar = true;

                                if (esCondicional) {
                                  const valorCondicional = respuestas[p.condicional.pregunta];
                                  const valorEsperado = p.condicional.valor;

                                  // Manejar tanto valores string como arrays (para botones)
                                  if (Array.isArray(valorCondicional)) {
                                    debeMostrar = valorCondicional.includes(valorEsperado);
                                  } else if (typeof valorCondicional === 'string') {
                                    debeMostrar = valorCondicional === valorEsperado;
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
                                  // Manejar strings (después de conversión) y arrays
                                  if (typeof valor === 'string') {
                                    return valor.trim() !== '';
                                  }
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

                                      // Manejar tanto valores string como arrays (para botones)
                                      if (Array.isArray(valorCondicional)) {
                                        debeMostrar = valorCondicional.includes(valorEsperado);
                                      } else if (typeof valorCondicional === 'string') {
                                        debeMostrar = valorCondicional === valorEsperado ||
                                          valorCondicional.includes(valorEsperado);
                                      } else {
                                        debeMostrar = false;
                                      }
                                    }

                                    if (!debeMostrar) return null;

                                    const valor = respuestas[pregunta.id];

                                    // Manejar velas específicamente - verificar tanto por tipo como por id
                                    // IMPORTANTE: Verificar velas ANTES de la validación genérica
                                    if ((pregunta.tipo === 'velas' || pregunta.id === 'velas')) {
                                      // Para velas, permitir arrays vacíos pero no valores null/undefined
                                      if (valor === undefined || valor === null) return null;
                                      // Log para depuración
                                      console.log('🔍 Detectando velas:', {
                                        preguntaId: pregunta.id,
                                        preguntaTipo: pregunta.tipo,
                                        valor,
                                        esArray: Array.isArray(valor),
                                        tipoValor: typeof valor
                                      });

                                      // Si el valor es un string, intentar parsearlo
                                      let valorVelas = valor;
                                      if (typeof valor === 'string') {
                                        try {
                                          valorVelas = JSON.parse(valor);
                                        } catch (e) {
                                          console.error('Error al parsear velas desde string:', e);
                                          return null;
                                        }
                                      }

                                      // Verificar que sea un array
                                      if (Array.isArray(valorVelas)) {
                                        console.log('✅ valorVelas es un array con', valorVelas.length, 'elementos:', valorVelas);

                                        // Asegurar que cada elemento del array sea un objeto válido
                                        const velasValidas = valorVelas.filter(v => {
                                          const esValido = v && typeof v === 'object' && (v.nombre || v.familiar || v.cancion);
                                          if (!esValido) {
                                            console.warn('⚠️ Vela inválida en renderizado:', v);
                                          }
                                          return esValido;
                                        });

                                        console.log('✅ Velas válidas encontradas para renderizar:', velasValidas.length, velasValidas);

                                        if (velasValidas.length > 0) {
                                          return (
                                            <div key={pregunta.id} className={styles.resumenCampo} style={{ marginBottom: '0.75rem' }}>
                                              <span className={styles.resumenLabel}>{pregunta.label}:</span>
                                              <div className={styles.resumenValor}>
                                                {velasValidas.map((vela, idx) => (
                                                  <div key={vela.id || idx} style={{
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
                                      } else {
                                        console.warn('⚠️ Valor de velas no es un array:', valorVelas);
                                        // Si no es un array válido, no renderizar nada
                                        return null;
                                      }
                                    }

                                    // Si llegamos aquí y es tipo velas pero no se renderizó, no mostrar nada más
                                    if (pregunta.tipo === 'velas' || pregunta.id === 'velas') {
                                      return null;
                                    }

                                    // Validación genérica para otros tipos de preguntas
                                    if (valor === undefined || valor === null || valor === '') return null;

                                    // Manejar valores que pueden ser strings o arrays
                                    let valorParaMostrar = valor;
                                    if (typeof valor === 'string' && pregunta.tipo === 'buttons') {
                                      // Si es string y era un botón, puede estar separado por comas
                                      valorParaMostrar = valor;
                                    }

                                    // Si el valor es un array pero no es velas, no renderizarlo como string
                                    if (Array.isArray(valorParaMostrar)) {
                                      // Si es un array de strings (como botones), unirlos con comas
                                      if (valorParaMostrar.every(v => typeof v === 'string')) {
                                        valorParaMostrar = valorParaMostrar.join(', ');
                                      } else {
                                        // Si es un array de objetos, no renderizarlo
                                        return null;
                                      }
                                    }

                                    return (
                                      <div key={pregunta.id} className={styles.resumenCampo} style={{ marginBottom: '0.75rem' }}>
                                        <span className={styles.resumenLabel}>{pregunta.label}:</span>
                                        <span className={styles.resumenValor}>
                                          {String(valorParaMostrar)
                                            .split('\n')
                                            .map((line, i) => (
                                              <span key={i}>
                                                {line}
                                                {i < String(valorParaMostrar).split('\n').length - 1 && <br />}
                                              </span>
                                            ))}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }).filter(Boolean); // Filtrar valores null
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Solo mostrar el flujo del DJ si NO hay pre-coordinación completada por el cliente */}
                  {resumenData.flujo && resumenData.flujo.respuestas && !resumenData.coordinacion?.pre_coordinacion_completado_por_cliente ? (
                    (() => {
                      const tipoEvento = resumenData.coordinacion?.tipo_evento?.trim();
                      const baseTipoEvento = tipoEvento?.startsWith('Religioso') ? 'Religioso' : tipoEvento;
                      const pasos = baseTipoEvento ? FLUJOS_POR_TIPO[baseTipoEvento] || [] : [];
                      let respuestas = resumenData.flujo.respuestas;

                      // Constante para identificar respuestas pendientes
                      const VALOR_PENDIENTE = '__PENDIENTE__';
                      const esPendiente = (valor) => {
                        return valor === VALOR_PENDIENTE || valor === '__PENDIENTE__';
                      };

                      // Parsear respuestas si es string
                      if (typeof respuestas === 'string') {
                        try {
                          respuestas = JSON.parse(respuestas);
                        } catch (e) {
                          console.error('Error al parsear respuestas del DJ:', e);
                          respuestas = {};
                        }
                      }

                      // Recopilar items pendientes
                      const itemsPendientes = [];
                      pasos.forEach((paso) => {
                        paso.preguntas.forEach((pregunta) => {
                          const esCondicional = pregunta.condicional && pregunta.condicional.pregunta;
                          const debeMostrar = !esCondicional ||
                            (respuestas[pregunta.condicional.pregunta] === pregunta.condicional.valor);

                          if (!debeMostrar) return;

                          const valor = respuestas[pregunta.id];
                          if (esPendiente(valor)) {
                            itemsPendientes.push({
                              paso: paso.titulo,
                              pregunta: pregunta.label
                            });
                          }
                        });
                      });

                      // Asegurar que velas sea siempre un array válido
                      if (respuestas.velas) {
                        if (typeof respuestas.velas === 'string') {
                          try {
                            respuestas.velas = JSON.parse(respuestas.velas);
                          } catch (e) {
                            console.error('Error al parsear velas del DJ desde string:', e);
                            respuestas.velas = [];
                          }
                        }
                        if (!Array.isArray(respuestas.velas)) {
                          console.warn('velas del DJ no es un array, convirtiendo a array vacío:', respuestas.velas);
                          respuestas.velas = [];
                        }
                        // Filtrar solo objetos válidos
                        respuestas.velas = respuestas.velas.filter(v =>
                          v && typeof v === 'object' && (v.nombre || v.familiar || v.cancion)
                        );
                      } else {
                        respuestas.velas = [];
                      }

                      return (
                        <>
                          {/* Sección de Items Pendientes */}
                          {itemsPendientes.length > 0 && (
                            <div className={styles.resumenSeccion} style={{
                              background: '#fff3e0',
                              border: '2px solid #ff9800',
                              borderRadius: '8px',
                              padding: '1rem',
                              marginBottom: '1.5rem'
                            }}>
                              <h3 className={styles.resumenSeccionTitulo} style={{ color: '#e65100' }}>
                                ⏳ Items Pendientes ({itemsPendientes.length})
                              </h3>
                              <p style={{ color: '#e65100', marginBottom: '1rem', fontSize: '0.95rem' }}>
                                Los siguientes items quedaron pendientes de confirmar. Recuerda contactar al cliente antes del evento.
                              </p>
                              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                {itemsPendientes.map((item, idx) => (
                                  <li key={idx} style={{ marginBottom: '0.5rem', color: '#e65100' }}>
                                    <strong>{item.paso}:</strong> {item.pregunta}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {pasos.map((paso) => {
                            const tieneRespuestas = paso.preguntas.some((p) => {
                              const esCondicional = p.condicional && p.condicional.pregunta;
                              const debeMostrar =
                                !esCondicional ||
                                respuestas[p.condicional.pregunta] === p.condicional.valor;
                              if (!debeMostrar) return false;
                              const valor = respuestas[p.id];
                              // Incluir pendientes en la verificación
                              return (
                                (valor !== undefined && valor !== null && valor !== '') || esPendiente(valor)
                              ) && (
                                  p.tipo !== 'velas' || (Array.isArray(valor) && valor.length > 0) || esPendiente(valor)
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

                                  // Si está pendiente, mostrar como pendiente
                                  if (esPendiente(valor)) {
                                    return (
                                      <div key={pregunta.id} className={styles.resumenCampo} style={{
                                        background: '#fff3e0',
                                        padding: '0.75rem',
                                        borderRadius: '6px',
                                        border: '1px solid #ff9800',
                                        marginBottom: '0.5rem'
                                      }}>
                                        <span className={styles.resumenLabel} style={{ color: '#e65100', fontWeight: 600 }}>
                                          {pregunta.label}: <span style={{ fontSize: '0.9rem' }}>⏳ PENDIENTE</span>
                                        </span>
                                      </div>
                                    );
                                  }

                                  // Manejar velas específicamente
                                  if (pregunta.tipo === 'velas' || pregunta.id === 'velas') {
                                    let valorVelas = valor;

                                    // Si el valor es un string, intentar parsearlo
                                    if (typeof valorVelas === 'string') {
                                      try {
                                        valorVelas = JSON.parse(valorVelas);
                                      } catch (e) {
                                        console.error('Error al parsear velas desde string en flujo DJ:', e);
                                        return null;
                                      }
                                    }

                                    // Verificar que sea un array válido
                                    if (Array.isArray(valorVelas) && valorVelas.length > 0) {
                                      // Filtrar solo objetos válidos
                                      const velasValidas = valorVelas.filter(v =>
                                        v && typeof v === 'object' && (v.nombre || v.familiar || v.cancion)
                                      );

                                      if (velasValidas.length > 0) {
                                        return (
                                          <div key={pregunta.id} className={styles.resumenCampo}>
                                            <span className={styles.resumenLabel}>
                                              {pregunta.label}:
                                            </span>
                                            <div className={styles.resumenVelas}>
                                              {velasValidas.map((vela, idx) => (
                                                <div key={vela.id || idx} className={styles.resumenVelaItem}>
                                                  <strong>{vela.nombre || 'Sin nombre'}</strong> - {vela.familiar || 'Sin familiar'}
                                                  <div className={styles.resumenVelaCancion}>
                                                    🎵 {vela.cancion || 'Sin canción'}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      }
                                    }
                                    return null;
                                  }

                                  // Si el valor es un array pero no es velas, no renderizarlo como string
                                  if (Array.isArray(valor)) {
                                    return null;
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
                          })}
                        </>
                      );
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

      {/* Tooltip de items pendientes */}
      {tooltipData.show && tooltipData.items.length > 0 && (
        <div
          className={styles.pendientesTooltip}
          style={{
            left: `${tooltipData.x}px`,
            top: `${tooltipData.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className={styles.tooltipHeader}>
            ⏳ Items Pendientes ({tooltipData.items.length})
          </div>
          <ul className={styles.tooltipList}>
            {tooltipData.items.map((item, idx) => (
              <li key={idx}>
                <strong>{item.paso}:</strong> {item.pregunta}
              </li>
            ))}
          </ul>
          <div className={styles.tooltipArrow}></div>
        </div>
      )}

      {showWhatsAppTemplates && selectedCoordForWhatsApp && (
        <WhatsAppTemplateModal
          coordinacion={selectedCoordForWhatsApp}
          event={selectedCoordForWhatsApp}
          onClose={() => {
            setShowWhatsAppTemplates(false);
            setSelectedCoordForWhatsApp(null);
          }}
        />
      )}

    </section>
  );
}


// Componente para el badge con detección de pendientes
function PendientesBadge({ coordinacion, obtenerItemsPendientes, getEstadoColor, onShowTooltip, onHideTooltip }) {
  const [pendientesData, setPendientesData] = useState({ items: [], count: 0, loading: false });
  const badgeRef = useRef(null);

  useEffect(() => {
    // Solo cargar si está completada
    if (coordinacion.estado === 'completado' || coordinacion.estado === 'completada') {
      setPendientesData(prev => ({ ...prev, loading: true }));
      obtenerItemsPendientes(coordinacion).then(data => {
        setPendientesData({ items: data.items, count: data.count, loading: false });
      });
    }
  }, [coordinacion.id, coordinacion.estado, obtenerItemsPendientes]);

  useEffect(() => {
    if (badgeRef.current) {
      const card = badgeRef.current.closest(`.${styles.card}`);
      if (card) {
        card.classList.remove(styles.glowPending);
        if (styles.glowCompleted) card.classList.remove(styles.glowCompleted);

        if (pendientesData.count > 0) {
          card.classList.add(styles.glowPending);
        } else if ((coordinacion.estado === 'completado' || coordinacion.estado === 'completada') && !pendientesData.loading) {
          if (styles.glowCompleted) card.classList.add(styles.glowCompleted);
        }
      }
    }
  }, [pendientesData.count, pendientesData.loading, coordinacion.estado, styles.glowPending, styles.glowCompleted]);

  const handleMouseEnter = (e) => {
    if (pendientesData.count > 0) {
      onShowTooltip(pendientesData.items, e);
    }
  };

  const handleMouseLeave = () => {
    onHideTooltip();
  };

  return (
    <span
      ref={badgeRef}
      className={styles.badge}
      style={{
        backgroundColor: getEstadoColor(coordinacion.estado),
        position: 'relative'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {coordinacion.estado.replace('_', ' ').toUpperCase()}
      {pendientesData.count > 0 && (
        <span
          style={{
            marginLeft: '0.5rem',
            fontSize: '0.85em',
            fontWeight: 700
          }}
          title={`${pendientesData.count} item(s) pendiente(s)`}
        >
          ⚠️ {pendientesData.count}
        </span>
      )}
    </span>
  );
}



import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { adminAPI, salonesAPI } from '@/services/api';
import { getAuth, clearAuth } from '@/utils/auth';
import { getSalonColor } from '@/utils/colors';
import Calendar from '@/components/Calendar';
import SalonCoordinatesEditor from '@/components/SalonCoordinatesEditor';
import AdicionalesTecnicaAdmin from '@/components/AdicionalesTecnicaAdmin';
import Loading, { SkeletonCard } from '@/components/Loading';
import styles from '@/styles/AdminDashboard.module.css';

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const years = (() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, index) => currentYear - 2 + index);
})();

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDjId, setSelectedDjId] = useState(null);
  const [calendarStartDate, setCalendarStartDate] = useState('');
  const [calendarEndDate, setCalendarEndDate] = useState('');
  const [editingDj, setEditingDj] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    salon_id: '',
    color_hex: '#ffffff',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [activeMenu, setActiveMenu] = useState('overview');
  const [editingSalon, setEditingSalon] = useState(null);
  const [viewingDjEvents, setViewingDjEvents] = useState(null);
  const [djEvents, setDjEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [fichadas, setFichadas] = useState([]);
  const [loadingFichadas, setLoadingFichadas] = useState(false);
  const [fichadasFilter, setFichadasFilter] = useState({
    djId: '',
    tipo: '',
    startDate: '',
    endDate: '',
  });
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Resumen general', icon: '📊' },
    { id: 'djs', label: 'DJs', icon: '🎧' },
    { id: 'salones', label: 'Salones', icon: '🏢' },
    { id: 'fichadas', label: 'Fichadas', icon: '⏰' },
    { id: 'adicionales', label: 'Adicionales Técnica', icon: '⚡' },
    { id: 'calendar', label: 'Calendario', icon: '📅' },
  ];

  useEffect(() => {
    const auth = getAuth();
    if (!auth.token || !auth.user) {
      router.push('/login');
      return;
    }
    if (auth.user.rol !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setUser(auth.user);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user, selectedYear, selectedMonth]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      setEditError('');
      const response = await adminAPI.getDashboard(selectedYear, selectedMonth);
      setData(response.data);
      if (!selectedDjId && response.data.djs.length > 0) {
        setSelectedDjId(response.data.djs[0].id);
      }
    } catch (err) {
      console.error('Error al cargar dashboard admin:', err);
      setError(err.response?.data?.error || 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (dj) => {
    const fallbackColor = dj.color_hex || getSalonColor(dj.salon_id || dj.id);
    setEditingDj(dj);
    setEditError('');
    setEditForm({
      nombre: dj.nombre || '',
      salon_id: dj.salon_id ? String(dj.salon_id) : '',
      color_hex: fallbackColor,
    });
  };

  const closeEditModal = () => {
    setEditingDj(null);
    setEditForm({
      nombre: '',
      salon_id: '',
      color_hex: '#ffffff',
    });
    setSavingEdit(false);
    setEditError('');
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingDj) return;
    try {
      setSavingEdit(true);
      setEditError('');
      const payload = {
        nombre: editForm.nombre,
        salon_id: editForm.salon_id ? parseInt(editForm.salon_id, 10) : null,
        color_hex: editForm.color_hex,
      };
      await adminAPI.updateDj(editingDj.id, payload);

      const getSalonName = (id) =>
        data?.salones?.find((salon) => salon.id === id)?.nombre || null;

      setData((prev) => ({
        ...prev,
        djs:
          prev?.djs?.map((dj) =>
            dj.id === editingDj.id
              ? {
                  ...dj,
                  nombre: editForm.nombre,
                  salon_id: payload.salon_id,
                  salon_nombre: payload.salon_id
                    ? getSalonName(payload.salon_id)
                    : null,
                  color_hex: editForm.color_hex,
                }
              : dj
          ) || [],
      }));
      closeEditModal();
    } catch (err) {
      setEditError(
        err.response?.data?.error || 'No se pudo actualizar el DJ.'
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const handleGoToDJ = () => {
    router.push('/dashboard');
  };

  const handleMenuClick = (sectionId) => {
    setActiveMenu(sectionId);
    setMenuOpen(false); // Cerrar menú al hacer clic en un item
  };

  const loadFichadas = useCallback(async () => {
    if (!data) return;
    
    try {
      setLoadingFichadas(true);
      const params = {};
      if (fichadasFilter.djId) params.dj_id = fichadasFilter.djId;
      if (fichadasFilter.tipo) params.tipo = fichadasFilter.tipo;
      if (fichadasFilter.startDate) params.startDate = fichadasFilter.startDate;
      if (fichadasFilter.endDate) params.endDate = fichadasFilter.endDate;

      const response = await adminAPI.getFichadas(params);
      setFichadas(response.data || []);
    } catch (error) {
      console.error('Error al cargar fichadas:', error);
      setFichadas([]);
    } finally {
      setLoadingFichadas(false);
    }
  }, [fichadasFilter, data]);

  useEffect(() => {
    if (activeMenu === 'fichadas' && data) {
      loadFichadas();
    }
  }, [activeMenu, fichadasFilter, data, loadFichadas]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event) => {
      const sidebar = document.querySelector(`.${styles.sidebar}`);
      const hamburgerButton = document.querySelector(`.${styles.hamburgerButton}`);
      
      if (sidebar && !sidebar.contains(event.target) && 
          hamburgerButton && !hamburgerButton.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.body.style.overflow = 'hidden'; // Prevenir scroll del body cuando el menú está abierto

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const clearCalendarRange = () => {
    setCalendarStartDate('');
    setCalendarEndDate('');
  };

  const downloadCSV = (rows, filename) => {
    const csvContent = rows
      .map((row) =>
        row
          .map((value) => {
            if (value === null || value === undefined) return '';
            const stringValue = value.toString();
            if (/[",;\n]/.test(stringValue)) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(';')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportDJs = () => {
    if (!data?.djs?.length) return;
    const header = [
      'DJ',
      'Rol',
      'Salón',
      'Eventos',
      'Extras',
      'Último Evento',
      'Color',
    ];
    const rows = data.djs.map((dj) => [
      dj.nombre,
      dj.rol,
      dj.salon_nombre || 'Sin salón',
      dj.total_eventos,
      dj.eventos_extras,
      dj.ultimo_evento ? formatDate(dj.ultimo_evento) : '—',
      dj.color_hex || getSalonColor(dj.salon_id || dj.id),
    ]);
    downloadCSV([header, ...rows], `reporte_djs_${selectedYear}-${selectedMonth}.csv`);
  };

  const handleExportSalones = () => {
    if (!data?.salones?.length) return;
    const header = ['Salón', 'Eventos del mes', 'DJs activos'];
    const rows = data.salones.map((salon) => [
      salon.nombre,
      salon.total_eventos,
      salon.djs_activos,
    ]);
    downloadCSV(
      [header, ...rows],
      `reporte_salones_${selectedYear}-${selectedMonth}.csv`
    );
  };

  const formatNumber = (value) => {
    return (value ?? 0).toLocaleString('es-AR');
  };

  const handleViewDjEvents = async (dj) => {
    try {
      setViewingDjEvents(dj);
      setLoadingEvents(true);
      setDjEvents([]);
      
      const response = await adminAPI.getDjEvents(dj.id);
      setDjEvents(response.data || []);
    } catch (error) {
      console.error('Error al cargar eventos del DJ:', error);
      setDjEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const closeDjEventsModal = () => {
    setViewingDjEvents(null);
    setDjEvents([]);
  };

  const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
    });
  };

  if (!user) {
    return <div className={styles.loading}>Verificando credenciales...</div>;
  }

  return (
    <div className={styles.layout}>
      <button
        className={styles.hamburgerButton}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span className={styles.hamburgerIcon}>☰</span>
      </button>
      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>🎛️</div>
          <div>
            <p className={styles.brandSubtitle}>Administración</p>
            <h2 className={styles.brandTitle}>Sistema DJs</h2>
          </div>
        </div>
        <nav className={styles.menu}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.menuItem} ${
                activeMenu === item.id ? styles.menuItemActive : ''
              }`}
              onClick={() => handleMenuClick(item.id)}
            >
              <span className={styles.menuIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      {menuOpen && <div className={styles.overlay} onClick={() => setMenuOpen(false)} />}
      <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.subtitle}>Panel Administrativo</p>
          <h1 className={styles.title}>Control General DJs</h1>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.secondaryButton} onClick={handleGoToDJ}>
            Ir al Dashboard de DJ
          </button>
          <button className={styles.logoutButton} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Año</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Mes</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {months.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>
        <button
          className={styles.refreshButton}
          onClick={loadDashboardData}
          disabled={loading}
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </section>

      {error && <div className={styles.error}>{error}</div>}

      {loading && !data ? (
        <Loading message="Cargando información..." />
      ) : (
        data && (
          <>
            {activeMenu === 'overview' && (
              <section id="overview" className={styles.summaryGrid}>
                <div className={styles.card}>
                  <h3>Total DJs</h3>
                  <p>{formatNumber(data.summary.total_djs)}</p>
                </div>
                <div className={styles.card}>
                  <h3>Salones activos</h3>
                  <p>
                    {formatNumber(data.summary.salones_con_eventos)} /{' '}
                    {formatNumber(data.summary.total_salones)}
                  </p>
                </div>
                <div className={styles.card}>
                  <h3>Eventos del mes</h3>
                  <p>{formatNumber(data.summary.total_eventos_mes)}</p>
                </div>
                <div className={styles.card}>
                  <h3>DJs con actividad</h3>
                  <p>
                    {formatNumber(data.summary.djs_con_eventos)} /{' '}
                    {formatNumber(data.summary.total_djs)}
                  </p>
                </div>
              </section>
            )}

            {activeMenu === 'djs' && (
              <section id="djs" className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2>DJs</h2>
                    <p>Actividad mensual por DJ</p>
                  </div>
                  <button
                    type="button"
                    className={styles.exportButton}
                    onClick={handleExportDJs}
                    disabled={!data?.djs?.length}
                  >
                    Exportar CSV
                  </button>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>DJ</th>
                        <th>Rol</th>
                        <th>Salón</th>
                        <th>Eventos</th>
                        <th>Extras</th>
                        <th>Último evento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.djs
                        .filter((dj) => dj.rol !== 'admin')
                        .map((dj) => {
                        const resolvedColor =
                          dj.color_hex || getSalonColor(dj.salon_id || dj.id);
                        return (
                          <tr key={dj.id}>
                            <td data-label="DJ" className={styles.djNameCell}>
                              <span
                                className={styles.djColorDot}
                                style={{ backgroundColor: resolvedColor }}
                                title={`Color de ${dj.nombre}`}
                              />
                              <span 
                                className={styles.djNameClickable}
                                onClick={() => handleViewDjEvents(dj)}
                                title="Ver eventos de este DJ"
                              >
                                {dj.nombre}
                              </span>
                              <button
                                type="button"
                                className={styles.editButton}
                                onClick={() => openEditModal(dj)}
                                title={`Editar ${dj.nombre}`}
                              >
                                ✏️
                              </button>
                            </td>
                          <td data-label="Rol">
                            <span
                              className={
                                dj.rol === 'admin'
                                  ? styles.badgeAdmin
                                  : styles.badgeDj
                              }
                            >
                              {dj.rol}
                            </span>
                          </td>
                          <td data-label="Salón">
                            {dj.salon_nombre || 'Sin salón'}
                          </td>
                          <td data-label="Eventos">{formatNumber(dj.total_eventos)}</td>
                          <td
                            data-label="Extras"
                            className={dj.eventos_extras > 0 ? styles.highlight : ''}
                          >
                            {formatNumber(dj.eventos_extras)}
                          </td>
                            <td data-label="Último evento">{formatDate(dj.ultimo_evento)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeMenu === 'salones' && (
              <section id="salones" className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2>Salones</h2>
                    <p>Gestión de salones y coordenadas para geolocalización</p>
                  </div>
                  <button
                    type="button"
                    className={styles.exportButton}
                    onClick={handleExportSalones}
                    disabled={!data?.salones?.length}
                  >
                    Exportar CSV
                  </button>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Salón</th>
                        <th>Dirección</th>
                        <th>Coordenadas</th>
                        <th>Eventos del mes</th>
                        <th>DJs activos</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.salones.map((salon) => (
                        <tr key={salon.id}>
                          <td data-label="Salón">
                            <strong>{salon.nombre}</strong>
                          </td>
                          <td data-label="Dirección">{salon.direccion || '—'}</td>
                          <td data-label="Coordenadas">
                            {salon.latitud && salon.longitud ? (
                              <span className={styles.coordinatesOk}>
                                ✓ {parseFloat(salon.latitud).toFixed(4)}, {parseFloat(salon.longitud).toFixed(4)}
                              </span>
                            ) : (
                              <span className={styles.coordinatesMissing}>
                                ⚠️ No configuradas
                              </span>
                            )}
                          </td>
                          <td data-label="Eventos">{formatNumber(salon.total_eventos)}</td>
                          <td data-label="DJs">{formatNumber(salon.djs_activos)}</td>
                          <td data-label="Acciones">
                            <button
                              type="button"
                              className={styles.editButton}
                              onClick={() => setEditingSalon(salon)}
                              title="Configurar coordenadas"
                            >
                              📍 Configurar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeMenu === 'calendar' && (
              <section id="calendar" className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Calendario anual por DJ</h2>
                  <p>Seleccioná un DJ para visualizar sus eventos del año</p>
                </div>
                <div className={styles.calendarFilters}>
                  <div className={styles.djSelector}>
                    <label htmlFor="dj-calendar-select">DJ</label>
                  <select
                    id="dj-calendar-select"
                    value={selectedDjId || ''}
                    onChange={(e) => setSelectedDjId(parseInt(e.target.value, 10))}
                  >
                    {data.djs
                      .filter((dj) => dj.rol !== 'admin')
                      .map((dj) => (
                        <option key={dj.id} value={dj.id}>
                          {dj.nombre} {dj.salon_nombre ? `(${dj.salon_nombre})` : ''}
                        </option>
                      ))}
                  </select>
                  </div>
                  <div className={styles.dateRangeFilter}>
                    <label>
                      Desde
                      <input
                        type="date"
                        value={calendarStartDate}
                        onChange={(e) => setCalendarStartDate(e.target.value)}
                      />
                    </label>
                    <label>
                      Hasta
                      <input
                        type="date"
                        value={calendarEndDate}
                        onChange={(e) => setCalendarEndDate(e.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      className={styles.clearRangeButton}
                      onClick={clearCalendarRange}
                      disabled={!calendarStartDate && !calendarEndDate}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>

              {selectedDjId ? (
                (() => {
                  const selectedDj = data.djs.find((dj) => dj.id === selectedDjId);
                  if (!selectedDj) {
                    return (
                      <div className={styles.emptyState}>
                        No se encontró información del DJ seleccionado.
                      </div>
                    );
                  }

                  if (!selectedDj.salon_id) {
                    return (
                      <div className={styles.emptyState}>
                        Este DJ no tiene un salón asignado, no es posible mostrar su calendario.
                      </div>
                    );
                  }

                  return (
                    <Calendar
                      salonId={selectedDj.salon_id}
                      filterDjId={selectedDj.id}
                      readOnly
                      startDateFilter={calendarStartDate || undefined}
                      endDateFilter={calendarEndDate || undefined}
                    />
                  );
                })()
              ) : (
                <div className={styles.emptyState}>No hay DJs disponibles.</div>
              )}
            </section>
            )}

            {activeMenu === 'fichadas' && data && (
              <section id="fichadas" className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2>Fichadas</h2>
                    <p>Control de ingresos y egresos de DJs</p>
                  </div>
                </div>

                {/* Filtros */}
                <div className={styles.filtersContainer}>
                  <div className={styles.filterGroup}>
                    <label htmlFor="fichadas-dj-filter">DJ</label>
                    <select
                      id="fichadas-dj-filter"
                      value={fichadasFilter.djId}
                      onChange={(e) =>
                        setFichadasFilter((prev) => ({ ...prev, djId: e.target.value }))
                      }
                    >
                      <option value="">Todos los DJs</option>
                      {data.djs
                        ?.filter((dj) => dj.rol !== 'admin')
                        .map((dj) => (
                          <option key={dj.id} value={dj.id}>
                            {dj.nombre}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className={styles.filterGroup}>
                    <label htmlFor="fichadas-tipo-filter">Tipo</label>
                    <select
                      id="fichadas-tipo-filter"
                      value={fichadasFilter.tipo}
                      onChange={(e) =>
                        setFichadasFilter((prev) => ({ ...prev, tipo: e.target.value }))
                      }
                    >
                      <option value="">Todos</option>
                      <option value="ingreso">Ingreso</option>
                      <option value="egreso">Egreso</option>
                    </select>
                  </div>

                  <div className={styles.filterGroup}>
                    <label htmlFor="fichadas-start-date">Desde</label>
                    <input
                      id="fichadas-start-date"
                      type="date"
                      value={fichadasFilter.startDate}
                      onChange={(e) =>
                        setFichadasFilter((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                    />
                  </div>

                  <div className={styles.filterGroup}>
                    <label htmlFor="fichadas-end-date">Hasta</label>
                    <input
                      id="fichadas-end-date"
                      type="date"
                      value={fichadasFilter.endDate}
                      onChange={(e) =>
                        setFichadasFilter((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                    />
                  </div>

                  <button
                    type="button"
                    className={styles.refreshButton}
                    onClick={() => setFichadasFilter({ djId: '', tipo: '', startDate: '', endDate: '' })}
                  >
                    Limpiar filtros
                  </button>
                </div>

                {/* Tabla de fichadas */}
                {loadingFichadas ? (
                  <Loading message="Cargando fichadas..." size="small" />
                ) : fichadas.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No se encontraron fichadas con los filtros seleccionados.</p>
                  </div>
                ) : (
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Fecha y hora</th>
                          <th>DJ</th>
                          <th>Tipo</th>
                          <th>Salón</th>
                          <th>Comentario</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fichadas.map((fichada) => (
                          <tr key={fichada.id}>
                            <td data-label="Fecha y hora">
                              {new Date(fichada.registrado_en).toLocaleString('es-AR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td data-label="DJ">
                              <div className={styles.djNameCell}>
                                {fichada.dj_color && (
                                  <span
                                    className={styles.djColorDot}
                                    style={{ backgroundColor: fichada.dj_color }}
                                  />
                                )}
                                <strong>{fichada.dj_nombre}</strong>
                              </div>
                            </td>
                            <td data-label="Tipo">
                              <span
                                className={
                                  fichada.tipo === 'ingreso'
                                    ? styles.badgeIngreso
                                    : styles.badgeEgreso
                                }
                              >
                                {fichada.tipo === 'ingreso' ? '✅ Ingreso' : '🚪 Egreso'}
                              </span>
                            </td>
                            <td data-label="Salón">
                              {fichada.salon_nombre || '—'}
                            </td>
                            <td data-label="Comentario">
                              {fichada.comentario || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {activeMenu === 'adicionales' && (
              <section id="adicionales" className={styles.section}>
                <AdicionalesTecnicaAdmin />
              </section>
            )}

            {editingSalon && (
              <SalonCoordinatesEditor
                salon={editingSalon}
                onClose={() => setEditingSalon(null)}
                onSave={() => {
                  loadDashboardData();
                }}
              />
            )}

            {editingDj && (
              <div className={styles.modalOverlay} onClick={closeEditModal}>
                <div
                  className={styles.modalContent}
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                >
                  <h3 className={styles.modalTitle}>Editar DJ</h3>
                  <p className={styles.modalSubtitle}>
                    {editingDj.nombre} — {editingDj.salon_nombre || 'Sin salón'}
                  </p>

                  {editError && <div className={styles.error}>{editError}</div>}

                  <div className={styles.modalForm}>
                    <label className={styles.modalLabel}>
                      Nombre
                      <input
                        type="text"
                        value={editForm.nombre}
                        onChange={(e) =>
                          handleEditChange('nombre', e.target.value)
                        }
                        className={styles.modalInput}
                      />
                    </label>

                    <label className={styles.modalLabel}>
                      Salón
                      <select
                        value={editForm.salon_id}
                        onChange={(e) =>
                          handleEditChange('salon_id', e.target.value)
                        }
                        className={styles.modalSelect}
                        disabled={editingDj?.rol === 'admin'}
                      >
                        <option value="">Sin salón asignado</option>
                        {data.salones.map((salon) => (
                          <option key={salon.id} value={salon.id}>
                            {salon.nombre}
                          </option>
                        ))}
                      </select>
                      {editingDj?.rol === 'admin' && (
                        <small className={styles.fieldHint}>
                          Los administradores no tienen salón asignado.
                        </small>
                      )}
                    </label>

                    <label className={styles.modalLabel}>
                      Color identificatorio
                      <div className={styles.colorField}>
                        <input
                          type="color"
                          value={editForm.color_hex}
                          onChange={(e) =>
                            handleEditChange('color_hex', e.target.value)
                          }
                        />
                        <span>{editForm.color_hex}</span>
                      </div>
                    </label>
                  </div>

                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={closeEditModal}
                      disabled={savingEdit}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={handleSaveEdit}
                      disabled={savingEdit || !editForm.nombre.trim()}
                    >
                      {savingEdit ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de eventos del DJ */}
            {viewingDjEvents && (
              <div className={styles.modalOverlay} onClick={closeDjEventsModal}>
                <div
                  className={`${styles.modalContent} ${styles.eventsModalContent}`}
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                >
                  <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>
                      Eventos de {viewingDjEvents.nombre}
                    </h3>
                    <button
                      type="button"
                      onClick={closeDjEventsModal}
                      className={styles.closeButton}
                      aria-label="Cerrar"
                    >
                      ×
                    </button>
                  </div>

                  <div className={styles.modalBody}>
                    {loadingEvents ? (
                      <Loading message="Cargando eventos..." size="small" />
                    ) : djEvents.length === 0 ? (
                      <div className={styles.emptyState}>
                        <p>Este DJ no tiene eventos registrados.</p>
                      </div>
                    ) : (
                      <div className={styles.eventsList}>
                        <div className={styles.eventsSummary}>
                          <strong>Total de eventos: {djEvents.length}</strong>
                        </div>
                        <div className={`${styles.tableWrapper} ${styles.eventsTableWrapper}`}>
                          <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Fecha</th>
                              <th>Salón</th>
                            </tr>
                          </thead>
                          <tbody>
                            {djEvents.map((evento) => (
                              <tr key={evento.id}>
                                <td data-label="Fecha">
                                  {new Date(evento.fecha_evento).toLocaleDateString('es-AR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                  })}
                                </td>
                                <td data-label="Salón">
                                  <strong>{evento.salon_nombre || 'N/A'}</strong>
                                </td>
                              </tr>
                            ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )
      )}
      </div>
    </div>
  );
}


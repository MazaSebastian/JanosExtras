import { useState, useEffect, useMemo } from 'react';
import { contenidoAPI } from '@/services/api';
import { getAuth } from '@/utils/auth';
import { SkeletonCard } from '@/components/Loading';
import styles from '@/styles/ContenidoPanel.module.css';

const TIPOS_CONTENIDO = [
  { value: 'visual', label: 'Visual' },
  { value: 'pack_musica', label: 'Pack de Música' },
  { value: 'remix', label: 'Remix' },
  { value: 'otro', label: 'Otro' },
];

export default function ContenidoPanel() {
  const [user] = useState(() => getAuth()?.user);
  const [contenido, setContenido] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    url_descarga: '',
    categoria: '',
    tipo: '',
  });
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  const loadContenido = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { activo: true };
      if (filterCategoria) params.categoria = filterCategoria;
      if (filterTipo) params.tipo = filterTipo;
      const response = await contenidoAPI.getAll(params);
      const data = response?.data?.data || response?.data || [];
      setContenido(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar contenido:', err);
      setError('No se pudieron cargar los recursos de contenido.');
      setContenido([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContenido();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategoria, filterTipo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      if (editingId) {
        await contenidoAPI.update(editingId, formData);
      } else {
        await contenidoAPI.create(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ nombre: '', descripcion: '', url_descarga: '', categoria: '', tipo: '' });
      loadContenido();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el contenido.');
    }
  };

  const handleEdit = (item) => {
    setFormData({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      url_descarga: item.url_descarga,
      categoria: item.categoria || '',
      tipo: item.tipo || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este contenido?')) {
      return;
    }
    try {
      await contenidoAPI.delete(id);
      loadContenido();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar el contenido.');
    }
  };

  const categorias = useMemo(() => {
    if (!Array.isArray(contenido)) return [];
    return [...new Set(contenido.map(c => c.categoria).filter(Boolean))];
  }, [contenido]);

  const tipos = useMemo(() => {
    if (!Array.isArray(contenido)) return [];
    return [...new Set(contenido.map(c => c.tipo).filter(Boolean))];
  }, [contenido]);

  const isAdmin = user?.rol === 'admin';

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <p className={styles.subtitle}>Recursos para DJs</p>
          <h3 className={styles.title}>Contenido</h3>
        </div>
        {isAdmin && (
          <button
            type="button"
            className={styles.addButton}
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({ nombre: '', descripcion: '', url_descarga: '', categoria: '', tipo: '' });
            }}
          >
            + Agregar Contenido
          </button>
        )}
      </header>

      {error && (
        <div className={styles.error}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {showForm && isAdmin && (
        <div className={styles.formModal}>
          <div className={styles.formContent}>
            <h4>{editingId ? 'Editar Contenido' : 'Nuevo Contenido'}</h4>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>URL de Descarga *</label>
                <input
                  type="url"
                  value={formData.url_descarga}
                  onChange={(e) => setFormData({ ...formData, url_descarga: e.target.value })}
                  required
                  placeholder="https://..."
                />
              </div>
              <div className={styles.formGroup}>
                <label>Tipo *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  required
                >
                  <option value="">Seleccionar tipo...</option>
                  {TIPOS_CONTENIDO.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows="3"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Categoría</label>
                <input
                  type="text"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  placeholder="Ej: Visuales 4K, Packs House, Remixes 2024"
                />
              </div>
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
                    setFormData({ nombre: '', descripcion: '', url_descarga: '', categoria: '', tipo: '' });
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(categorias.length > 0 || tipos.length > 0) && (
        <div className={styles.filters}>
          <button
            type="button"
            className={!filterCategoria && !filterTipo ? styles.filterActive : styles.filterButton}
            onClick={() => {
              setFilterCategoria('');
              setFilterTipo('');
            }}
          >
            Todos
          </button>
          {tipos.map((tipo) => {
            const tipoLabel = TIPOS_CONTENIDO.find(t => t.value === tipo)?.label || tipo;
            return (
              <button
                key={tipo}
                type="button"
                className={filterTipo === tipo ? styles.filterActive : styles.filterButton}
                onClick={() => {
                  setFilterTipo(filterTipo === tipo ? '' : tipo);
                  setFilterCategoria('');
                }}
              >
                {tipoLabel}
              </button>
            );
          })}
          {categorias.map((cat) => (
            <button
              key={cat}
              type="button"
              className={filterCategoria === cat ? styles.filterActive : styles.filterButton}
              onClick={() => {
                setFilterCategoria(filterCategoria === cat ? '' : cat);
                setFilterTipo('');
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
          <SkeletonCard count={6} />
        </div>
      ) : !Array.isArray(contenido) || contenido.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay contenido disponible. {isAdmin && '¡Sé el primero en agregar uno!'}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {Array.isArray(contenido) && contenido.map((item) => {
            const tipoLabel = TIPOS_CONTENIDO.find(t => t.value === item.tipo)?.label || item.tipo || 'Otro';
            return (
              <div key={item.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h4>{item.nombre}</h4>
                  <div className={styles.badges}>
                    {item.tipo && <span className={styles.badgeTipo}>{tipoLabel}</span>}
                    {item.categoria && <span className={styles.badge}>{item.categoria}</span>}
                  </div>
                </div>
                {item.descripcion && <p className={styles.description}>{item.descripcion}</p>}
                <div className={styles.cardActions}>
                  <a
                    href={item.url_descarga}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.downloadButton}
                  >
                    📥 Descargar
                  </a>
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => handleEdit(item)}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => handleDelete(item.id)}
                      >
                        🗑️ Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}


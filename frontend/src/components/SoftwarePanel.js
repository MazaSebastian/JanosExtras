import { useState, useEffect, useMemo } from 'react';
import { softwareAPI } from '@/services/api';
import { SkeletonCard } from '@/components/Loading';
import styles from '@/styles/SoftwarePanel.module.css';

export default function SoftwarePanel() {
  const [software, setSoftware] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    url_descarga: '',
    categoria: '',
  });
  const [filterCategoria, setFilterCategoria] = useState('');

  const loadSoftware = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { activo: true };
      if (filterCategoria) params.categoria = filterCategoria;
      const response = await softwareAPI.getAll(params);
      // Asegurar que siempre sea un array
      const data = response?.data?.data || response?.data || [];
      setSoftware(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar software:', err);
      setError('No se pudieron cargar los programas de software.');
      setSoftware([]); // Asegurar array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSoftware();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategoria]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      if (editingId) {
        await softwareAPI.update(editingId, formData);
      } else {
        await softwareAPI.create(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ nombre: '', descripcion: '', url_descarga: '', categoria: '' });
      loadSoftware();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el software.');
    }
  };

  const handleEdit = (item) => {
    setFormData({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      url_descarga: item.url_descarga,
      categoria: item.categoria || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este software?')) {
      return;
    }
    try {
      await softwareAPI.delete(id);
      loadSoftware();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar el software.');
    }
  };

  const categorias = useMemo(() => {
    if (!Array.isArray(software)) return [];
    return [...new Set(software.map(s => s.categoria).filter(Boolean))];
  }, [software]);

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <p className={styles.subtitle}>Recursos para DJs</p>
          <h3 className={styles.title}>Software</h3>
        </div>
        <button
          type="button"
          className={styles.addButton}
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ nombre: '', descripcion: '', url_descarga: '', categoria: '' });
          }}
        >
          + Agregar Software
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
            <h4>{editingId ? 'Editar Software' : 'Nuevo Software'}</h4>
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
                  placeholder="Ej: DAW, Plugin, Sample Pack"
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
                    setFormData({ nombre: '', descripcion: '', url_descarga: '', categoria: '' });
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {categorias.length > 0 && (
        <div className={styles.filters}>
          <button
            type="button"
            className={!filterCategoria ? styles.filterActive : styles.filterButton}
            onClick={() => setFilterCategoria('')}
          >
            Todos
          </button>
          {categorias.map((cat) => (
            <button
              key={cat}
              type="button"
              className={filterCategoria === cat ? styles.filterActive : styles.filterButton}
              onClick={() => setFilterCategoria(cat)}
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
      ) : !Array.isArray(software) || software.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay software disponible. ¡Sé el primero en agregar uno!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {Array.isArray(software) && software.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h4>{item.nombre}</h4>
                {item.categoria && <span className={styles.badge}>{item.categoria}</span>}
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
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


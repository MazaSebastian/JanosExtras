import { useState, useEffect, useMemo } from 'react';
import { showsAPI } from '@/services/api';
import { SkeletonCard } from '@/components/Loading';
import styles from '@/styles/ShowsPanel.module.css';

export default function ShowsPanel() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    url_audio: '',
    duracion: '',
    categoria: '',
  });
  const [filterCategoria, setFilterCategoria] = useState('');
  const [playingId, setPlayingId] = useState(null);

  const loadShows = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { activo: true };
      if (filterCategoria) params.categoria = filterCategoria;
      const response = await showsAPI.getAll(params);
      // Asegurar que siempre sea un array
      const data = response?.data?.data || response?.data || [];
      setShows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar shows:', err);
      setError('No se pudieron cargar las pistas de audio.');
      setShows([]); // Asegurar array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategoria]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      if (editingId) {
        await showsAPI.update(editingId, formData);
      } else {
        await showsAPI.create(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ nombre: '', descripcion: '', url_audio: '', duracion: '', categoria: '' });
      loadShows();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la pista.');
    }
  };

  const handleEdit = (item) => {
    setFormData({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      url_audio: item.url_audio,
      duracion: item.duracion ? String(item.duracion) : '',
      categoria: item.categoria || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta pista?')) {
      return;
    }
    try {
      await showsAPI.delete(id);
      loadShows();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar la pista.');
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const categorias = useMemo(() => {
    if (!Array.isArray(shows)) return [];
    return [...new Set(shows.map(s => s.categoria).filter(Boolean))];
  }, [shows]);

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <p className={styles.subtitle}>Recursos para Shows</p>
          <h3 className={styles.title}>Pistas de Audio</h3>
        </div>
        <button
          type="button"
          className={styles.addButton}
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ nombre: '', descripcion: '', url_audio: '', duracion: '', categoria: '' });
          }}
        >
          + Agregar Pista
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
            <h4>{editingId ? 'Editar Pista' : 'Nueva Pista'}</h4>
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
                <label>URL del Audio *</label>
                <input
                  type="url"
                  value={formData.url_audio}
                  onChange={(e) => setFormData({ ...formData, url_audio: e.target.value })}
                  required
                  placeholder="https://..."
                />
              </div>
              <div className={styles.formGroup}>
                <label>Duración (segundos)</label>
                <input
                  type="number"
                  value={formData.duracion}
                  onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                  min="0"
                  placeholder="Ej: 180"
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
                  placeholder="Ej: Intro, Outro, Transición"
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
                    setFormData({ nombre: '', descripcion: '', url_audio: '', duracion: '', categoria: '' });
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
      ) : !Array.isArray(shows) || shows.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay pistas disponibles. ¡Sé el primero en agregar una!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {Array.isArray(shows) && shows.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h4>{item.nombre}</h4>
                {item.categoria && <span className={styles.badge}>{item.categoria}</span>}
              </div>
              {item.descripcion && <p className={styles.description}>{item.descripcion}</p>}
              {item.duracion && (
                <p className={styles.duration}>⏱️ {formatDuration(item.duracion)}</p>
              )}
              <div className={styles.audioPlayer}>
                <audio
                  controls
                  src={item.url_audio}
                  onPlay={() => setPlayingId(item.id)}
                  onPause={() => setPlayingId(null)}
                >
                  Tu navegador no soporta audio HTML5.
                </audio>
              </div>
              <div className={styles.cardActions}>
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


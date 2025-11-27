import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { anunciosAPI } from '@/services/api';
import { SkeletonCard } from '@/components/Loading';
import styles from '@/styles/AnunciosAdminPanel.module.css';

export default function AnunciosAdminPanel() {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    mensaje: '',
    tipo: 'info',
    prioridad: 'normal',
    fecha_inicio: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    fecha_fin: '',
  });

  useEffect(() => {
    loadAnuncios();
  }, []);

  const loadAnuncios = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await anunciosAPI.getAll({ soloActivos: 'false' });
      setAnuncios(response.data || []);
    } catch (err) {
      console.error('Error al cargar anuncios:', err);
      setError('Error al cargar anuncios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await anunciosAPI.update(editingId, formData);
      } else {
        await anunciosAPI.create(formData);
      }
      
      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadAnuncios();
    } catch (err) {
      console.error('Error al guardar anuncio:', err);
      alert('Error al guardar el anuncio');
    }
  };

  const handleEdit = (anuncio) => {
    setEditingId(anuncio.id);
    setFormData({
      titulo: anuncio.titulo || '',
      mensaje: anuncio.mensaje || '',
      tipo: anuncio.tipo || 'info',
      prioridad: anuncio.prioridad || 'normal',
      fecha_inicio: anuncio.fecha_inicio 
        ? format(new Date(anuncio.fecha_inicio), 'yyyy-MM-dd\'T\'HH:mm')
        : format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
      fecha_fin: anuncio.fecha_fin 
        ? format(new Date(anuncio.fecha_fin), 'yyyy-MM-dd\'T\'HH:mm')
        : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este anuncio?')) {
      return;
    }

    try {
      await anunciosAPI.delete(id);
      loadAnuncios();
    } catch (err) {
      console.error('Error al eliminar anuncio:', err);
      alert('Error al eliminar el anuncio');
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      mensaje: '',
      tipo: 'info',
      prioridad: 'normal',
      fecha_inicio: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
      fecha_fin: '',
    });
  };

  const getTipoColor = (tipo) => {
    const colors = {
      info: '#2196F3',
      warning: '#FF9800',
      success: '#4CAF50',
      error: '#F44336',
    };
    return colors[tipo] || colors.info;
  };

  const getPrioridadColor = (prioridad) => {
    const colors = {
      urgente: '#F44336',
      alta: '#FF9800',
      normal: '#2196F3',
      baja: '#9E9E9E',
    };
    return colors[prioridad] || colors.normal;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gestión de Anuncios</h2>
        <p>Administra los anuncios que se mostrarán a los DJs en sus dashboards</p>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowForm(true);
          }}
          className={styles.addButton}
        >
          + Nuevo Anuncio
        </button>
      </div>

      {showForm && (
        <div className={styles.formContainer}>
          <h3>{editingId ? 'Editar Anuncio' : 'Nuevo Anuncio'}</h3>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Título:</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
                placeholder="Ej: Reunión de equipo"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Mensaje:</label>
              <textarea
                value={formData.mensaje}
                onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                required
                rows={6}
                placeholder="Escribe el contenido del anuncio..."
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Tipo:</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                >
                  <option value="info">ℹ️ Información</option>
                  <option value="warning">⚠️ Advertencia</option>
                  <option value="success">✅ Éxito</option>
                  <option value="error">❌ Error</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Prioridad:</label>
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

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Fecha de Inicio:</label>
                <input
                  type="datetime-local"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Fecha de Fin (opcional):</label>
                <input
                  type="datetime-local"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                />
              </div>
            </div>


            <div className={styles.formActions}>
              <button type="submit" className={styles.saveButton}>
                {editingId ? 'Actualizar' : 'Crear'} Anuncio
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
                }}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>
          <SkeletonCard count={3} />
        </div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : anuncios.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay anuncios creados aún</p>
        </div>
      ) : (
        <div className={styles.anunciosList}>
          {anuncios.map((anuncio) => (
            <div
              key={anuncio.id}
              className={styles.anuncioCard}
            >
              <div
                className={styles.anuncioHeader}
                style={{ borderLeftColor: getTipoColor(anuncio.tipo) }}
              >
                <div className={styles.anuncioTitleRow}>
                  <h3>{anuncio.titulo}</h3>
                  <div className={styles.anuncioBadges}>
                    <span
                      className={styles.badge}
                      style={{ backgroundColor: getTipoColor(anuncio.tipo) }}
                    >
                      {anuncio.tipo}
                    </span>
                    <span
                      className={styles.badge}
                      style={{ backgroundColor: getPrioridadColor(anuncio.prioridad) }}
                    >
                      {anuncio.prioridad}
                    </span>
                  </div>
                </div>
                <div className={styles.anuncioMeta}>
                  <span>
                    Creado por: {anuncio.creado_por_nombre || 'N/A'} el{' '}
                    {format(new Date(anuncio.fecha_creacion), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                  {anuncio.fecha_inicio && (
                    <span>
                      Visible desde:{' '}
                      {format(new Date(anuncio.fecha_inicio), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </span>
                  )}
                  {anuncio.fecha_fin && (
                    <span>
                      Visible hasta:{' '}
                      {format(new Date(anuncio.fecha_fin), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.anuncioContent}>
                <p>{anuncio.mensaje}</p>
              </div>
              <div className={styles.anuncioActions}>
                <button
                  type="button"
                  onClick={() => handleEdit(anuncio)}
                  className={styles.actionButton}
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(anuncio.id)}
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


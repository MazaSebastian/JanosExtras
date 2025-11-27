import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { anunciosAPI } from '@/services/api';
import styles from '@/styles/AnunciosDisplay.module.css';

export default function AnunciosDisplay() {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAnuncios, setDismissedAnuncios] = useState([]);

  useEffect(() => {
    loadAnuncios();
  }, []);

  const loadAnuncios = async () => {
    try {
      setLoading(true);
      // Para DJs, solo obtener anuncios activos y visibles
      const response = await anunciosAPI.getAll();
      const anunciosData = response.data || [];
      
      // Cargar anuncios descartados del localStorage
      const dismissed = JSON.parse(localStorage.getItem('dismissedAnuncios') || '[]');
      setDismissedAnuncios(dismissed);
      
      // Filtrar anuncios descartados y asegurar que estén activos y visibles
      const ahora = new Date();
      const visibleAnuncios = anunciosData.filter(a => {
        // No mostrar si fue descartado
        if (dismissed.includes(a.id)) return false;
        
        // Debe estar activo
        if (!a.activo) return false;
        
        // Verificar fecha de inicio
        if (a.fecha_inicio) {
          const fechaInicio = new Date(a.fecha_inicio);
          if (fechaInicio > ahora) return false;
        }
        
        // Verificar fecha de fin
        if (a.fecha_fin) {
          const fechaFin = new Date(a.fecha_fin);
          if (fechaFin < ahora) return false;
        }
        
        return true;
      });
      
      setAnuncios(visibleAnuncios);
    } catch (err) {
      console.error('Error al cargar anuncios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (anuncioId) => {
    const newDismissed = [...dismissedAnuncios, anuncioId];
    setDismissedAnuncios(newDismissed);
    localStorage.setItem('dismissedAnuncios', JSON.stringify(newDismissed));
    setAnuncios(anuncios.filter(a => a.id !== anuncioId));
  };

  const getTipoIcon = (tipo) => {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      success: '✅',
      error: '❌',
    };
    return icons[tipo] || 'ℹ️';
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

  if (loading) {
    return null; // No mostrar nada mientras carga
  }

  if (anuncios.length === 0) {
    return null; // No mostrar nada si no hay anuncios
  }

  return (
    <div className={styles.container}>
      {anuncios.map((anuncio) => (
        <div
          key={anuncio.id}
          className={styles.anuncioCard}
          style={{ borderLeftColor: getTipoColor(anuncio.tipo) }}
        >
          <div className={styles.anuncioHeader}>
            <div className={styles.anuncioTitleRow}>
              <div className={styles.anuncioIcon}>
                {getTipoIcon(anuncio.tipo)}
              </div>
              <div className={styles.anuncioTitleContent}>
                <h3>{anuncio.titulo}</h3>
                {anuncio.prioridad === 'urgente' || anuncio.prioridad === 'alta' ? (
                  <span
                    className={styles.prioridadBadge}
                    style={{ backgroundColor: getPrioridadColor(anuncio.prioridad) }}
                  >
                    {anuncio.prioridad.toUpperCase()}
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDismiss(anuncio.id)}
              className={styles.dismissButton}
              title="Cerrar"
            >
              ×
            </button>
          </div>
          <div className={styles.anuncioContent}>
            <p>{anuncio.mensaje}</p>
            {anuncio.fecha_fin && (
              <div className={styles.anuncioFooter}>
                <small>
                  Válido hasta:{' '}
                  {format(new Date(anuncio.fecha_fin), 'dd/MM/yyyy HH:mm', { locale: es })}
                </small>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}


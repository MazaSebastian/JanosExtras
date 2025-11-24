import { useState, useEffect, useMemo } from 'react';
import { adicionalesTecnicaAPI, salonesAPI } from '@/services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Loading, { SkeletonCard } from '@/components/Loading';
import styles from '@/styles/AdicionalesTecnica.module.css';

export default function AdicionalesTecnicaPanel() {
  const [adicionales, setAdicionales] = useState([]);
  const [salones, setSalones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    salon_id: '',
    fecha_evento: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadSalones();
  }, []);

  useEffect(() => {
    loadAdicionales();
  }, [filters]);

  const loadSalones = async () => {
    try {
      const response = await salonesAPI.getAll();
      // Asegurar que siempre sea un array
      const data = response?.data?.data || response?.data || [];
      setSalones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar salones:', err);
      setSalones([]); // Asegurar array vacío en caso de error
    }
  };

  const loadAdicionales = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filters.salon_id) params.salon_id = filters.salon_id;
      if (filters.fecha_evento) params.fecha_evento = filters.fecha_evento;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await adicionalesTecnicaAPI.getAll(params);
      // Asegurar que siempre sea un array
      const data = response?.data?.data || response?.data || [];
      setAdicionales(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar adicionales:', err);
      setError('No se pudieron cargar los adicionales técnicos.');
      setAdicionales([]); // Asegurar array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      salon_id: '',
      fecha_evento: '',
      startDate: '',
      endDate: '',
    });
  };

  const adicionalesFiltrados = useMemo(() => {
    return Array.isArray(adicionales) ? adicionales : [];
  }, [adicionales]);

  const getAdicionalesList = (adicionalesObj) => {
    if (!adicionalesObj || typeof adicionalesObj !== 'object') return [];
    return Object.entries(adicionalesObj)
      .filter(([_, value]) => value === true || (typeof value === 'string' && value))
      .map(([key, value]) => ({
        nombre: key.charAt(0).toUpperCase() + key.slice(1),
        valor: value === true ? 'Sí' : value,
      }));
  };

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <div>
          <p className={styles.subtitle}>Información Técnica</p>
          <h3 className={styles.title}>Adicionales Técnica</h3>
        </div>
      </header>

      {error && (
        <div className={styles.error}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Salón</label>
          <select
            value={filters.salon_id}
            onChange={(e) => handleFilterChange('salon_id', e.target.value)}
          >
            <option value="">Todos los salones</option>
            {Array.isArray(salones) && salones.map((salon) => (
              <option key={salon.id} value={salon.id}>
                {salon.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Fecha específica</label>
          <input
            type="date"
            value={filters.fecha_evento}
            onChange={(e) => handleFilterChange('fecha_evento', e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Desde</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Hasta</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>

        <button onClick={clearFilters} className={styles.clearButton}>
          Limpiar Filtros
        </button>
      </div>

      {loading ? (
        <SkeletonCard count={6} />
      ) : adicionalesFiltrados.length === 0 ? (
        <div className={styles.empty}>
          <p>
            {Object.values(filters).some((f) => f)
              ? 'No se encontraron adicionales con los filtros seleccionados.'
              : 'No hay adicionales técnicos disponibles.'}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {Array.isArray(adicionalesFiltrados) && adicionalesFiltrados.map((item) => {
            const adicionalesList = getAdicionalesList(item.adicionales);
            return (
              <div key={item.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h4>{item.salon_nombre}</h4>
                  <span className={styles.date}>
                    {format(new Date(item.fecha_evento), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>
                {adicionalesList.length > 0 ? (
                  <div className={styles.adicionalesList}>
                    {adicionalesList.map((adicional, index) => (
                      <div key={index} className={styles.adicionalItem}>
                        <span className={styles.adicionalName}>{adicional.nombre}:</span>
                        <span className={styles.adicionalValue}>{adicional.valor}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noAdicionales}>Sin adicionales registrados</p>
                )}
                {item.notas && (
                  <div className={styles.notas}>
                    <strong>Notas:</strong> {item.notas}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


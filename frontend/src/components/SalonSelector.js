import { useState, useEffect } from 'react';
import { salonesAPI } from '@/services/api';
import styles from '@/styles/SalonSelector.module.css';

export default function SalonSelector({ selectedSalon, onSalonChange }) {
  const [salones, setSalones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSalones();
  }, []);

  const loadSalones = async () => {
    try {
      setLoading(true);
      const response = await salonesAPI.getAll();
      setSalones(response.data);
      
      // Si no hay salón seleccionado y hay salones, seleccionar el primero
      if (!selectedSalon && response.data.length > 0) {
        onSalonChange(response.data[0].id);
      }
    } catch (err) {
      setError('Error al cargar salones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.container}>Cargando salones...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <label className={styles.label}>Seleccionar Salón:</label>
      <select
        value={selectedSalon || ''}
        onChange={(e) => onSalonChange(parseInt(e.target.value))}
        className={styles.select}
      >
        <option value="">-- Selecciona un salón --</option>
        {salones.map((salon) => (
          <option key={salon.id} value={salon.id}>
            {salon.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}


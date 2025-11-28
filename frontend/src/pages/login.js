import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authAPI, salonesAPI } from '@/services/api';
import { setAuth } from '@/utils/auth';
import { LoadingButton } from '@/components/Loading';
import styles from '@/styles/Login.module.css';

export default function Login() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    password: '',
    salon_id: null,
  });
  const [salones, setSalones] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSalones, setLoadingSalones] = useState(false);

  useEffect(() => {
    if (isRegister) {
      loadSalones();
    }
  }, [isRegister]);

  const loadSalones = async () => {
    try {
      setLoadingSalones(true);
      // Usar endpoint público para obtener salones sin autenticación
      const response = await fetch('/api/salones/public');
      if (!response.ok) throw new Error('Error al cargar salones');
      const data = await response.json();
      setSalones(data);
      // Seleccionar "CABA Boutique" por defecto (primer salón de la lista)
      const salonDefault = data.find(s => s.nombre === 'CABA Boutique');
      if (salonDefault) {
        setFormData(prev => ({ ...prev, salon_id: salonDefault.id }));
      } else if (data.length > 0) {
        // Si no existe "CABA Boutique", seleccionar el primero
        setFormData(prev => ({ ...prev, salon_id: data[0].id }));
      }
    } catch (err) {
      console.error('Error al cargar salones:', err);
      // Si falla, usar valores por defecto
      const defaultSalones = [
        { id: 1, nombre: 'CABA Boutique' },
        { id: 2, nombre: 'Caballito 1' },
        { id: 3, nombre: 'Caballito 2' },
        { id: 4, nombre: 'Costanera 1' },
        { id: 5, nombre: 'Costanera 2' },
        { id: 6, nombre: 'Dardo Rocha' },
        { id: 7, nombre: 'Darwin 1' },
        { id: 8, nombre: 'Darwin 2' },
        { id: 9, nombre: 'Dot' },
        { id: 10, nombre: 'Lahusen' },
        { id: 11, nombre: 'Nuñez' },
        { id: 12, nombre: 'Palermo Hollywood' },
        { id: 13, nombre: 'Palermo Soho' },
        { id: 14, nombre: 'Puerto Madero' },
        { id: 15, nombre: 'Puerto Madero Boutique' },
        { id: 16, nombre: 'San Isidro' },
        { id: 17, nombre: 'San Telmo' },
        { id: 18, nombre: 'San Telmo 2' },
        { id: 19, nombre: 'San Telmo Boutique' },
        { id: 20, nombre: 'Vicente López' }
      ];
      setSalones(defaultSalones);
      setFormData(prev => ({ ...prev, salon_id: 1 }));
    } finally {
      setLoadingSalones(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const response = await authAPI.register(formData);
        if (response.data) {
          setError('');
          setIsRegister(false);
          alert('Registro exitoso. Ahora puedes iniciar sesión.');
        }
      } else {
        const response = await authAPI.login({
          nombre: formData.nombre,
          password: formData.password,
        });
        if (response.data.token) {
          setAuth(response.data.token, response.data.dj);
          if (response.data.dj.rol === 'admin') {
            router.push('/admin');
          } else {
            router.push('/dashboard/home');
          }
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 'Error al procesar la solicitud'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          {isRegister ? 'Registro de DJ' : 'Iniciar Sesión'}
        </h1>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              placeholder={isRegister ? "Tu nombre completo" : "Tu nombre de usuario"}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          {isRegister && (
            <div className={styles.inputGroup}>
              <label>Salón</label>
              {loadingSalones ? (
                <div className={styles.loadingText}>Cargando salones...</div>
              ) : (
                <select
                  name="salon_id"
                  value={formData.salon_id || ''}
                  onChange={(e) => setFormData({ ...formData, salon_id: parseInt(e.target.value) })}
                  required
                  className={styles.select}
                >
                  <option value="">-- Selecciona un salón --</option>
                  {salones.map((salon) => (
                    <option key={salon.id} value={salon.id}>
                      {salon.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <LoadingButton
            type="submit"
            className={styles.submitButton}
            disabled={loading || (isRegister && !formData.salon_id)}
            loading={loading}
          >
            {isRegister ? 'Registrarse' : 'Iniciar Sesión'}
          </LoadingButton>
        </form>

        <p className={styles.switch}>
          {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className={styles.switchButton}
          >
            {isRegister ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </p>
      </div>
    </div>
  );
}


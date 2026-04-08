import { useState } from 'react';
import { useRouter } from 'next/router';
import { authAPI } from '@/services/api';
import { setAuth } from '@/utils/auth';
import { LoadingButton } from '@/components/Loading';
import styles from '@/styles/Login.module.css';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
          Iniciar Sesión
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
              placeholder="Tu nombre de usuario"
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

          <LoadingButton
            type="submit"
            className={styles.submitButton}
            disabled={loading}
            loading={loading}
          >
            Iniciar Sesión
          </LoadingButton>
        </form>
      </div>
    </div>
  );
}


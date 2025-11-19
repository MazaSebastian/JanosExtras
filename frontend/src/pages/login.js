import { useState } from 'react';
import { useRouter } from 'next/router';
import { authAPI } from '@/services/api';
import { setAuth } from '@/utils/auth';
import styles from '@/styles/Login.module.css';

export default function Login() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
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
          router.push('/dashboard');
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

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Procesando...' : isRegister ? 'Registrarse' : 'Iniciar Sesión'}
          </button>
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


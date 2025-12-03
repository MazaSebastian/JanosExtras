import { useState, useEffect } from 'react';
import api from '@/services/api';
import styles from '@/styles/GoogleCalendarConnect.module.css';

/**
 * Componente para conectar/desconectar Google Calendar
 */
export default function GoogleCalendarConnect({ onStatusChange }) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/google-calendar/status');
      setConnected(response.data.connected);
      if (onStatusChange) {
        onStatusChange(response.data.connected);
      }
    } catch (error) {
      console.error('Error al verificar estado de Google Calendar:', error);
      // Si es un error 401, el usuario no está autenticado, pero no mostramos el componente de error
      if (error.response?.status !== 401) {
        // Solo mostrar error si no es de autenticación
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const response = await api.get('/google-calendar/auth');
      
      if (response.data.authUrl) {
        // Redirigir a Google OAuth
        window.location.href = response.data.authUrl;
      } else {
        alert('Error al obtener URL de autenticación');
      }
    } catch (error) {
      console.error('Error al conectar Google Calendar:', error);
      alert('Error al conectar Google Calendar. Por favor, intenta de nuevo.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de que deseas desconectar Google Calendar? Esto no eliminará los eventos ya creados.')) {
      return;
    }

    try {
      setDisconnecting(true);
      const response = await api.delete('/google-calendar/disconnect');
      
      if (response.data.success) {
        setConnected(false);
        if (onStatusChange) {
          onStatusChange(false);
        }
        alert('Google Calendar desconectado correctamente');
      } else {
        alert('Error al desconectar Google Calendar');
      }
    } catch (error) {
      console.error('Error al desconectar Google Calendar:', error);
      alert('Error al desconectar Google Calendar. Por favor, intenta de nuevo.');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Verificando conexión...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>📅</span>
        <div className={styles.info}>
          <h3 className={styles.title}>Google Calendar</h3>
          <p className={styles.description}>
            {connected 
              ? 'Conectado - Puedes agendar videollamadas desde las coordinaciones'
              : 'Conecta tu cuenta de Google Calendar para agendar videollamadas automáticamente'}
          </p>
        </div>
      </div>
      
      <div className={styles.status}>
        <span className={`${styles.statusIndicator} ${connected ? styles.connected : styles.disconnected}`}>
          {connected ? '✓ Conectado' : '○ Desconectado'}
        </span>
      </div>

      <div className={styles.actions}>
        {connected ? (
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className={styles.disconnectButton}
          >
            {disconnecting ? 'Desconectando...' : 'Desconectar Google Calendar'}
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className={styles.connectButton}
          >
            {connecting ? 'Conectando...' : 'Conectar Google Calendar'}
          </button>
        )}
      </div>
    </div>
  );
}


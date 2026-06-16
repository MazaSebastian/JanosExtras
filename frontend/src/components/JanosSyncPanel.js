import { useState, useEffect, useRef } from 'react';
import styles from '@/styles/JanosSyncPanel.module.css';

export default function JanosSyncPanel() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [scriptDetected, setScriptDetected] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, progress, sending, success, error
  const [progress, setProgress] = useState({ current: 0, total: 0, codigo: '' });
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [iframeUrl, setIframeUrl] = useState('https://tecnica.janosgroup.com/index.php');
  const [debugLogs, setDebugLogs] = useState([]);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef(null);

  // Cargar credenciales guardadas al montar
  useEffect(() => {
    const stored = localStorage.getItem('janos_sync_credentials');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.usuario) setUsuario(parsed.usuario);
        if (parsed.contrasena) setContrasena(parsed.contrasena);
      } catch (e) {
        console.warn('Error parseando credenciales');
      }
    }
  }, []);

  // Escuchar errores globales y clicks para diagnóstico
  useEffect(() => {
    const handleError = (e) => {
      setDebugLogs(prev => [...prev, `[ERROR] ${e.message || e.error || e}`]);
    };
    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Escuchar mensajes del UserScript
  useEffect(() => {
    const handleMessage = (event) => {
      // Registrar todos los mensajes para diagnóstico
      if (event.data && event.data.type) {
        setDebugLogs(prev => [...prev, `[MSG RECEIVED] type: ${event.data.type} from origin: ${event.origin}`]);
      }

      // Aceptar del portal Jano's o de nuestra propia página
      const isTrusted = event.origin.includes('janosgroup.com') || event.origin === window.location.origin;
      if (!isTrusted) return;

      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'JANOS_SYNC_SCRIPT_LOADED' || data.type === 'JANOS_SYNC_SCRIPT_INSTALLED_PING') {
        setScriptDetected(true);
        setDebugLogs(prev => [...prev, `[SUCCESS] Jano's Sync Script detected/activated`]);
      }

      if (data.type === 'JANOS_SYNC_REQUEST_CREDS') {
        setDebugLogs(prev => [...prev, `[REQUEST] Iframe requested login credentials`]);
        // Enviar credenciales guardadas de forma automática al script si existen
        const stored = localStorage.getItem('janos_sync_credentials');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.usuario && parsed.contrasena && iframeRef.current) {
              const userToken = localStorage.getItem('token');
              iframeRef.current.contentWindow.postMessage(
                {
                  type: 'JANOS_SYNC_AUTO_LOGIN',
                  usuario: parsed.usuario,
                  contrasena: parsed.contrasena,
                  token: userToken
                },
                '*'
              );
              setDebugLogs(prev => [...prev, `[SUCCESS] Sent credentials response to iframe query`]);
            }
          } catch (e) {
            console.error('Error enviando credenciales automáticas', e);
            setDebugLogs(prev => [...prev, `[ERR] Error parsing credentials on request: ${e.message}`]);
          }
        } else {
          setDebugLogs(prev => [...prev, `[INFO] Iframe requested credentials but none are stored locally`]);
        }
      }

      if (data.type === 'JANOS_SYNC_PROGRESS') {
        setSyncStatus('progress');
        setProgress({
          current: data.current,
          total: data.total,
          codigo: data.codigo
        });
      }

      if (data.type === 'JANOS_SYNC_SENDING') {
        setSyncStatus('sending');
      }

      if (data.type === 'JANOS_SYNC_SUCCESS') {
        setSyncStatus('success');
        setReport(data.report);
        setError(null);
      }

      if (data.type === 'JANOS_SYNC_ERROR') {
        setSyncStatus('error');
        setError(data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Enviar pings para detectar si el UserScript está activo en la página
  useEffect(() => {
    let pingInterval;
    
    const startPinging = () => {
      if (scriptDetected) return;
      
      // Detener cualquier interval previo
      if (pingInterval) clearInterval(pingInterval);
      
      // Mandar ping de inmediato
      window.postMessage({ type: 'JANOS_SYNC_CHECK_PING' }, window.location.origin);
      
      // Configurar interval
      pingInterval = setInterval(() => {
        window.postMessage({ type: 'JANOS_SYNC_CHECK_PING' }, window.location.origin);
      }, 1500);
    };

    startPinging();

    // Re-iniciar pings cuando el usuario vuelve a enfocar la pestaña
    window.addEventListener('focus', startPinging);

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      window.removeEventListener('focus', startPinging);
    };
  }, [scriptDetected]);

  // Guardar credenciales
  const handleSaveCredentials = (e) => {
    e.preventDefault();
    setDebugLogs(prev => [...prev, '[CLICK] Guardar Credenciales clicked']);
    localStorage.setItem(
      'janos_sync_credentials',
      JSON.stringify({ usuario, contrasena })
    );
    setDebugLogs(prev => [...prev, '[SUCCESS] Credenciales guardadas en localStorage']);
    alert('🔐 Credenciales guardadas localmente en tu navegador.');
    
    // Si el iframe está cargado, enviarle las nuevas credenciales de inmediato
    if (iframeRef.current) {
      try {
        const userToken = localStorage.getItem('token');
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'JANOS_SYNC_AUTO_LOGIN',
            usuario,
            contrasena,
            token: userToken
          },
          '*'
        );
        setDebugLogs(prev => [...prev, '[SUCCESS] Sent credentials auto-login postMessage to iframe']);
      } catch (err) {
        setDebugLogs(prev => [...prev, `[ERR] Failed to postMessage: ${err.message}`]);
      }
    }
  };

  // Rellenar credenciales manualmente en el portal
  const handleAutoLogin = () => {
    setDebugLogs(prev => [...prev, '[CLICK] Autorellenar Portal clicked']);
    if (!usuario || !contrasena) {
      alert('⚠️ Por favor, ingresá las credenciales primero.');
      return;
    }
    if (iframeRef.current) {
      try {
        const userToken = localStorage.getItem('token');
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'JANOS_SYNC_AUTO_LOGIN',
            usuario,
            contrasena,
            isManual: true,
            token: userToken
          },
          '*'
        );
        setDebugLogs(prev => [...prev, '[SUCCESS] Sent credentials manual-login postMessage to iframe']);
      } catch (err) {
        setDebugLogs(prev => [...prev, `[ERR] Failed to postMessage: ${err.message}`]);
      }
    } else {
      setDebugLogs(prev => [...prev, '[ERR] iframeRef.current is null on login!']);
    }
  };

  // Recargar el navegador interno
  const handleReloadIframe = () => {
    setDebugLogs(prev => [...prev, '[CLICK] Recargar iframe clicked']);
    // Forzar re-montaje destruyendo y creando el iframe mediante un cambio de key
    setIframeKey(prev => prev + 1);
    setSyncStatus('idle');
    setReport(null);
    setError(null);
    setDebugLogs(prev => [...prev, '[SUCCESS] Iframe destroyed and remounted to force fresh reload']);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Jano's Sync Integration</h1>
        <p className={styles.subtitle}>
          Sincronizá tus salones de eventos y datos de clientes de forma automatizada y sin errores.
        </p>
      </div>

      <div className={styles.grid}>
        {/* CARD 1: INSTRUCCIONES */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <span>🛠️</span> Guía de Instalación del Script
          </h3>
          
          <div
            className={`${styles.statusIndicator} ${
              scriptDetected ? styles.statusDetected : styles.statusNotDetected
            }`}
          >
            <span className={styles.pulseDot}></span>
            {scriptDetected ? 'Extensión Jano\'s Sync Activa' : 'UserScript no detectado'}
          </div>

          <div className={styles.stepList}>
            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepContent}>
                <span className={styles.stepTitle}>Instalá Tampermonkey</span>
                <span className={styles.stepDesc}>
                  Descargá la extensión oficial de Tampermonkey en tu navegador Chrome u otro compatible.
                </span>
              </div>
            </div>

            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>2</span>
              <div className={styles.stepContent}>
                <span className={styles.stepTitle}>Instalá el Script Jano's Sync</span>
                <span className={styles.stepDesc}>
                  Hacé clic en el botón de abajo. Tampermonkey se abrirá y te pedirá confirmar la instalación.
                </span>
              </div>
            </div>

            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>3</span>
              <div className={styles.stepContent}>
                <span className={styles.stepTitle}>¡Sincronizá!</span>
                <span className={styles.stepDesc}>
                  Iniciá sesión en el portal dentro del visor de abajo o en una pestaña nueva, y presioná el botón "⚡ Sincronizar Eventos".
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <a
              href="/api/coordinaciones/install-script.user.js"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.buttonPrimary}
              style={{ flex: 1 }}
            >
              📥 Instalar / Actualizar Script
            </a>
            <a
              href="https://tecnica.janosgroup.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.buttonSecondary}
            >
              🌐 Abrir en Pestaña Nueva
            </a>
          </div>
        </div>

        {/* CARD 2: CREDENCIALES */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <span>🔐</span> Credenciales Corporativas (Jano's Portal)
          </h3>
          <p className={styles.cardSubtitle} style={{ marginTop: '-8px' }}>
            Estas credenciales se guardan localmente en este navegador para completar el inicio de sesión del portal automáticamente.
          </p>

          <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flex: '1', flexDirection: 'column', gap: '16px' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Usuario / Email Corporativo</label>
              <input
                type="text"
                className={styles.input}
                placeholder="ej: costanera1@janosgroup.com"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Contraseña</label>
              <div className={styles.inputWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="••••••••••••"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '12px' }}>
              <button type="submit" className={styles.buttonPrimary} style={{ flex: 1 }}>
                💾 Guardar Credenciales
              </button>
              <button
                type="button"
                className={styles.buttonSecondary}
                onClick={handleAutoLogin}
                disabled={!usuario}
              >
                🔑 Autorellenar Portal
              </button>
            </div>
          </form>
        </div>

        {/* LOGGER DE PROGRESO */}
        {(syncStatus !== 'idle' || error || report) && (
          <div className={styles.syncLogger}>
            <div className={styles.logStatus}>
              {syncStatus === 'progress' && (
                <>
                  <span>⏳</span> Sincronizando eventos y descargando fichas de clientes...
                </>
              )}
              {syncStatus === 'sending' && (
                <>
                  <span>📤</span> Transfiriendo datos optimizados a la base de datos de Extras...
                </>
              )}
              {syncStatus === 'success' && (
                <>
                  <span>🎉</span> ¡Sincronización completada con éxito!
                </>
              )}
              {syncStatus === 'error' && (
                <>
                  <span>❌</span> Error durante el proceso de sincronización
                </>
              )}
            </div>

            {syncStatus === 'progress' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressValue}
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                  <span>Procesando: Código {progress.codigo}</span>
                  <span>{progress.current} / {progress.total} eventos</span>
                </div>
              </div>
            )}

            {syncStatus === 'progress' && (
              <div className={styles.logDetails}>
                [INFO] Iniciando conexión con técnica.janosgroup.com...<br />
                [INFO] Leyendo tabla DOM de planillas en salón...<br />
                [DOWNLOAD] Extrayendo ficha de cliente para código: {progress.codigo}...
              </div>
            )}

            {syncStatus === 'success' && report && (
              <div className={styles.successReport}>
                <div className={styles.successTitle}>Resumen del proceso de sincronización:</div>
                <div className={styles.successGrid}>
                  <div className={styles.successItem}>
                    Leídos <span className={styles.successValue}>{report.recibidos}</span>
                  </div>
                  <div className={styles.successItem}>
                    Creados <span className={styles.successValue}>{report.creados}</span>
                  </div>
                  <div className={styles.successItem}>
                    Actualizados <span className={styles.successValue}>{report.actualizados}</span>
                  </div>
                  <div className={styles.successItem}>
                    Errores <span className={styles.successValue}>{report.errores.length}</span>
                  </div>
                </div>
                {report.errores.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#f87171' }}>
                    <strong>Errores registrados:</strong>
                    <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                      {report.errores.slice(0, 3).map((err, idx) => (
                        <li key={idx}>Evento {err.codigo}: {err.error}</li>
                      ))}
                      {report.errores.length > 3 && <li>... y {report.errores.length - 3} más.</li>}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {syncStatus === 'error' && error && (
              <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '13px' }}>
                🚨 {error}
              </div>
            )}
          </div>
        )}

        {/* NAVEGADOR DE PORTAL JANO'S */}
        <div className={styles.browserSection}>
          <div className={styles.browserHeader}>
            <div className={styles.browserDots}>
              <span className={`${styles.browserDot} ${styles.browserDotRed}`}></span>
              <span className={`${styles.browserDot} ${styles.browserDotYellow}`}></span>
              <span className={`${styles.browserDot} ${styles.browserDotGreen}`}></span>
            </div>
            
            <div className={styles.browserAddressBar}>
              <span className={styles.browserLock}>🔒</span>
              <span>tecnica.janosgroup.com/index.php</span>
            </div>

            <div className={styles.browserActions} style={{ display: 'flex', gap: '8px' }}>
              <button
                className={styles.buttonSecondary}
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={handleReloadIframe}
              >
                🔄 Recargar
              </button>
              <a
                href="https://tecnica.janosgroup.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.buttonSecondary}
                style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                🌐 Abrir en Pestaña Nueva
              </a>
            </div>
          </div>

          <div className={styles.browserAlert}>
            <span>
              ℹ️ Si el visor no carga o muestra pantalla en blanco por políticas de seguridad del portal, podés usar el botón <strong>"Abrir en Pestaña Nueva"</strong> de arriba para operar en otra ventana con el script.
            </span>
          </div>

          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={iframeUrl}
            className={styles.browserFrame}
            title="Portal Jano's"
          />
        </div>

        {/* DEBUG LOGS */}
        <div style={{
          gridColumn: '1 / -1',
          background: '#0e0a1a',
          border: '1px solid rgba(124, 58, 237, 0.4)',
          borderRadius: '16px',
          padding: '20px',
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontWeight: 'bold', color: '#c084fc', borderBottom: '1px solid rgba(124, 58, 237, 0.2)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🛠️ Diagnósticos de Consola en Tiempo Real</span>
            <button 
              type="button" 
              onClick={() => setDebugLogs([])} 
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
            >
              Limpiar
            </button>
          </div>
          <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {debugLogs.length === 0 ? (
              <div style={{ color: '#64748b' }}>No se han registrado eventos todavía. Probá hacer clic en los botones.</div>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index} style={{ color: log.includes('[ERR') || log.includes('[ERROR') ? '#f87171' : log.includes('[SUCCESS') ? '#34d399' : '#cbd5e1' }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

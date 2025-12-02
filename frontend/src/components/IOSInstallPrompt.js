import { useState, useEffect } from 'react';
import styles from '@/styles/IOSInstallPrompt.module.css';

/**
 * Componente que detecta si el usuario está en iOS usando Chrome
 * y muestra un mensaje para que use Safari para instalar la app
 */
export default function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isChrome, setIsChrome] = useState(false);

  useEffect(() => {
    // Detectar si es iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    // Detectar si es Chrome (pero no Safari)
    const isChromeBrowser = /Chrome/.test(navigator.userAgent) && !/Safari/.test(navigator.userAgent.replace(/Chrome/g, ''));
    // También detectar si es Chrome en iOS (que tiene un user agent diferente)
    const isChromeOnIOS = iOS && /CriOS/.test(navigator.userAgent);
    
    setIsIOS(iOS);
    setIsChrome(isChromeBrowser || isChromeOnIOS);
    
    // Mostrar el prompt si es iOS y está usando Chrome
    if (iOS && (isChromeBrowser || isChromeOnIOS)) {
      // Verificar si ya se cerró antes (localStorage)
      const dismissed = localStorage.getItem('ios-install-prompt-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-install-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className={styles.promptContainer}>
      <div className={styles.promptContent}>
        <div className={styles.promptIcon}>📱</div>
        <h3 className={styles.promptTitle}>¿Quieres agregar la app a tu pantalla de inicio?</h3>
        <p className={styles.promptMessage}>
          Para instalar esta aplicación en iOS, debes usar <strong>Safari</strong>, no Chrome.
        </p>
        <div className={styles.promptSteps}>
          <p>1. Abre esta página en <strong>Safari</strong></p>
          <p>2. Toca el botón <strong>Compartir</strong> (cuadrado con flecha)</p>
          <p>3. Selecciona <strong>"Agregar a pantalla de inicio"</strong></p>
        </div>
        <div className={styles.promptActions}>
          <button 
            className={styles.promptButton}
            onClick={handleDismiss}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}


import { useState, useRef, useEffect } from 'react';
import styles from '@/styles/ChatbotPreCoordinacion.module.css';

/**
 * Componente Chatbot para Pre-Coordinación
 * Fase 1: MVP con reglas simples
 * 
 * Características:
 * - No invasivo: se puede minimizar/cerrar
 * - Opcional: no afecta el flujo principal
 * - Integrado: conoce el contexto del formulario
 */
export default function ChatbotPreCoordinacion({ 
  tipoEvento = null, 
  pasoActual = 1,
  respuestasCliente = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const mensajesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Mensaje inicial cuando se abre el chatbot
  useEffect(() => {
    if (isOpen && mensajes.length === 0) {
      setMensajes([{
        tipo: 'bot',
        texto: '¡Hola! 👋 Soy tu asistente para la pre-coordinación. ¿En qué puedo ayudarte? Puedes preguntarme sobre términos, pedirme sugerencias de canciones, o cualquier duda sobre el proceso.',
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (mensajesEndRef.current) {
      mensajesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes]);

  // Focus en input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const enviarMensaje = async (e) => {
    e?.preventDefault();
    
    if (!inputMensaje.trim() || enviando) return;

    const mensajeUsuario = inputMensaje.trim();
    setInputMensaje('');
    setEnviando(true);

    // Agregar mensaje del usuario
    const nuevoMensaje = {
      tipo: 'usuario',
      texto: mensajeUsuario,
      timestamp: new Date()
    };
    setMensajes(prev => [...prev, nuevoMensaje]);

    try {
      console.log('[Chatbot Frontend] Enviando mensaje:', mensajeUsuario);
      console.log('[Chatbot Frontend] Contexto:', { tipoEvento, pasoActual, respuestasCliente });
      
      // Llamar a la API del chatbot
      const response = await fetch('/api/pre-coordinacion/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensaje: mensajeUsuario,
          contexto: {
            tipoEvento,
            pasoActual,
            respuestasCliente
          }
        })
      });

      console.log('[Chatbot Frontend] Response status:', response.status);
      console.log('[Chatbot Frontend] Response ok:', response.ok);

      const data = await response.json();
      console.log('[Chatbot Frontend] Response data:', data);
      console.log('[Chatbot Frontend] Fuente de respuesta:', data.fuente || 'no especificada');

      if (response.ok) {
        // Agregar respuesta del bot
        setMensajes(prev => [...prev, {
          tipo: 'bot',
          texto: data.respuesta,
          timestamp: new Date(),
          sugerencias: data.sugerencias,
          fuente: data.fuente // Para debugging
        }]);
      } else {
        throw new Error(data.error || 'Error al procesar mensaje');
      }
    } catch (error) {
      console.error('[Chatbot Frontend] Error al enviar mensaje:', error);
      console.error('[Chatbot Frontend] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setMensajes(prev => [...prev, {
        tipo: 'bot',
        texto: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date(),
        error: true
      }]);
    } finally {
      setEnviando(false);
      // Focus de vuelta al input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  // Si está cerrado, mostrar solo el botón flotante
  if (!isOpen) {
    return (
      <button
        className={styles.chatbotToggle}
        onClick={toggleChatbot}
        aria-label="Abrir asistente"
        title="¿Necesitas ayuda? Haz clic aquí"
      >
        <span className={styles.chatbotIcon}>💬</span>
        <span className={styles.chatbotBadge}>¿Ayuda?</span>
      </button>
    );
  }

  // Si está abierto, mostrar el chat completo
  return (
    <div className={styles.chatbotContainer}>
      <div className={styles.chatbotHeader}>
        <div className={styles.chatbotHeaderInfo}>
          <span className={styles.chatbotIcon}>💬</span>
          <div>
            <h3 className={styles.chatbotTitle}>Asistente de Pre-Coordinación</h3>
            <p className={styles.chatbotSubtitle}>Estoy aquí para ayudarte</p>
          </div>
        </div>
        <button
          className={styles.chatbotClose}
          onClick={toggleChatbot}
          aria-label="Cerrar asistente"
        >
          ×
        </button>
      </div>

      <div className={styles.chatbotMessages}>
        {mensajes.map((mensaje, index) => (
          <div
            key={index}
            className={`${styles.chatbotMessage} ${
              mensaje.tipo === 'usuario' ? styles.chatbotMessageUser : styles.chatbotMessageBot
            }`}
          >
            <div className={styles.chatbotMessageContent}>
              {mensaje.texto.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < mensaje.texto.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
            {mensaje.sugerencias && mensaje.sugerencias.length > 0 && (
              <div className={styles.chatbotSuggestions}>
                {mensaje.sugerencias.map((sugerencia, i) => (
                  <button
                    key={i}
                    className={styles.chatbotSuggestionButton}
                    onClick={() => {
                      setInputMensaje(`Me gusta "${sugerencia}"`);
                      inputRef.current?.focus();
                    }}
                  >
                    {sugerencia}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {enviando && (
          <div className={`${styles.chatbotMessage} ${styles.chatbotMessageBot}`}>
            <div className={styles.chatbotMessageContent}>
              <span className={styles.chatbotTyping}>Escribiendo...</span>
            </div>
          </div>
        )}
        <div ref={mensajesEndRef} />
      </div>

      <form className={styles.chatbotInputContainer} onSubmit={enviarMensaje}>
        <input
          ref={inputRef}
          type="text"
          value={inputMensaje}
          onChange={(e) => setInputMensaje(e.target.value)}
          placeholder="Escribe tu pregunta..."
          className={styles.chatbotInput}
          disabled={enviando}
          maxLength={500}
        />
        <button
          type="submit"
          className={styles.chatbotSendButton}
          disabled={!inputMensaje.trim() || enviando}
          aria-label="Enviar mensaje"
        >
          {enviando ? '⏳' : '➤'}
        </button>
      </form>
    </div>
  );
}


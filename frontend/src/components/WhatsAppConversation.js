import { useState, useEffect, useRef } from 'react';
import { whatsappAPI } from '@/services/api';
import WhatsAppMessage from './WhatsAppMessage';
import Loading from './Loading';
import styles from '@/styles/WhatsAppConversation.module.css';

/**
 * Vista de conversación individual de WhatsApp
 */
export default function WhatsAppConversation({ conversation, onBack, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (conversation) {
      loadMessages();
    }
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await whatsappAPI.getMessages(conversation.phone_number);
      setMessages(data.mensajes || []);
    } catch (err) {
      console.error('Error al cargar mensajes:', err);
      setError('Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || sending) return;

    try {
      setSending(true);
      setError('');

      await whatsappAPI.send({
        coordinacion_id: conversation.coordinacion_id,
        message: messageText.trim()
      });

      setMessageText('');
      
      // Recargar mensajes después de un breve delay
      setTimeout(() => {
        loadMessages();
      }, 1000);
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      setError(err.response?.data?.error || 'Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const contactName = conversation.nombre_cliente || 
                      conversation.coordinacion_titulo || 
                      conversation.phone_number;

  return (
    <div className={styles.conversationView}>
      <div className={styles.conversationHeader}>
        <button className={styles.backButton} onClick={onBack}>
          ←
        </button>
        <div className={styles.headerInfo}>
          <div className={styles.contactAvatar}>
            {contactName[0]?.toUpperCase() || '?'}
          </div>
          <div className={styles.contactDetails}>
            <h3 className={styles.contactName}>{contactName}</h3>
            {conversation.coordinacion_titulo && (
              <p className={styles.coordinacionInfo}>
                📋 {conversation.coordinacion_titulo}
              </p>
            )}
          </div>
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
      </div>

      <div className={styles.messagesContainer} ref={messagesContainerRef}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Loading message="Cargando mensajes..." size="small" />
          </div>
        ) : error && messages.length === 0 ? (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <button onClick={loadMessages} className={styles.retryButton}>
              Reintentar
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No hay mensajes aún</p>
            <p className={styles.emptyHint}>Envía un mensaje para comenzar la conversación</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <WhatsAppMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {error && messages.length > 0 && (
        <div className={styles.errorBanner}>
          {error}
        </div>
      )}

      <form className={styles.messageInputContainer} onSubmit={handleSendMessage}>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Escribe un mensaje..."
          className={styles.messageInput}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!messageText.trim() || sending}
          className={styles.sendButton}
        >
          {sending ? '⏳' : '📤'}
        </button>
      </form>
    </div>
  );
}


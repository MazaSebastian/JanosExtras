import { useState, useEffect, useCallback } from 'react';
import { whatsappAPI } from '@/services/api';
import WhatsAppConversation from './WhatsAppConversation';
import Loading from './Loading';
import styles from '@/styles/WhatsAppChatPanel.module.css';

/**
 * Panel lateral de WhatsApp con lista de conversaciones y vista de conversación
 */
export default function WhatsAppChatPanel({ isOpen, onClose, coordinacionId = null }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await whatsappAPI.getConversations();
      console.log('📋 Conversaciones cargadas:', data);
      setConversations(data || []);
    } catch (err) {
      console.error('❌ Error al cargar conversaciones:', err);
      console.error('Detalles del error:', err.response?.data || err.message);
      setError('Error al cargar conversaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, loadConversations]);

  // Actualizar conversaciones cada 10 segundos cuando el panel está abierto
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      loadConversations();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isOpen, loadConversations]);

  // Si se pasa coordinacionId, abrir esa conversación automáticamente
  useEffect(() => {
    if (coordinacionId && conversations.length > 0) {
      const conv = conversations.find(c => c.coordinacion_id === coordinacionId);
      if (conv) {
        setSelectedConversation(conv);
      }
    }
  }, [coordinacionId, conversations]);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    loadConversations(); // Recargar para actualizar contadores
  };

  // Exponer función para recargar desde componentes hijos
  useEffect(() => {
    if (selectedConversation) {
      // Si hay una conversación seleccionada, recargar la lista periódicamente
      // para detectar nuevas conversaciones
      const interval = setInterval(() => {
        loadConversations();
      }, 15000); // Cada 15 segundos
      
      return () => clearInterval(interval);
    }
  }, [selectedConversation, loadConversations]);

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.nombre_cliente?.toLowerCase().includes(query) ||
      conv.coordinacion_titulo?.toLowerCase().includes(query) ||
      conv.phone_number?.includes(query) ||
      conv.last_message_preview?.toLowerCase().includes(query)
    );
  });

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {!selectedConversation ? (
          // Vista de lista de conversaciones
          <>
            <div className={styles.header}>
              <h2 className={styles.title}>💬 WhatsApp</h2>
              <button className={styles.closeButton} onClick={onClose}>
                ×
              </button>
            </div>

            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Buscar conversaciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            {loading ? (
              <div className={styles.loadingContainer}>
                <Loading message="Cargando conversaciones..." size="small" />
              </div>
            ) : error ? (
              <div className={styles.errorContainer}>
                <p>{error}</p>
                <button onClick={loadConversations} className={styles.retryButton}>
                  Reintentar
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No hay conversaciones</p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className={styles.clearSearchButton}>
                    Limpiar búsqueda
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.conversationsList}>
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`${styles.conversationItem} ${
                      conv.unread_count > 0 ? styles.unread : ''
                    }`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className={styles.conversationAvatar}>
                      {conv.nombre_cliente?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className={styles.conversationContent}>
                      <div className={styles.conversationHeader}>
                        <span className={styles.conversationName}>
                          {conv.nombre_cliente || conv.coordinacion_titulo || conv.phone_number}
                        </span>
                        {conv.last_message_at && (
                          <span className={styles.conversationTime}>
                            {new Date(conv.last_message_at).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                      <div className={styles.conversationPreview}>
                        <span className={styles.previewText}>
                          {conv.last_message_preview || 'Sin mensajes'}
                        </span>
                        {conv.unread_count > 0 && (
                          <span className={styles.unreadBadge}>{conv.unread_count}</span>
                        )}
                      </div>
                      {conv.coordinacion_titulo && (
                        <div className={styles.coordinacionTag}>
                          📋 {conv.coordinacion_titulo}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          // Vista de conversación individual
          <WhatsAppConversation
            conversation={selectedConversation}
            onBack={handleBackToList}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}


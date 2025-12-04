import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from '@/styles/WhatsAppMessage.module.css';

/**
 * Componente para mostrar un mensaje individual de WhatsApp
 */
export default function WhatsAppMessage({ message }) {
  const isOutbound = message.direction === 'outbound';
  const sentDate = message.sent_at ? new Date(message.sent_at) : new Date();

  return (
    <div className={`${styles.messageContainer} ${isOutbound ? styles.outbound : styles.inbound}`}>
      <div className={`${styles.messageBubble} ${isOutbound ? styles.outboundBubble : styles.inboundBubble}`}>
        <p className={styles.messageText}>{message.body}</p>
        <div className={styles.messageFooter}>
          <span className={styles.messageTime}>
            {format(sentDate, 'HH:mm', { locale: es })}
          </span>
          {isOutbound && (
            <span className={styles.messageStatus}>
              {message.status === 'read' ? '✓✓' : 
               message.status === 'delivered' ? '✓✓' : 
               message.status === 'sent' ? '✓' : '⏳'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


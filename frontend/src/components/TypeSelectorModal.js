import React from 'react';
import styles from '@/styles/TypeSelectorModal.module.css';

export default function TypeSelectorModal({ onClose, onSelect }) {
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.title}>¿Qué deseas agendar?</h3>

                <div className={styles.cardsContainer}>
                    <div
                        className={styles.card}
                        onClick={() => onSelect('coordinacion')}
                    >
                        <div className={styles.cardTitle}>
                            <span role="img" aria-label="Fiesta">🎉</span> Nueva Coordinación
                        </div>
                        <p className={styles.cardDesc}>
                            Crea un evento de fiesta (XV, Casamiento, etc.) bloqueando la fecha seleccionada en tu calendario.
                        </p>
                    </div>

                    <div
                        className={`${styles.card} ${styles.cardReunion}`}
                        onClick={() => onSelect('reunion')}
                    >
                        <div className={styles.cardTitle}>
                            <span role="img" aria-label="Reunión">📅</span> Nueva Reunión
                        </div>
                        <p className={styles.cardDesc}>
                            Agenda una reunión presencial o videollamada con un cliente sin ocupar una fecha de evento en el calendario.
                        </p>
                    </div>
                </div>

                <button className={styles.cancelButton} onClick={onClose}>
                    Cancelar
                </button>
            </div>
        </div>
    );
}

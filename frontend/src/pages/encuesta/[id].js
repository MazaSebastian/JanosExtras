import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { Coordinacion } from '@/lib/models/Coordinacion';
import styles from '@/styles/Encuesta.module.css';

// Star Rating Component
const StarRating = ({ value, onChange, label, description }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className={styles.ratingSection}>
            <div className={styles.ratingHeader}>
                <h3 className={styles.ratingLabel}>{label}</h3>
                <p className={styles.ratingDesc}>{description}</p>
            </div>
            <div className={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`${styles.star} ${(hover || value) >= star ? styles.starActive : ''}`}
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        aria-label={`Calificar con ${star} estrellas`}
                    >
                        ★
                    </button>
                ))}
            </div>
            <div className={styles.ratingText}>
                {value === 1 && 'No me gustó'}
                {value === 2 && 'Podría mejorar'}
                {value === 3 && 'Aceptable'}
                {value === 4 && 'Muy Bueno'}
                {value === 5 && '¡Excelente!'}
            </div>
        </div>
    );
};

export default function EncuestaPage({ coordinacion, error }) {
    const router = useRouter();
    const { id } = router.query;

    const [ratings, setRatings] = useState({
        atencion_coordinacion: 0,
        presencia_evento: 0,
        musicalizacion: 0,
        calidad_tecnica: 0,
        calificacion_general: 0
    });

    const [comentarios, setComentarios] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formError, setFormError] = useState('');

    const isFormValid = Object.values(ratings).every(r => r > 0);

    const handleRatingChange = (category, value) => {
        setRatings(prev => ({ ...prev, [category]: value }));
        setFormError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) {
            setFormError('Por favor, califica todas las categorías de la encuesta antes de enviar.');
            return;
        }

        setSubmitting(true);
        setFormError('');

        try {
            const payload = {
                ...ratings,
                comentarios
            };

            // Calls the /api/coordinaciones/[id]/encuesta route explicitly
            const res = await fetch(`/api/coordinaciones/${id}/encuesta`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                throw new Error('No se pudo enviar la encuesta');
            }

            setSuccess(true);
            window.scrollTo(0, 0);
        } catch (err) {
            console.error(err);
            setFormError('Ocurrió un error inesperado al enviar la encuesta. Intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    if (error || !coordinacion) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorCard}>
                    <h2>⚠️ Enlace no válido</h2>
                    <p>No pudimos encontrar la información de este evento. Por favor, verificá que el enlace sea correcto.</p>
                </div>
            </div>
        );
    }

    if (coordinacion.encuesta_completada && !success) {
        return (
            <div className={styles.successContainer}>
                <div className={styles.successCard}>
                    <div className={styles.successIcon}>✨</div>
                    <h2>¡Muchas gracias!</h2>
                    <p>Ya hemos recibido tus respuestas anteriormente para el evento de {coordinacion.nombre_cliente}. Valoramos enormemente tu tiempo.</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className={styles.successContainer}>
                <div className={styles.successCard}>
                    <div className={styles.successIcon}>🎉</div>
                    <h2>¡Encuesta Enviada!</h2>
                    <p>Gracias por ayudarnos a mejorar. El feedback sobre tu evento nos es de gran ayuda.</p>
                </div>
            </div>
        );
    }

    const nombreMostrar = coordinacion.nombre_cliente
        ? `${coordinacion.nombre_cliente} ${coordinacion.apellido_cliente || ''}`.trim()
        : 'Cliente';

    return (
        <>
            <Head>
                <title>Encuesta de Satisfacción - Jano's Extras</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
            </Head>

            <div className={styles.pageWrapper}>
                <div className={styles.brandHeader}>
                    <h2>Jano's Extras</h2>
                </div>

                <div className={styles.mainCard}>
                    <div className={styles.cardHeader}>
                        <h1 className={styles.title}>Encuesta de Satisfacción</h1>
                        <p className={styles.subtitle}>
                            ¡Hola! Para nosotros es super importante conocer tu experiencia.
                            Por favor, califica tu evento:
                        </p>
                        <div className={styles.eventInfo}>
                            <span className={styles.tag}>{coordinacion.tipo_evento || 'Evento'}</span>
                            <strong>{nombreMostrar}</strong>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.formContainer}>
                        <StarRating
                            label="Atención en la coordinación"
                            description="¿Fueron claros y amables? ¿La planificación fue sencilla?"
                            value={ratings.atencion_coordinacion}
                            onChange={(val) => handleRatingChange('atencion_coordinacion', val)}
                        />

                        <StarRating
                            label="Presencia en el evento"
                            description="Puntualidad, prolijidad y lectura atenta del desarrollo de la fiesta."
                            value={ratings.presencia_evento}
                            onChange={(val) => handleRatingChange('presencia_evento', val)}
                        />

                        <StarRating
                            label="Manejo de la Pista / Musicalización"
                            description="Respeto de los gustos, fluidez entre tandas y conexión con el público."
                            value={ratings.musicalizacion}
                            onChange={(val) => handleRatingChange('musicalizacion', val)}
                        />

                        <StarRating
                            label="Calidad Técnica"
                            description="Sonido, iluminación y funcionamiento general de los equipos."
                            value={ratings.calidad_tecnica}
                            onChange={(val) => handleRatingChange('calidad_tecnica', val)}
                        />

                        <StarRating
                            label="Calificación General"
                            description="Resumiendo toda tu experiencia contratando los servicios de técnica."
                            value={ratings.calificacion_general}
                            onChange={(val) => handleRatingChange('calificacion_general', val)}
                        />

                        <div className={styles.textAreaSection}>
                            <label htmlFor="comentarios" className={styles.textAreaLabel}>Dejanos un comentario libre u observación (Opcional)</label>
                            <textarea
                                id="comentarios"
                                className={styles.textArea}
                                value={comentarios}
                                onChange={(e) => setComentarios(e.target.value)}
                                placeholder="Escribe lo que sientas necesario destacar, sea positivo o algo para mejorar..."
                                rows={5}
                                maxLength={1000}
                            />
                        </div>

                        {formError && <div className={styles.errorMsg}>{formError}</div>}

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={submitting || !isFormValid}
                        >
                            {submitting ? 'Enviando...' : 'Enviar Mis Respuestas'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

export async function getServerSideProps(context) {
    const { id } = context.params;

    try {
        const coordinacion = await Coordinacion.findById(id);

        if (!coordinacion) {
            return {
                props: {
                    error: true,
                    coordinacion: null,
                }
            };
        }

        return {
            props: {
                error: false,
                coordinacion: {
                    id: coordinacion.id,
                    nombre_cliente: coordinacion.nombre_cliente || '',
                    apellido_cliente: coordinacion.apellido_cliente || '',
                    tipo_evento: coordinacion.tipo_evento || '',
                    encuesta_completada: coordinacion.encuesta_completada || false,
                    fecha_evento: coordinacion.fecha_evento ? coordinacion.fecha_evento.toISOString() : null,
                }
            }
        };
    } catch (error) {
        console.error('Error en getServerSideProps de encuesta:', error);
        return {
            props: {
                error: true,
                coordinacion: null,
            }
        };
    }
}

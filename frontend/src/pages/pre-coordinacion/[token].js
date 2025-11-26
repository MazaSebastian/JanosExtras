import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { preCoordinacionAPI } from '@/services/api';
import { FLUJOS_POR_TIPO } from '@/components/CoordinacionFlujo';
import Loading from '@/components/Loading';
import styles from '@/styles/PreCoordinacion.module.css';

export default function PreCoordinacionPage() {
  const router = useRouter();
  const { token } = router.query;
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [coordinacion, setCoordinacion] = useState(null);
  const [respuestasCliente, setRespuestasCliente] = useState({});
  const [pasoActual, setPasoActual] = useState(1);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  useEffect(() => {
    if (token) {
      loadPreCoordinacion();
    }
  }, [token]);

  const loadPreCoordinacion = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await preCoordinacionAPI.getByToken(token);
      const data = response.data;
      
      setCoordinacion(data.coordinacion);
      const respuestas = data.respuestasCliente || {};
      setRespuestasCliente(respuestas);
      
      // Si ya hay respuestas, comenzar desde el primer paso no completado
      if (respuestas && Object.keys(respuestas).length > 0) {
        // Determinar desde qué paso continuar
        const tipoEvento = data.coordinacion.tipo_evento?.trim();
        const pasos = FLUJOS_POR_TIPO[tipoEvento] || [];
        let primerPasoIncompleto = 1;
        for (let i = 0; i < pasos.length; i++) {
          const paso = pasos[i];
          const todasRespondidas = paso.preguntas.every(p => {
            if (p.condicional) {
              const condicionCumplida = respuestas[p.condicional.pregunta] === p.condicional.valor;
              if (!condicionCumplida) return true; // Si no cumple condición, no es requerida
            }
            if (!p.requerido) return true; // Si no es requerida, se considera respondida
            return respuestas[p.id] !== undefined && respuestas[p.id] !== null && respuestas[p.id] !== '';
          });
          if (!todasRespondidas) {
            primerPasoIncompleto = paso.id;
            break;
          }
        }
        setPasoActual(primerPasoIncompleto);
      }
    } catch (err) {
      console.error('Error al cargar pre-coordinación:', err);
      setError(err.response?.data?.error || 'Error al cargar la pre-coordinación. Verifica que el link sea correcto.');
    } finally {
      setLoading(false);
    }
  };

  const tipoEventoNormalizado = useMemo(() => {
    if (!coordinacion?.tipo_evento) return null;
    return coordinacion.tipo_evento.trim();
  }, [coordinacion?.tipo_evento]);

  const pasos = tipoEventoNormalizado ? FLUJOS_POR_TIPO[tipoEventoNormalizado] || [] : [];
  const paso = pasos.find(p => p.id === pasoActual);
  const totalPasos = pasos.length;

  const handleInputChange = (preguntaId, value) => {
    setRespuestasCliente({
      ...respuestasCliente,
      [preguntaId]: value,
    });
  };

  const handleSiguiente = async () => {
    // Validar que todas las preguntas requeridas del paso actual estén respondidas
    const preguntasRequeridas = paso.preguntas.filter(p => {
      if (!p.requerido) return false;
      if (p.condicional) {
        const condicionCumplida = respuestasCliente[p.condicional.pregunta] === p.condicional.valor;
        return condicionCumplida;
      }
      return true;
    });

    const faltantes = preguntasRequeridas.filter(p => {
      const valor = respuestasCliente[p.id];
      return valor === undefined || valor === null || valor === '';
    });

    if (faltantes.length > 0) {
      setError(`Por favor, completa todas las preguntas requeridas antes de continuar.`);
      return;
    }

    setError('');

    // Guardar progreso automáticamente
    await guardarProgreso();

    if (pasoActual < totalPasos) {
      setPasoActual(pasoActual + 1);
      // Scroll al inicio
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Último paso - mostrar confirmación
      setMostrarConfirmacion(true);
    }
  };

  const handleAnterior = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const guardarProgreso = async () => {
    try {
      await preCoordinacionAPI.guardarRespuestas(token, respuestasCliente);
    } catch (err) {
      console.error('Error al guardar progreso:', err);
      // No mostrar error al usuario para no interrumpir el flujo
    }
  };

  const handleFinalizar = async () => {
    try {
      setGuardando(true);
      setError('');
      
      await preCoordinacionAPI.guardarRespuestas(token, respuestasCliente);
      
      // Mostrar mensaje de éxito
      setMostrarConfirmacion(false);
      alert('¡Gracias! Tus respuestas han sido guardadas correctamente. El DJ se pondrá en contacto contigo próximamente.');
      
      // Redirigir o mostrar mensaje final
      router.push('/pre-coordinacion/gracias');
    } catch (err) {
      console.error('Error al finalizar:', err);
      setError(err.response?.data?.error || 'Error al guardar las respuestas. Por favor, intenta nuevamente.');
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Loading message="Cargando pre-coordinación..." fullScreen />
      </div>
    );
  }

  if (error && !coordinacion) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h1>❌ Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!coordinacion || !paso) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h1>❌ Pre-coordinación no encontrada</h1>
          <p>El link proporcionado no es válido o ha expirado.</p>
        </div>
      </div>
    );
  }

  if (mostrarConfirmacion) {
    return (
      <div className={styles.container}>
        <div className={styles.confirmacionContainer}>
          <h1>✅ ¡Cuestionario completado!</h1>
          <p>Por favor, revisa que toda la información sea correcta antes de enviar.</p>
          <button
            onClick={handleFinalizar}
            disabled={guardando}
            className={styles.botonFinalizar}
          >
            {guardando ? 'Enviando...' : 'Confirmar y Enviar'}
          </button>
          <button
            onClick={() => setMostrarConfirmacion(false)}
            className={styles.botonVolver}
          >
            Volver para revisar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.titulo}>Pre-Coordinación del Evento</h1>
        <div className={styles.infoGeneral}>
          <div className={styles.infoItem}>
            <strong>Cliente:</strong> {coordinacion.nombre_cliente || coordinacion.titulo}
          </div>
          <div className={styles.infoItem}>
            <strong>Tipo de Evento:</strong> {coordinacion.tipo_evento}
          </div>
          {coordinacion.fecha_evento && (
            <div className={styles.infoItem}>
              <strong>Fecha:</strong> {format(new Date(coordinacion.fecha_evento), "dd 'de' MMMM 'de' yyyy", { locale: es })}
            </div>
          )}
          {coordinacion.salon_nombre && (
            <div className={styles.infoItem}>
              <strong>Salón:</strong> {coordinacion.salon_nombre}
            </div>
          )}
        </div>
      </header>

      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill} 
          style={{ width: `${(pasoActual / totalPasos) * 100}%` }}
        />
        <span className={styles.progressText}>
          Paso {pasoActual} de {totalPasos}
        </span>
      </div>

      {error && (
        <div className={styles.error}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className={styles.pasoContainer}>
        <h2 className={styles.pasoTitulo}>{paso.titulo}</h2>
        
        <div className={styles.preguntas}>
          {paso.preguntas.map((pregunta) => {
            // Verificar si la pregunta condicional se cumple
            const esCondicional = pregunta.condicional && pregunta.condicional.pregunta;
            const debeMostrar = !esCondicional || 
              (respuestasCliente[pregunta.condicional.pregunta] === pregunta.condicional.valor);
            
            if (!debeMostrar) return null;

            return (
              <div key={pregunta.id} className={styles.pregunta}>
                <label className={styles.preguntaLabel}>
                  {pregunta.label}
                  {pregunta.requerido && <span className={styles.required}> *</span>}
                </label>
                
                {pregunta.tipo === 'select' && (
                  <select
                    value={respuestasCliente[pregunta.id] || ''}
                    onChange={(e) => handleInputChange(pregunta.id, e.target.value)}
                    className={styles.input}
                    required={pregunta.requerido}
                  >
                    <option value="">Selecciona una opción</option>
                    {pregunta.opciones.map((opcion) => (
                      <option key={opcion} value={opcion}>
                        {opcion}
                      </option>
                    ))}
                  </select>
                )}

                {pregunta.tipo === 'textarea' && (
                  <textarea
                    value={respuestasCliente[pregunta.id] || ''}
                    onChange={(e) => handleInputChange(pregunta.id, e.target.value)}
                    className={styles.textarea}
                    rows={4}
                    placeholder="Escribe aquí..."
                    required={pregunta.requerido}
                  />
                )}

                {pregunta.tipo === 'text' && (
                  <input
                    type="text"
                    value={respuestasCliente[pregunta.id] || ''}
                    onChange={(e) => handleInputChange(pregunta.id, e.target.value)}
                    className={styles.input}
                    placeholder="Escribe aquí..."
                    required={pregunta.requerido}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.navegacion}>
        <button
          onClick={handleAnterior}
          disabled={pasoActual === 1}
          className={styles.botonAnterior}
        >
          ← Anterior
        </button>
        <button
          onClick={handleSiguiente}
          className={styles.botonSiguiente}
        >
          {pasoActual === totalPasos ? 'Finalizar' : 'Siguiente →'}
        </button>
      </div>

      <footer className={styles.footer}>
        <p>Tu información será revisada por el DJ antes de la reunión. Gracias por completar este cuestionario.</p>
      </footer>
    </div>
  );
}


import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { preCoordinacionAPI } from '@/services/api';
import { CLIENTE_FLUJOS_POR_TIPO } from '@/utils/flujosCliente';
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
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [showVelaModal, setShowVelaModal] = useState(false);
  const [velaForm, setVelaForm] = useState({ nombre: '', familiar: '', cancion: '' });

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
        const pasos = CLIENTE_FLUJOS_POR_TIPO[tipoEvento] || [];
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

  const pasos = tipoEventoNormalizado ? CLIENTE_FLUJOS_POR_TIPO[tipoEventoNormalizado] || [] : [];
  const paso = pasos.find(p => p.id === pasoActual);
  const totalPasos = pasos.length;

  const handleInputChange = (preguntaId, value) => {
    setRespuestasCliente({
      ...respuestasCliente,
      [preguntaId]: value,
    });
  };

  const handleButtonToggle = (preguntaId, opcion, permiteOtro) => {
    const valorActual = respuestasCliente[preguntaId] || [];
    const esArray = Array.isArray(valorActual);
    const valores = esArray ? valorActual : (valorActual ? [valorActual] : []);
    
    // Si es "Otro", manejar de forma especial
    if (opcion.includes('Otro')) {
      const tieneOtro = valores.some(v => typeof v === 'object' && v.tipo === 'otro');
      if (tieneOtro) {
        // Remover "Otro"
        setRespuestasCliente({
          ...respuestasCliente,
          [preguntaId]: valores.filter(v => !(typeof v === 'object' && v.tipo === 'otro')),
        });
      } else {
        // Agregar "Otro" con campo de texto
        setRespuestasCliente({
          ...respuestasCliente,
          [preguntaId]: [...valores, { tipo: 'otro', valor: '' }],
        });
      }
    } else {
      // Toggle normal
      const index = valores.findIndex(v => v === opcion || (typeof v === 'string' && v === opcion));
      if (index >= 0) {
        // Remover
        setRespuestasCliente({
          ...respuestasCliente,
          [preguntaId]: valores.filter((_, i) => i !== index),
        });
      } else {
        // Agregar
        setRespuestasCliente({
          ...respuestasCliente,
          [preguntaId]: [...valores, opcion],
        });
      }
    }
  };

  const handleOtroInputChange = (preguntaId, valor) => {
    const valorActual = respuestasCliente[preguntaId] || [];
    const valores = Array.isArray(valorActual) ? valorActual : (valorActual ? [valorActual] : []);
    const otroIndex = valores.findIndex(v => typeof v === 'object' && v.tipo === 'otro');
    
    if (otroIndex >= 0) {
      valores[otroIndex] = { tipo: 'otro', valor };
    } else {
      valores.push({ tipo: 'otro', valor });
    }
    
    setRespuestasCliente({
      ...respuestasCliente,
      [preguntaId]: valores,
    });
  };

  const isButtonSelected = (preguntaId, opcion) => {
    const valorActual = respuestasCliente[preguntaId] || [];
    const valores = Array.isArray(valorActual) ? valorActual : (valorActual ? [valorActual] : []);
    
    if (opcion.includes('Otro')) {
      return valores.some(v => typeof v === 'object' && v.tipo === 'otro');
    }
    
    return valores.includes(opcion);
  };

  const getOtroValue = (preguntaId) => {
    const valorActual = respuestasCliente[preguntaId] || [];
    const valores = Array.isArray(valorActual) ? valorActual : (valorActual ? [valorActual] : []);
    const otro = valores.find(v => typeof v === 'object' && v.tipo === 'otro');
    return otro ? otro.valor : '';
  };

  const handleAgregarVela = () => {
    setVelaForm({ nombre: '', familiar: '', cancion: '' });
    setShowVelaModal(true);
  };

  const handleGuardarVela = () => {
    if (!velaForm.nombre || !velaForm.familiar || !velaForm.cancion) {
      setError('Por favor, completa todos los campos de la vela.');
      return;
    }

    const velasActuales = respuestasCliente.velas || [];
    const nuevaVela = {
      id: Date.now(),
      nombre: velaForm.nombre,
      familiar: velaForm.familiar,
      cancion: velaForm.cancion,
    };

    setRespuestasCliente({
      ...respuestasCliente,
      velas: [...velasActuales, nuevaVela],
    });

    setShowVelaModal(false);
    setVelaForm({ nombre: '', familiar: '', cancion: '' });
    setError('');
  };

  const handleEliminarVela = (id) => {
    const velasActuales = respuestasCliente.velas || [];
    setRespuestasCliente({
      ...respuestasCliente,
      velas: velasActuales.filter(v => v.id !== id),
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
      // Para velas, verificar que sea un array y tenga al menos un elemento
      if (p.tipo === 'velas') {
        return !Array.isArray(valor) || valor.length === 0;
      }
      // Para botones, verificar que tenga al menos una opción seleccionada
      if (p.tipo === 'buttons') {
        if (Array.isArray(valor)) {
          // Si tiene "Otro", verificar que tenga valor
          const tieneOtro = valor.some(v => typeof v === 'object' && v.tipo === 'otro');
          if (tieneOtro) {
            const otro = valor.find(v => typeof v === 'object' && v.tipo === 'otro');
            return !otro || !otro.valor || otro.valor.trim() === '';
          }
          return valor.length === 0;
        }
        return !valor || valor === '';
      }
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
      
      // Convertir respuestas de botones a formato compatible
      const respuestasParaGuardar = { ...respuestasCliente };
      Object.keys(respuestasParaGuardar).forEach(key => {
        const valor = respuestasParaGuardar[key];
        if (Array.isArray(valor)) {
          // Convertir array de botones a string legible
          const tieneObjetos = valor.some(v => typeof v === 'object');
          if (tieneObjetos) {
            respuestasParaGuardar[key] = valor.map(v => {
              if (typeof v === 'object' && v.tipo === 'otro') {
                return `Otro: ${v.valor}`;
              }
              return v;
            }).join(', ');
          } else {
            respuestasParaGuardar[key] = valor.join(', ');
          }
        }
      });
      
      await preCoordinacionAPI.guardarRespuestas(token, respuestasParaGuardar);
      
      // Actualizar estado local con formato convertido para el resumen
      setRespuestasCliente(respuestasParaGuardar);
      
      // Mostrar resumen en lugar de redirigir
      setMostrarConfirmacion(false);
      setMostrarResumen(true);
      setGuardando(false);
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

  if (mostrarResumen) {
    return (
      <div className={styles.container}>
        <div className={styles.resumenContainer}>
          <div className={styles.resumenHeader}>
            <h1>✅ Pre-Coordinación Finalizada</h1>
            <p className={styles.mensajeExito}>
              Hemos enviado tu información a nuestro DJ. Te contactaremos próximamente para coordinar los detalles finales.
            </p>
          </div>
          
          <div className={styles.resumenContent}>
            <h2 className={styles.resumenTitulo}>Resumen de tu Pre-Coordinación</h2>
            
            <div className={styles.resumenInfoGeneral}>
              <div className={styles.resumenInfoItem}>
                <strong>Cliente:</strong> {coordinacion.nombre_cliente || coordinacion.titulo}
              </div>
              <div className={styles.resumenInfoItem}>
                <strong>Tipo de Evento:</strong> {coordinacion.tipo_evento}
              </div>
              {coordinacion.fecha_evento && (
                <div className={styles.resumenInfoItem}>
                  <strong>Fecha:</strong> {format(new Date(coordinacion.fecha_evento), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                </div>
              )}
              {coordinacion.salon_nombre && (
                <div className={styles.resumenInfoItem}>
                  <strong>Salón:</strong> {coordinacion.salon_nombre}
                </div>
              )}
            </div>

            {pasos.map((paso) => {
              const preguntasRespondidas = paso.preguntas.filter(p => {
                const esCondicional = p.condicional && p.condicional.pregunta;
                const debeMostrar = !esCondicional || 
                  (respuestasCliente[p.condicional.pregunta] === p.condicional.valor);
                
                if (!debeMostrar) return false;
                
                const valor = respuestasCliente[p.id];
                return valor !== undefined && valor !== null && valor !== '';
              });

              if (preguntasRespondidas.length === 0) return null;

              return (
                <div key={paso.id} className={styles.resumenSeccion}>
                  <h3 className={styles.resumenSeccionTitulo}>{paso.titulo}</h3>
                  {paso.preguntas.map((pregunta) => {
                    const esCondicional = pregunta.condicional && pregunta.condicional.pregunta;
                    const debeMostrar = !esCondicional || 
                      (respuestasCliente[pregunta.condicional.pregunta] === pregunta.condicional.valor);
                    
                    if (!debeMostrar) return null;

                    const valor = respuestasCliente[pregunta.id];
                    if (valor === undefined || valor === null || valor === '') return null;

                    if (pregunta.tipo === 'velas' && Array.isArray(valor)) {
                      return (
                        <div key={pregunta.id} className={styles.resumenCampo}>
                          <span className={styles.resumenLabel}>{pregunta.label}:</span>
                          <div className={styles.resumenValor}>
                            {valor.map((vela, idx) => (
                              <div key={idx} className={styles.velaItem}>
                                <strong>{vela.nombre}</strong> - {vela.familiar}
                                <br />
                                🎵 {vela.cancion}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    // Manejar botones seleccionables
                    if (pregunta.tipo === 'buttons' && Array.isArray(valor)) {
                      const valoresTexto = valor.map(v => {
                        if (typeof v === 'object' && v.tipo === 'otro') {
                          return `Otro: ${v.valor}`;
                        }
                        return v;
                      });
                      return (
                        <div key={pregunta.id} className={styles.resumenCampo}>
                          <span className={styles.resumenLabel}>{pregunta.label}:</span>
                          <span className={styles.resumenValor}>
                            {valoresTexto.join(', ')}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={pregunta.id} className={styles.resumenCampo}>
                        <span className={styles.resumenLabel}>{pregunta.label}:</span>
                        <span className={styles.resumenValor}>
                          {String(valor).split('\n').map((line, i) => (
                            <span key={i}>
                              {line}
                              {i < String(valor).split('\n').length - 1 && <br />}
                            </span>
                          ))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className={styles.resumenFooter}>
            <p className={styles.resumenFooterTexto}>
              Gracias por completar la pre-coordinación. Nuestro DJ revisará esta información y se pondrá en contacto contigo.
            </p>
          </div>
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
        {paso.descripcion && (
          <p className={styles.pasoDescripcion}>{paso.descripcion}</p>
        )}
        
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
                  <>
                    <textarea
                      value={respuestasCliente[pregunta.id] || ''}
                      onChange={(e) => handleInputChange(pregunta.id, e.target.value)}
                      className={styles.textarea}
                      rows={4}
                      placeholder={pregunta.placeholder || "Escribe aquí..."}
                      required={pregunta.requerido}
                    />
                    {pregunta.ayuda && (
                      <small className={styles.ayuda}>{pregunta.ayuda}</small>
                    )}
                  </>
                )}

                {pregunta.tipo === 'text' && (
                  <>
                    <input
                      type="text"
                      value={respuestasCliente[pregunta.id] || ''}
                      onChange={(e) => handleInputChange(pregunta.id, e.target.value)}
                      className={styles.input}
                      placeholder={pregunta.placeholder || "Escribe aquí..."}
                      required={pregunta.requerido}
                    />
                    {pregunta.ayuda && (
                      <small className={styles.ayuda}>{pregunta.ayuda}</small>
                    )}
                  </>
                )}

                {pregunta.tipo === 'buttons' && (
                  <div className={styles.buttonsContainer}>
                    {pregunta.ayuda && (
                      <small className={styles.ayuda}>{pregunta.ayuda}</small>
                    )}
                    <div className={styles.buttonsGrid}>
                      {pregunta.opciones.map((opcion) => {
                        const isSelected = isButtonSelected(pregunta.id, opcion);
                        const isOtro = opcion.includes('Otro');
                        
                        return (
                          <div key={opcion} className={styles.buttonWrapper}>
                            <button
                              type="button"
                              onClick={() => handleButtonToggle(pregunta.id, opcion, pregunta.permiteOtro)}
                              className={`${styles.selectableButton} ${isSelected ? styles.selectableButtonActive : ''}`}
                            >
                              {opcion.replace(' (especificar)', '')}
                            </button>
                            {isOtro && isSelected && pregunta.permiteOtro && (
                              <input
                                type="text"
                                value={getOtroValue(pregunta.id)}
                                onChange={(e) => handleOtroInputChange(pregunta.id, e.target.value)}
                                className={styles.otroInput}
                                placeholder="Especifica aquí..."
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {pregunta.tipo === 'velas' && (
                  <div className={styles.velasContainer}>
                    {pregunta.ayuda && (
                      <small className={styles.ayuda}>{pregunta.ayuda}</small>
                    )}
                    <button
                      type="button"
                      onClick={handleAgregarVela}
                      className={styles.agregarVelaButton}
                    >
                      + Agregar Vela
                    </button>
                    {respuestasCliente.velas && respuestasCliente.velas.length > 0 && (
                      <div className={styles.velasList}>
                        {respuestasCliente.velas.map((vela) => (
                          <div key={vela.id} className={styles.velaItem}>
                            <div className={styles.velaInfo}>
                              <strong>{vela.nombre}</strong> - {vela.familiar}
                              <div className={styles.velaCancion}>🎵 {vela.cancion}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleEliminarVela(vela.id)}
                              className={styles.eliminarVelaButton}
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showVelaModal && (
        <div className={styles.modalOverlay} onClick={() => setShowVelaModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Agregar Vela</h3>
              <button
                className={styles.modalCloseButton}
                onClick={() => {
                  setShowVelaModal(false);
                  setVelaForm({ nombre: '', familiar: '', cancion: '' });
                }}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.pregunta}>
                <label className={styles.preguntaLabel}>
                  Nombre de la persona a quien está dedicada la vela *
                </label>
                <input
                  type="text"
                  value={velaForm.nombre}
                  onChange={(e) => setVelaForm({ ...velaForm, nombre: e.target.value })}
                  className={styles.input}
                  placeholder="Ejemplo: Abuela María"
                />
              </div>
              <div className={styles.pregunta}>
                <label className={styles.preguntaLabel}>
                  Relación familiar *
                </label>
                <input
                  type="text"
                  value={velaForm.familiar}
                  onChange={(e) => setVelaForm({ ...velaForm, familiar: e.target.value })}
                  className={styles.input}
                  placeholder="Ejemplo: Abuela"
                />
              </div>
              <div className={styles.pregunta}>
                <label className={styles.preguntaLabel}>
                  Canción para esta vela *
                </label>
                <textarea
                  value={velaForm.cancion}
                  onChange={(e) => setVelaForm({ ...velaForm, cancion: e.target.value })}
                  className={styles.textarea}
                  rows={3}
                  placeholder="Nombre de la canción y artista"
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => {
                  setShowVelaModal(false);
                  setVelaForm({ nombre: '', familiar: '', cancion: '' });
                }}
                className={styles.botonAnterior}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarVela}
                className={styles.botonSiguiente}
              >
                Guardar Vela
              </button>
            </div>
          </div>
        </div>
      )}

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


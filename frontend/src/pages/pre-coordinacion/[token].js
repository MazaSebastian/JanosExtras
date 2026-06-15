import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { formatDateFromDBLong } from '@/utils/dateFormat';
import { es } from 'date-fns/locale';
import { preCoordinacionAPI } from '@/services/api';
import { CLIENTE_FLUJOS_POR_TIPO } from '@/utils/flujosCliente';
import Loading from '@/components/Loading';
import ChatbotPreCoordinacion from '@/components/ChatbotPreCoordinacion';
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
  const [direction, setDirection] = useState('forward');
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [preCoordinacionEnviada, setPreCoordinacionEnviada] = useState(false);
  const [showVelaModal, setShowVelaModal] = useState(false);
  const [isVelaModalClosing, setIsVelaModalClosing] = useState(false);
  const [velasEliminando, setVelasEliminando] = useState([]);
  const [velaForm, setVelaForm] = useState({ nombre: '', familiar: '', cancion: '' });
  const [mostrarBienvenida, setMostrarBienvenida] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState({});

  // Estados para agendar videollamada
  const [bookingLoading, setBookingLoading] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [selectedBookingDate, setSelectedBookingDate] = useState(null);
  const [selectedBookingHour, setSelectedBookingHour] = useState(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookedVideocall, setBookedVideocall] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const toggleSuggestions = (id) => {
    setShowSuggestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const dateParts = useMemo(() => {
    if (!coordinacion?.fecha_evento) return null;
    let fechaStr = coordinacion.fecha_evento;
    if (typeof fechaStr === 'string') {
      fechaStr = fechaStr.split('T')[0].split(' ')[0];
    } else if (fechaStr instanceof Date) {
      const year = fechaStr.getUTCFullYear();
      const month = String(fechaStr.getUTCMonth() + 1).padStart(2, '0');
      const day = String(fechaStr.getUTCDate()).padStart(2, '0');
      fechaStr = `${year}-${month}-${day}`;
    }
    if (!fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) return null;
    const [year, month, day] = fechaStr.split('-');
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return {
      day: parseInt(day, 10),
      month: monthNames[parseInt(month, 10) - 1],
      year: parseInt(year, 10)
    };
  }, [coordinacion?.fecha_evento]);


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

      if (data.coordinacion?.pre_coordinacion_completado_por_cliente) {
        setPreCoordinacionEnviada(true);
        setMostrarBienvenida(false);
        if (data.coordinacion.videollamada_agendada) {
          setBookedVideocall({
            fecha: data.coordinacion.videollamada_fecha,
            meetLink: data.coordinacion.videollamada_meet_link
          });
        }
      }

      const respuestas = data.respuestasCliente || {};

      console.log('=== CARGANDO PRE-COORDINACIÓN ===');
      console.log('Respuestas recibidas del servidor:', respuestas);
      console.log('Total de respuestas recibidas:', Object.keys(respuestas).length);
      console.log('Keys recibidas:', Object.keys(respuestas));

      // Convertir respuestas guardadas (strings) de vuelta a arrays para botones
      const respuestasConvertidas = { ...respuestas };
      const tipoEvento = data.coordinacion.tipo_evento?.trim();
      const pasos = CLIENTE_FLUJOS_POR_TIPO[tipoEvento] || [];

      pasos.forEach(paso => {
        paso.preguntas.forEach(pregunta => {
          if (pregunta.tipo === 'buttons' && respuestasConvertidas[pregunta.id]) {
            const valor = respuestasConvertidas[pregunta.id];
            // Si es string, convertir a array
            if (typeof valor === 'string') {
              respuestasConvertidas[pregunta.id] = valor.split(', ').map(v => {
                // Si contiene "Otro:", convertir a objeto
                if (v.startsWith('Otro: ')) {
                  return { tipo: 'otro', valor: v.replace('Otro: ', '') };
                }
                return v;
              });
            }
          }
        });
      });

      console.log('Respuestas convertidas después de procesamiento:', respuestasConvertidas);
      console.log('Total de respuestas convertidas:', Object.keys(respuestasConvertidas).length);
      console.log('Keys convertidas:', Object.keys(respuestasConvertidas));

      setRespuestasCliente(respuestasConvertidas);

      // Si ya hay respuestas, no mostrar bienvenida (ya comenzó el proceso)
      if (respuestas && Object.keys(respuestas).length > 0) {
        setMostrarBienvenida(false);
      }

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
              const valorCondicional = respuestas[p.condicional.pregunta];
              const valorEsperado = p.condicional.valor;
              let condicionCumplida = false;

              // Manejar tanto valores string como arrays (para botones)
              if (Array.isArray(valorCondicional)) {
                condicionCumplida = valorCondicional.includes(valorEsperado);
              } else if (typeof valorCondicional === 'string') {
                condicionCumplida = valorCondicional === valorEsperado;
              }

              if (!condicionCumplida) return true; // Si no cumple condición, no es requerida
            }
            if (!p.requerido) return true; // Si no es requerida, se considera respondida
            return respuestas[p.id] !== undefined && respuestas[p.id] !== null && respuestas[p.id] !== '';
          });
          if (!todasRespondidas) {
            primerPasoIncompleto = i + 1;
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

  useEffect(() => {
    if (preCoordinacionEnviada && token) {
      fetchAvailability();
    }
  }, [preCoordinacionEnviada, token]);

  const fetchAvailability = async () => {
    try {
      setBookingLoading(true);
      const res = await preCoordinacionAPI.getDisponibilidad(token);
      if (res.data.alreadyBooked) {
        setBookedVideocall({
          fecha: res.data.fecha,
          meetLink: res.data.meetLink
        });
      } else if (res.data.activo) {
        setAvailability(res.data);
      }
    } catch (err) {
      console.error('Error al cargar disponibilidad:', err);
    } finally {
      setBookingLoading(false);
    }
  };

  const bookingDateOptions = useMemo(() => {
    if (!availability?.disponibilidad?.horasDisponibles) return [];
    
    const options = [];
    const today = new Date();
    const diasSemanaMap = {
      0: 'domingo',
      1: 'lunes',
      2: 'martes',
      3: 'miercoles',
      4: 'jueves',
      5: 'viernes',
      6: 'sabado'
    };
    
    const diasSemanaNombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    for (let i = 1; i <= 30; i++) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + i);
      
      const dayOfWeekNum = targetDate.getDay();
      const dayKey = diasSemanaMap[dayOfWeekNum];
      
      const configSlots = availability.disponibilidad.horasDisponibles[dayKey] || [];
      if (configSlots.length > 0) {
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        options.push({
          dateStr,
          dayName: diasSemanaNombres[dayOfWeekNum],
          dayNumber: targetDate.getDate(),
          monthName: mesesNombres[targetDate.getMonth()],
          dayKey
        });
      }
    }
    return options;
  }, [availability]);

  const bookingHourOptions = useMemo(() => {
    if (!selectedBookingDate || !availability) return [];
    const dayKey = selectedBookingDate.dayKey;
    const configSlots = availability.disponibilidad.horasDisponibles[dayKey] || [];
    
    return configSlots.filter((hourStr) => {
      const isBooked = (availability.bookedDates || []).some(bookedISO => {
        const d = new Date(bookedISO);
        const bookedDateStr = d.toISOString().split('T')[0];
        const bookedHourStr = d.toISOString().split('T')[1].substring(0, 5);
        return bookedDateStr === selectedBookingDate.dateStr && bookedHourStr === hourStr;
      });
      return !isBooked;
    });
  }, [selectedBookingDate, availability]);

  const handleConfirmBooking = async () => {
    if (!selectedBookingDate || !selectedBookingHour) return;
    setBookingSubmitting(true);
    try {
      const res = await preCoordinacionAPI.agendarVideollamada(
        token,
        selectedBookingDate.dateStr,
        selectedBookingHour
      );
      if (res.data.success) {
        const targetDate = new Date(`${selectedBookingDate.dateStr}T${selectedBookingHour}:00`);
        setBookedVideocall({
          fecha: targetDate.toISOString(),
          meetLink: res.data.meetLink
        });
        setShowBookingModal(false);
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error('Error al agendar videollamada:', err);
      alert('Hubo un error al agendar la videollamada. Por favor, intenta de nuevo.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const formatBookedDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const diaSemana = diasSemana[d.getDay()];
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const anio = d.getFullYear();
      const hora = String(d.getHours()).padStart(2, '0');
      const minutos = String(d.getMinutes()).padStart(2, '0');
      return `${diaSemana} ${dia}/${mes}/${anio} a las ${hora}:${minutos} hs`;
    } catch (e) {
      return '';
    }
  };

  const renderBookingModal = () => {
    if (bookingLoading || bookedVideocall || !availability || !availability.activo || !showBookingModal) {
      return null;
    }

    return (
      <div className={styles.bookingModalOverlay} onClick={() => setShowBookingModal(false)}>
        <div className={styles.bookingModalContent} onClick={(e) => e.stopPropagation()}>
          <button 
            type="button" 
            className={styles.bookingModalClose}
            onClick={() => setShowBookingModal(false)}
          >
            ×
          </button>
          
          <div className={styles.bookingModalHeader}>
            <div className={styles.bookingModalIcon}>📹</div>
            <h3 className={styles.bookingModalTitle}>¡Agendá tu Videollamada!</h3>
            <p className={styles.bookingModalSubtitle}>
              Elegí un día y horario para tener una reunión virtual de coordinación con tu DJ (<strong>{availability.djNombre}</strong>). ¡Es rápido y automático!
            </p>
          </div>

          <div className={styles.bookingModalBody}>
            {/* Selección de fecha */}
            <div className={styles.daysSliderWrapper}>
              <div className={styles.daysGrid}>
                {bookingDateOptions.map((opt) => {
                  const isActive = selectedBookingDate?.dateStr === opt.dateStr;
                  return (
                    <div 
                      key={opt.dateStr}
                      className={`${styles.dayCard} ${isActive ? styles.dayCardActive : ''}`}
                      onClick={() => {
                        setSelectedBookingDate(opt);
                        setSelectedBookingHour(null);
                      }}
                    >
                      <span className={styles.dayCardName}>{opt.dayName}</span>
                      <span className={styles.dayCardNumber}>{opt.dayNumber}</span>
                      <span className={styles.dayCardMonth}>{opt.monthName}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selección de hora */}
            {selectedBookingDate && (
              <div className={styles.slotsSection}>
                <h4 className={styles.slotsTitle}>
                  Horarios disponibles para el {selectedBookingDate.dayName} {selectedBookingDate.dayNumber} de {selectedBookingDate.monthName}:
                </h4>
                
                {bookingHourOptions.length > 0 ? (
                  <div className={styles.slotsGrid}>
                    {bookingHourOptions.map((hour) => {
                      const isActive = selectedBookingHour === hour;
                      return (
                        <button 
                          key={hour}
                          type="button"
                          className={`${styles.slotButton} ${isActive ? styles.slotButtonActive : ''}`}
                          onClick={() => setSelectedBookingHour(hour)}
                        >
                          {hour}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginBottom: '1.5rem', textAlign: 'center' }}>
                    No quedan horarios disponibles para este día. Por favor elige otra fecha.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className={styles.bookingModalFooter}>
            <button 
              type="button" 
              className={styles.confirmBookingButton}
              onClick={handleConfirmBooking}
              disabled={!selectedBookingDate || !selectedBookingHour || bookingSubmitting}
            >
              {bookingSubmitting ? 'Reservando...' : '📅 Confirmar y Reservar Reunión'}
            </button>
            <button 
              type="button" 
              className={styles.maybeLaterButton}
              onClick={() => setShowBookingModal(false)}
            >
              Quizás más tarde
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSuccessModal = () => {
    if (!showSuccessModal) return null;

    const nombreAgasajado = coordinacion?.nombre_agasajado || '';
    const djNombre = coordinacion?.dj_nombre || 'Sebastián Maza';
    const djTelefono = coordinacion?.dj_telefono || '';
    const djEmail = coordinacion?.dj_email || '';

    return (
      <div className={styles.bookingModalOverlay} onClick={() => setShowSuccessModal(false)}>
        <div className={styles.bookingModalContent} onClick={(e) => e.stopPropagation()}>
          <button 
            type="button" 
            className={styles.bookingModalClose}
            onClick={() => setShowSuccessModal(false)}
          >
            ×
          </button>
          
          <div className={styles.bookingModalHeader}>
            <div className={styles.bookingModalIcon} style={{ animation: 'none' }}>🎉</div>
            <h3 className={styles.bookingModalTitle}>
              {nombreAgasajado ? `¡Excelente ${nombreAgasajado}!` : '¡Excelente!'}
            </h3>
            <p className={styles.bookingModalSubtitle} style={{ marginTop: '1rem', fontSize: '1rem', lineHeight: '1.6' }}>
              ¡Has agendado una videollamada con <strong>{djNombre}</strong>, el DJ encargado de que tu fiesta sea inolvidable!
            </p>
          </div>

          <div className={styles.bookingModalBody} style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '1.5rem' }}>
              Recibirás un mensaje de coordinación por parte de {djNombre} para confirmar la videollamada.
            </p>
            
            <div style={{
              background: 'rgba(154, 77, 168, 0.12)',
              border: '1px solid rgba(154, 77, 168, 0.25)',
              borderRadius: '16px',
              padding: '1.25rem',
              marginTop: '1.5rem',
              textAlign: 'center'
            }}>
              <h4 style={{ color: '#d896ff', margin: '0 0 0.75rem 0', fontFamily: "'Outfit', sans-serif", fontSize: '1.05rem' }}>
                Datos de contacto del DJ:
              </h4>
              <p style={{ margin: '0.35rem 0', fontSize: '0.95rem' }}>
                <strong>Nombre:</strong> {djNombre}
              </p>
              {djTelefono && (
                <p style={{ margin: '0.35rem 0', fontSize: '0.95rem' }}>
                  <strong>WhatsApp / Tel:</strong>{' '}
                  <a href={`https://wa.me/${djTelefono.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#d896ff', textDecoration: 'underline' }}>
                    {djTelefono}
                  </a>
                </p>
              )}
              {djEmail && (
                <p style={{ margin: '0.35rem 0', fontSize: '0.95rem' }}>
                  <strong>Email:</strong>{' '}
                  <a href={`mailto:${djEmail}`} style={{ color: '#d896ff', textDecoration: 'underline' }}>
                    {djEmail}
                  </a>
                </p>
              )}
            </div>
          </div>

          <div className={styles.bookingModalFooter}>
            <button 
              type="button" 
              className={styles.confirmBookingButton}
              onClick={() => setShowSuccessModal(false)}
            >
              Entendido, ¡muchas gracias!
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBookingInlineSection = () => {
    if (bookingLoading) {
      return (
        <div style={{ textAlign: 'center', marginTop: '2rem', color: 'rgba(255,255,255,0.6)' }}>
          Cargando opciones de videollamada...
        </div>
      );
    }

    if (bookedVideocall) {
      return (
        <div className={styles.bookedMessageCard}>
          <div className={styles.bookedIcon}>📅</div>
          <h3 className={styles.bookedTitle}>¡Videollamada Agendada!</h3>
          <p className={styles.bookedText}>
            Tu reunión está programada para el <strong>{formatBookedDate(bookedVideocall.fecha)}</strong>.
          </p>
        </div>
      );
    }

    if (!availability || !availability.activo) {
      return null;
    }

    if (!showBookingModal) {
      return (
        <div className={styles.reopenBookingBanner}>
          <div style={{ fontSize: '2rem' }}>📅</div>
          <h4 style={{ margin: '0.25rem 0', color: '#fff', fontSize: '1.15rem', fontFamily: "'Outfit', sans-serif" }}>
            ¿Querés agendar una videollamada con tu DJ?
          </h4>
          <p style={{ margin: '0 0 1rem 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
            Elegí un día y horario para tener una reunión virtual de coordinación con <strong>{availability.djNombre}</strong>.
          </p>
          <button 
            type="button" 
            className={styles.reopenBookingButton}
            onClick={() => setShowBookingModal(true)}
          >
            🗓️ Reservar Videollamada
          </button>
        </div>
      );
    }

    return null;
  };

  const tipoEventoNormalizado = useMemo(() => {
    if (!coordinacion?.tipo_evento) return null;
    const tipo = coordinacion.tipo_evento.trim();
    if (tipo.startsWith('Religioso')) return 'Religioso';
    return tipo;
  }, [coordinacion?.tipo_evento]);

  const pasos = tipoEventoNormalizado ? CLIENTE_FLUJOS_POR_TIPO[tipoEventoNormalizado] || [] : [];
  const paso = pasos[pasoActual - 1];
  const totalPasos = pasos.length;

  const handleInputChange = (preguntaId, value) => {
    setError('');
    setRespuestasCliente({
      ...respuestasCliente,
      [preguntaId]: value,
    });
  };

  const handleButtonToggle = async (preguntaId, opcion, permiteOtro, multiple = true) => {
    setError('');
    const valorActual = respuestasCliente[preguntaId] || [];
    const esArray = Array.isArray(valorActual);
    const valores = esArray ? valorActual : (valorActual ? [valorActual] : []);

    // Si no es múltiple, reemplazar directamente
    if (!multiple) {
      // Si ya está seleccionado, deseleccionar (permitir deselección)
      const yaSeleccionado = valores.includes(opcion);
      const nuevoValor = yaSeleccionado ? [] : [opcion];

      setRespuestasCliente({
        ...respuestasCliente,
        [preguntaId]: nuevoValor,
      });

      // Si es el último paso y la respuesta es "No", finalizar automáticamente
      if (pasoActual === totalPasos && preguntaId === 'realiza_ingreso_carioca' && opcion === 'No' && !yaSeleccionado) {
        // Esperar un momento para que el estado se actualice
        setTimeout(async () => {
          // Guardar progreso con la respuesta actualizada
          const respuestasActualizadas = {
            ...respuestasCliente,
            [preguntaId]: nuevoValor,
          };

          // Convertir respuestas para guardar
          const respuestasParaGuardar = { ...respuestasActualizadas };
          Object.keys(respuestasParaGuardar).forEach(key => {
            const valor = respuestasParaGuardar[key];
            if (Array.isArray(valor)) {
              // IMPORTANTE: No convertir velas a string, mantener como array de objetos
              if (key === 'velas') {
                // Las velas deben mantenerse como array de objetos
                respuestasParaGuardar[key] = valor;
                console.log('✅ Manteniendo velas como array de objetos (auto-finalización):', valor);
              } else {
                // Convertir otros arrays (como botones) a string legible
                const tieneObjetos = valor.some(v => typeof v === 'object' && v.tipo === 'otro');
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
            }
          });

          // Marcar como finalizado porque se está completando la pre-coordinación
          await preCoordinacionAPI.guardarRespuestas(token, respuestasParaGuardar, true);

          // Actualizar estado local y mostrar resumen para confirmar
          setRespuestasCliente(respuestasActualizadas);
          setMostrarConfirmacion(true);
        }, 100);
      }
      return;
    }

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
    setError('');
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

  const cerrarVelaModal = () => {
    setIsVelaModalClosing(true);
    setTimeout(() => {
      setShowVelaModal(false);
      setIsVelaModalClosing(false);
      setVelaForm({ nombre: '', familiar: '', cancion: '' });
    }, 280);
  };

  const handleAgregarVela = () => {
    setVelaForm({ nombre: '', familiar: '', cancion: '' });
    setIsVelaModalClosing(false);
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

    setIsVelaModalClosing(true);
    setTimeout(() => {
      setShowVelaModal(false);
      setIsVelaModalClosing(false);
      setVelaForm({ nombre: '', familiar: '', cancion: '' });
      setError('');
    }, 280);
  };

  const handleEliminarVela = (id) => {
    setError('');
    setVelasEliminando((prev) => [...prev, id]);
    setTimeout(() => {
      const velasActuales = respuestasCliente.velas || [];
      setRespuestasCliente({
        ...respuestasCliente,
        velas: velasActuales.filter(v => v.id !== id),
      });
      setVelasEliminando((prev) => prev.filter(item => item !== id));
    }, 320);
  };

  const handleSiguiente = async () => {
    // Validar que todas las preguntas requeridas del paso actual estén respondidas
    const preguntasRequeridas = paso.preguntas.filter(p => {
      if (!p.requerido) return false;
      if (p.condicional) {
        const valorCondicional = respuestasCliente[p.condicional.pregunta];
        const valorEsperado = p.condicional.valor;

        // Manejar tanto valores string como arrays (para botones)
        if (Array.isArray(valorCondicional)) {
          return valorCondicional.includes(valorEsperado);
        } else if (typeof valorCondicional === 'string') {
          return valorCondicional === valorEsperado;
        }
        return false;
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

    setGuardando(true);
    try {
      // Guardar progreso automáticamente
      await guardarProgreso();

      if (pasoActual < totalPasos) {
        setDirection('forward');
        setPasoActual(pasoActual + 1);
        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Último paso - mostrar resumen para confirmar
        setMostrarConfirmacion(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  const handleAnterior = () => {
    if (pasoActual > 1) {
      setDirection('backward');
      setPasoActual(pasoActual - 1);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const guardarProgreso = async (respuestas = respuestasCliente) => {
    try {
      console.log('=== GUARDANDO PROGRESO ===');
      console.log('RespuestasCliente en guardarProgreso:', respuestas);
      console.log('Total de respuestas a guardar:', Object.keys(respuestas).length);
      console.log('Keys a guardar:', Object.keys(respuestas));
      console.log('Valor completo:', JSON.stringify(respuestas, null, 2));
      await preCoordinacionAPI.guardarRespuestas(token, respuestas);
      console.log('Progreso guardado exitosamente');
    } catch (err) {
      console.error('Error al guardar progreso:', err);
      // No mostrar error al usuario para no interrumpir el flujo
    }
  };

  const handleDejarPendiente = async () => {
    setError('');
    
    const nuevasRespuestas = { ...respuestasCliente };
    
    paso.preguntas.forEach(pregunta => {
      // Verificar si la condición se cumple o si no es condicional
      let condMet = true;
      if (pregunta.condicional) {
        const valorCondicional = respuestasCliente[pregunta.condicional.pregunta];
        const valorEsperado = pregunta.condicional.valor;
        if (Array.isArray(valorCondicional)) {
          condMet = valorCondicional.includes(valorEsperado);
        } else if (typeof valorCondicional === 'string') {
          condMet = valorCondicional === valorEsperado;
        } else {
          condMet = false;
        }
      }

      if (condMet) {
        const valor = respuestasCliente[pregunta.id];
        let esVacio = false;
        if (valor === undefined || valor === null) {
          esVacio = true;
        } else if (pregunta.tipo === 'velas') {
          esVacio = !Array.isArray(valor) || valor.length === 0;
        } else if (pregunta.tipo === 'buttons') {
          if (Array.isArray(valor)) {
            esVacio = valor.length === 0;
          } else {
            esVacio = valor === '';
          }
        } else {
          esVacio = typeof valor === 'string' ? valor.trim() === '' : false;
        }

        if (esVacio) {
          if (pregunta.tipo === 'buttons') {
            nuevasRespuestas[pregunta.id] = pregunta.multiple !== false ? ['Pendiente'] : 'Pendiente';
          } else if (pregunta.tipo === 'velas') {
            nuevasRespuestas[pregunta.id] = [{ id: 'pendiente', nombre: 'Pendiente', familiar: 'Pendiente', cancion: 'Pendiente' }];
          } else {
            nuevasRespuestas[pregunta.id] = 'Pendiente';
          }
        }
      }
    });

    setRespuestasCliente(nuevasRespuestas);
    
    setGuardando(true);
    try {
      // Guardar el progreso pasando el nuevo objeto de respuestas
      await guardarProgreso(nuevasRespuestas);

      if (pasoActual < totalPasos) {
        setDirection('forward');
        setPasoActual(pasoActual + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setMostrarConfirmacion(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  const handleFinalizar = async () => {
    setGuardando(true);
    setError('');

    let respuestasParaGuardar = {};

    try {
      // Log antes de la conversión
      console.log('=== FINALIZANDO PRE-COORDINACIÓN ===');
      console.log('RespuestasCliente ANTES de conversión:', respuestasCliente);
      console.log('Total de respuestas ANTES de conversión:', Object.keys(respuestasCliente).length);
      console.log('Keys ANTES de conversión:', Object.keys(respuestasCliente));
      console.log('Valor completo de respuestasCliente:', JSON.stringify(respuestasCliente, null, 2));

      // Asegurarse de que tenemos todas las respuestas
      // Si solo hay tematica_evento, puede ser que las respuestas no se hayan cargado correctamente
      if (Object.keys(respuestasCliente).length === 0 ||
        (Object.keys(respuestasCliente).length === 1 && Object.keys(respuestasCliente)[0] === 'tematica_evento')) {
        console.warn('⚠️ ADVERTENCIA: Parece que solo hay una respuesta. Recargando desde el servidor...');
        // Intentar recargar las respuestas del servidor
        try {
          const response = await preCoordinacionAPI.getByToken(token);
          const data = response.data;
          const respuestasServidor = data.respuestasCliente || {};
          console.log('Respuestas recargadas del servidor:', respuestasServidor);
          console.log('Total de respuestas del servidor:', Object.keys(respuestasServidor).length);

          // Si hay más respuestas en el servidor, usarlas
          if (Object.keys(respuestasServidor).length > Object.keys(respuestasCliente).length) {
            console.log('Usando respuestas del servidor en lugar del estado local');
            // Convertir respuestas del servidor
            const respuestasServidorConvertidas = { ...respuestasServidor };
            const tipoEvento = data.coordinacion.tipo_evento?.trim();
            const pasos = CLIENTE_FLUJOS_POR_TIPO[tipoEvento] || [];

            pasos.forEach(paso => {
              paso.preguntas.forEach(pregunta => {
                if (pregunta.tipo === 'buttons' && respuestasServidorConvertidas[pregunta.id]) {
                  const valor = respuestasServidorConvertidas[pregunta.id];
                  if (typeof valor === 'string') {
                    respuestasServidorConvertidas[pregunta.id] = valor.split(', ').map(v => {
                      if (v.startsWith('Otro: ')) {
                        return { tipo: 'otro', valor: v.replace('Otro: ', '') };
                      }
                      return v;
                    });
                  }
                }
              });
            });

            // Combinar respuestas del servidor con las locales (las locales tienen prioridad)
            const respuestasCombinadas = {
              ...respuestasServidorConvertidas,
              ...respuestasCliente,
            };
            console.log('Respuestas combinadas (servidor + local):', respuestasCombinadas);
            console.log('Total de respuestas combinadas:', Object.keys(respuestasCombinadas).length);

            // Actualizar el estado con las respuestas combinadas
            setRespuestasCliente(respuestasCombinadas);

            // Usar las respuestas combinadas para guardar
            respuestasParaGuardar = { ...respuestasCombinadas };
          } else {
            // Si no hay más respuestas en el servidor, usar las locales
            respuestasParaGuardar = { ...respuestasCliente };
          }
        } catch (reloadError) {
          console.error('Error al recargar respuestas del servidor:', reloadError);
          // Si falla la recarga, usar las respuestas locales
          respuestasParaGuardar = { ...respuestasCliente };
        }
      } else {
        // Si hay suficientes respuestas, usar las locales directamente
        respuestasParaGuardar = { ...respuestasCliente };
      }

      // Si respuestasParaGuardar aún no está definido, usar respuestasCliente
      if (!respuestasParaGuardar || Object.keys(respuestasParaGuardar).length === 0) {
        respuestasParaGuardar = { ...respuestasCliente };
      }
      Object.keys(respuestasParaGuardar).forEach(key => {
        const valor = respuestasParaGuardar[key];
        if (Array.isArray(valor)) {
          // IMPORTANTE: No convertir velas a string, mantener como array de objetos
          if (key === 'velas') {
            // Las velas deben mantenerse como array de objetos
            respuestasParaGuardar[key] = valor;
            console.log('✅ Manteniendo velas como array de objetos:', valor);
          } else {
            // Convertir otros arrays (como botones) a string legible
            const tieneObjetos = valor.some(v => typeof v === 'object' && v.tipo === 'otro');
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
        }
      });

      // Log después de la conversión
      console.log('RespuestasParaGuardar DESPUÉS de conversión:', respuestasParaGuardar);
      console.log('Total de respuestas DESPUÉS de conversión:', Object.keys(respuestasParaGuardar).length);
      console.log('Keys DESPUÉS de conversión:', Object.keys(respuestasParaGuardar));

      // Guardar respuestas en el servidor (no bloquear si falla)
      // Marcar como finalizado = true porque el cliente está completando la pre-coordinación
      try {
        console.log('Enviando respuestas al servidor (FINALIZADO)...');
        const response = await preCoordinacionAPI.guardarRespuestas(token, respuestasParaGuardar, true);
        console.log('Respuesta del servidor:', response);
        console.log('Respuestas guardadas exitosamente');
      } catch (apiError) {
        console.error('Error en la llamada API (continuando de todas formas):', apiError);
        console.error('Detalles del error:', apiError.response?.data);
      }

      // Actualizar estado local con formato convertido
      setRespuestasCliente(respuestasParaGuardar);

    } catch (err) {
      console.error('Error al procesar respuestas:', err);
    } finally {
      // SIEMPRE actualizar los estados para mostrar el mensaje de cierre
      // incluso si hubo un error al guardar
      setMostrarConfirmacion(false);
      setGuardando(false);
      setPreCoordinacionEnviada(true);

      console.log('Estados actualizados para mostrar mensaje de cierre');

      // Scroll al inicio para mostrar el mensaje de cierre
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
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

  // PRIORIDAD 1: Mostrar mensaje de cierre si ya se envió
  if (preCoordinacionEnviada) {
    return (
      <div className={styles.container}>
        {renderBookingModal()}
        {renderSuccessModal()}
        <div className={styles.mensajeCierreContainer}>
          <div className={styles.successAnimationWrapper}>
            <div className={styles.successCircleGlow}></div>
            <svg className={styles.successCheckmark} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className={styles.successCheckmarkCircle} cx="26" cy="26" r="25" fill="none" />
              <path className={styles.successCheckmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
            <div className={styles.sparklesContainer}>
              <div className={`${styles.sparkle} ${styles.sparkle1}`}>✨</div>
              <div className={`${styles.sparkle} ${styles.sparkle2}`}>⭐</div>
              <div className={`${styles.sparkle} ${styles.sparkle3}`}>✨</div>
              <div className={`${styles.sparkle} ${styles.sparkle4}`}>⭐</div>
              <div className={`${styles.sparkle} ${styles.sparkle5}`}>✨</div>
              <div className={`${styles.sparkle} ${styles.sparkle6}`}>⭐</div>
              <div className={`${styles.sparkle} ${styles.sparkle7}`}>✨</div>
              <div className={`${styles.sparkle} ${styles.sparkle8}`}>⭐</div>
            </div>
          </div>
          <h1 className={styles.mensajeCierreTitulo}>¡Pre-Coordinación Finalizada!</h1>
          <p className={styles.mensajeCierreTexto}>
            Hemos recibido tu información y la hemos enviado a nuestro DJ.
          </p>
          <p className={styles.mensajeCierreTexto}>
            Te contactaremos próximamente para coordinar los detalles finales de tu evento.
          </p>
          <div className={styles.mensajeCierreDetalle}>
            <p>Gracias por completar la pre-coordinación. ¡Estamos ansiosos por hacer de tu evento algo especial!</p>
          </div>
          {renderBookingInlineSection()}
        </div>
      </div>
    );
  }

  // PRIORIDAD 2: Mostrar pantalla de bienvenida si es la primera vez
  if (mostrarBienvenida) {
    return (
      <div className={styles.container}>
        <div className={styles.bienvenidaContainer}>
          <div className={styles.bienvenidaContent}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <img src="/logo-janos-blanco.png" alt="Jano's Eventos" style={{ maxHeight: '75px', objectFit: 'contain' }} />
            </div>
            <h1 className={styles.bienvenidaTitulo}>
              ¡Hola, {coordinacion.nombre_agasajado || coordinacion.nombre_cliente || coordinacion.titulo || 'Cliente'}!
            </h1>
            <p className={styles.bienvenidaSubtitulo}>
              Estamos muy contentos de acompañarte en la organización de tu evento
            </p>

            {coordinacion.fecha_evento && (
              <div className={styles.bienvenidaFechaCard}>
                <div className={styles.fechaBadge}>
                  {dateParts ? (
                    <>
                      <span className={styles.fechaMes}>{dateParts.month}</span>
                      <span className={styles.fechaDia}>{dateParts.day}</span>
                      <span className={styles.fechaAnio}>{dateParts.year}</span>
                    </>
                  ) : (
                    <>
                      <span className={styles.fechaMes}>Fecha del Evento</span>
                      <span className={styles.fechaTextoLargo}>{formatDateFromDBLong(coordinacion.fecha_evento)}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className={styles.bienvenidaMensaje}>
              <p>
                Para asegurarnos de que tu evento sea perfecto, necesitamos conocer algunos detalles sobre tus preferencias.
              </p>
              <p>
                El proceso es simple y te guiaremos paso a paso. No te preocupes si no tienes todas las respuestas ahora mismo, podes marcar las que no sepas como &quot;pendiente&quot; para despues hablarlo con el DJ!
              </p>
            </div>

            <button
              onClick={() => setMostrarBienvenida(false)}
              className={styles.bienvenidaBoton}
            >
              Comenzar Pre-Coordinación
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar resumen para confirmar antes de enviar
  // Solo mostrar si no está enviada (para evitar mostrar ambos)
  if (mostrarConfirmacion && !preCoordinacionEnviada) {
    return (
      <div className={styles.container}>
        <div className={styles.resumenContainer}>
          <div className={styles.resumenHeader}>
            <h1>✅ ¡Cuestionario Completado!</h1>
            <p className={styles.mensajeConfirmacion}>
              Por favor, revisa que toda la información sea correcta antes de enviar.
            </p>
          </div>

          <div className={styles.resumenContent}>
            <h2 className={styles.resumenTitulo}>Resumen de tu Pre-Coordinación</h2>

            <div className={styles.resumenInfoGeneral}>
              <div className={styles.resumenInfoItem}>
                <strong>Agasajado/a:</strong> {coordinacion.nombre_agasajado || coordinacion.nombre_cliente || coordinacion.titulo}
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
                let debeMostrar = true;

                if (esCondicional) {
                  const valorCondicional = respuestasCliente[p.condicional.pregunta];
                  const valorEsperado = p.condicional.valor;

                  // Manejar tanto valores string como arrays (para botones)
                  if (Array.isArray(valorCondicional)) {
                    debeMostrar = valorCondicional.includes(valorEsperado);
                  } else if (typeof valorCondicional === 'string') {
                    debeMostrar = valorCondicional === valorEsperado;
                  } else {
                    debeMostrar = false;
                  }
                }

                if (!debeMostrar) return false;

                const valor = respuestasCliente[p.id];
                if (p.tipo === 'velas') {
                  return Array.isArray(valor) && valor.length > 0;
                }
                if (p.tipo === 'buttons') {
                  return Array.isArray(valor) && valor.length > 0;
                }
                return valor !== undefined && valor !== null && valor !== '';
              });

              if (preguntasRespondidas.length === 0) return null;

              return (
                <div key={paso.id} className={styles.resumenSeccion}>
                  <h3 className={styles.resumenSeccionTitulo}>{paso.titulo}</h3>
                  {paso.preguntas.map((pregunta) => {
                    const esCondicional = pregunta.condicional && pregunta.condicional.pregunta;
                    let debeMostrar = true;

                    if (esCondicional) {
                      const valorCondicional = respuestasCliente[pregunta.condicional.pregunta];
                      const valorEsperado = pregunta.condicional.valor;

                      // Manejar tanto valores string como arrays (para botones)
                      if (Array.isArray(valorCondicional)) {
                        debeMostrar = valorCondicional.includes(valorEsperado);
                      } else if (typeof valorCondicional === 'string') {
                        debeMostrar = valorCondicional === valorEsperado;
                      } else {
                        debeMostrar = false;
                      }
                    }

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
                                <div className={styles.candleFlameContainer}>
                                  <div className={styles.candle}>
                                    <div className={styles.flame}></div>
                                  </div>
                                </div>
                                <div className={styles.velaInfo}>
                                  <strong>{vela.nombre}</strong> - {vela.familiar}
                                  <div className={styles.velaCancion}>{vela.cancion}</div>
                                </div>
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

          <div className={styles.resumenAcciones}>
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
        {guardando && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}>
                <div className={styles.spinnerRing}></div>
                <div className={styles.spinnerRing}></div>
                <div className={styles.spinnerRing}></div>
              </div>
              <p className={styles.loadingMessage}>Enviando pre-coordinación...</p>
            </div>
          </div>
        )}
      </div>
    );
  }


  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img src="/logo-janos-blanco.png" alt="Jano's Eventos" style={{ maxHeight: '60px', objectFit: 'contain' }} />
        </div>
        <h1 className={styles.titulo}>Pre-Coordinación del Evento</h1>
        <div className={styles.infoGeneral}>
          <div className={styles.infoItem}>
            <strong>Agasajado/a:</strong> {coordinacion.nombre_agasajado || coordinacion.nombre_cliente || coordinacion.titulo}
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

      <div key={pasoActual} className={`${styles.pasoContainer} ${direction === 'forward' ? styles.slideInRight : styles.slideInLeft} ${(paso.id === 4 || paso.id === 5 || paso.id === 7 || paso.id === 8 || paso.id === 9 || paso.id === 99) ? styles.pasoCentrado : ''}`}>
        <h2 className={styles.pasoTitulo}>{paso.titulo}</h2>
        {paso.descripcion && (
          <p className={styles.pasoDescripcion}>
            {paso.descripcion.replace(/\[nombre de agasajada\/o\]/g, coordinacion?.nombre_agasajado || 'el/la agasajado/a')}
          </p>
        )}

        <div className={styles.preguntas}>
          {paso.preguntas.map((pregunta) => {
            // Verificar si la pregunta condicional se cumple
            const esCondicional = pregunta.condicional && pregunta.condicional.pregunta;
            let debeMostrar = true;

            if (esCondicional) {
              const valorCondicional = respuestasCliente[pregunta.condicional.pregunta];
              const valorEsperado = pregunta.condicional.valor;

              // Manejar tanto valores string como arrays (para botones)
              if (Array.isArray(valorCondicional)) {
                debeMostrar = valorCondicional.includes(valorEsperado);
              } else if (typeof valorCondicional === 'string') {
                debeMostrar = valorCondicional === valorEsperado;
              } else {
                debeMostrar = false;
              }
            }

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
                    {!pregunta.id.includes('coreografia') && (pregunta.id.startsWith('cancion_') || (pregunta.placeholder && pregunta.placeholder.toLowerCase().includes('canción'))) && (
                      <div className={styles.recordatorioAlerta}>
                        <span className={styles.recordatorioFlecha}>↑</span>
                        <span className={styles.recordatorioTexto}>
                          <strong>Recordá ingresar el link/enlace</strong> de la canción o versión exacta (evitando colocar solo nombres genéricos como "Perfect"). ¡Así evitamos errores y nos aseguramos de que suene tu versión preferida! 🎵
                        </span>
                      </div>
                    )}
                    {pregunta.sugerencias && (
                      <div className={styles.sugerenciasWrapper}>
                        <button
                          type="button"
                          onClick={() => toggleSuggestions(pregunta.id)}
                          className={`${styles.sugerenciasBoton} ${!showSuggestions[pregunta.id] ? styles.pulsanteNeon : ''}`}
                        >
                          <svg className={styles.spotifyIcon} viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-.982-.336.075-.668-.135-.744-.47-.077-.337.136-.669.472-.745 3.848-.876 7.144-.505 9.818 1.13.295.18.387.563.207.86zm1.224-2.72c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.076-1.183-.412.125-.845-.107-.97-.52-.125-.413.108-.847.52-.97 3.666-1.11 8.234-.575 11.34 1.337.368.228.488.708.26 1.075zm.106-2.825C14.364 8.78 8.49 8.586 5.1 9.614c-.522.158-1.076-.14-1.235-.662-.158-.523.14-1.077.662-1.236 3.896-1.183 10.385-.95 14.47 1.474.47.28.623.89.344 1.36-.28.47-.89.624-1.36.344z"/>
                          </svg>
                          {showSuggestions[pregunta.id] ? 'Ocultar sugerencias' : 'Ver sugerencias'}
                        </button>
                        <div className={`${styles.sugerenciasContainer} ${showSuggestions[pregunta.id] ? styles.sugerenciasContainerOpen : ''}`}>
                          <div className={styles.sugerenciasTitulo}>
                            <span>🎧</span> Playlists recomendadas en Spotify:
                          </div>
                          <div className={styles.sugerenciasGrid}>
                            {pregunta.sugerencias.map((sug, idx) => (
                              <a
                                key={idx}
                                href={sug.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.spotifyLinkCard}
                              >
                                <svg className={styles.spotifyIcon} viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-.982-.336.075-.668-.135-.744-.47-.077-.337.136-.669.472-.745 3.848-.876 7.144-.505 9.818 1.13.295.18.387.563.207.86zm1.224-2.72c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.076-1.183-.412.125-.845-.107-.97-.52-.125-.413.108-.847.52-.97 3.666-1.11 8.234-.575 11.34 1.337.368.228.488.708.26 1.075zm.106-2.825C14.364 8.78 8.49 8.586 5.1 9.614c-.522.158-1.076-.14-1.235-.662-.158-.523.14-1.077.662-1.236 3.896-1.183 10.385-.95 14.47 1.474.47.28.623.89.344 1.36-.28.47-.89.624-1.36.344z"/>
                                </svg>
                                <span>{sug.titulo}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
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
                              onClick={() => handleButtonToggle(pregunta.id, opcion, pregunta.permiteOtro, pregunta.multiple !== false)}
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
                          <div 
                            key={vela.id} 
                            className={`${styles.velaItem} ${velasEliminando.includes(vela.id) ? styles.velaItemDeleting : ''}`}
                          >
                            <div className={styles.candleFlameContainer}>
                              <div className={styles.candle}>
                                <div className={styles.flame}></div>
                              </div>
                            </div>
                            <div className={styles.velaInfo}>
                              <strong>{vela.nombre}</strong> - {vela.familiar}
                              <div className={styles.velaCancion}>{vela.cancion}</div>
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
        <div 
          className={`${styles.modalOverlay} ${isVelaModalClosing ? styles.modalOverlayClosing : ''}`} 
          onClick={cerrarVelaModal}
        >
          <div 
            className={`${styles.modalContent} ${isVelaModalClosing ? styles.modalContentClosing : ''}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>Agregar Vela</h3>
              <button
                className={styles.modalCloseButton}
                onClick={cerrarVelaModal}
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
                <div className={styles.recordatorioAlerta}>
                  <span className={styles.recordatorioFlecha}>↑</span>
                  <span className={styles.recordatorioTexto}>
                    <strong>Recordá ingresar el link/enlace</strong> de la canción o versión exacta (evitando colocar solo nombres genéricos como "Perfect"). ¡Así evitamos errores y nos aseguramos de que suene tu versión preferida! 🎵
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={cerrarVelaModal}
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
          disabled={pasoActual === 1 || guardando}
          className={styles.botonAnterior}
        >
          ← Anterior
        </button>
        <button
          onClick={handleDejarPendiente}
          disabled={guardando}
          className={styles.botonPendiente}
        >
          Dejar Pendiente ⏳
        </button>
        <button
          onClick={handleSiguiente}
          disabled={guardando}
          className={styles.botonSiguiente}
        >
          {pasoActual === totalPasos ? 'Finalizar' : 'Siguiente →'}
        </button>
      </div>

      <footer className={styles.footer}>
        <p>Tu información será revisada por el DJ antes de la reunión. Gracias por completar este cuestionario.</p>
      </footer>

      {/* Chatbot de ayuda - Opcional, no invasivo */}
      <ChatbotPreCoordinacion
        tipoEvento={tipoEventoNormalizado}
        pasoActual={pasoActual}
        respuestasCliente={respuestasCliente}
      />

      {guardando && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}>
              <div className={styles.spinnerRing}></div>
              <div className={styles.spinnerRing}></div>
              <div className={styles.spinnerRing}></div>
            </div>
            <p className={styles.loadingMessage}>Guardando tu progreso...</p>
          </div>
        </div>
      )}
    </div>
  );
}


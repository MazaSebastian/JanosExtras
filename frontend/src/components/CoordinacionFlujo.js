import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { coordinacionesAPI } from '@/services/api';
import Loading from '@/components/Loading';
import styles from '@/styles/CoordinacionFlujo.module.css';
import { formatDateFromDB } from '@/utils/dateFormat';

// Definición de pasos por tipo de evento
export const FLUJOS_POR_TIPO = {
  XV: [
    {
      id: 1,
      titulo: 'Temática de tus XV',
      preguntas: [
        { id: 'tema_fiesta', label: 'Selecciona la temática de tu fiesta', tipo: 'select', opciones: ['Princesa', 'Moderna n Trendy', 'Descontracturado'], requerido: true },
      ],
    },
    {
      id: 2,
      titulo: 'Música de Recepción',
      preguntas: [
        { id: 'musica_recepcion', label: 'Descripción de la música de recepción', tipo: 'textarea', requerido: true },
        { id: 'artistas_favoritos', label: 'Artistas favoritos', tipo: 'textarea', requerido: false },
      ],
    },
    {
      id: 3,
      titulo: 'Ingreso a Recepción',
      preguntas: [
        { id: 'realiza_ingreso_recepcion', label: '¿Realiza ingreso a recepción?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
        { id: 'cancion_ingreso_recepcion', label: 'Canción para ingreso a recepción', tipo: 'textarea', requerido: false, condicional: { pregunta: 'realiza_ingreso_recepcion', valor: 'Sí' } },
      ],
    },
    {
      id: 4,
      titulo: 'Ingreso al Salón',
      preguntas: [
        { id: 'cancion_ingreso_salon', label: 'Canción de ingreso al salón', tipo: 'textarea', requerido: true },
      ],
    },
    {
      id: 5,
      titulo: 'Vals',
      preguntas: [
        { id: 'baila_vals', label: '¿Va a bailar el vals?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
        { id: 'cancion_vals', label: 'Canción/es para bailar el vals', tipo: 'textarea', requerido: false, condicional: { pregunta: 'baila_vals', valor: 'Sí' } },
      ],
    },
    {
      id: 6,
      titulo: 'Velas',
      preguntas: [
        { id: 'ceremonia_velas', label: '¿Hace ceremonia de velas?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
        { id: 'velas', label: 'Velas', tipo: 'velas', requerido: false, condicional: { pregunta: 'ceremonia_velas', valor: 'Sí' } },
      ],
    },
    {
      id: 7,
      titulo: 'Coreografías',
      preguntas: [
        { id: 'realiza_coreografia', label: '¿Realiza alguna coreografía?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
        { id: 'descripcion_coreografia', label: 'Descripción de la coreografía', tipo: 'textarea', requerido: false, condicional: { pregunta: 'realiza_coreografia', valor: 'Sí' } },
      ],
    },
    {
      id: 8,
      titulo: 'Brindis',
      preguntas: [
        { id: 'cancion_brindis', label: 'Canción para brindis', tipo: 'textarea', requerido: true },
      ],
    },
    {
      id: 9,
      titulo: 'Entrada en Carioca',
      preguntas: [
        { id: 'realiza_ingreso_carioca', label: '¿Realiza ingreso a carioca?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
        { id: 'cancion_ingreso_carioca', label: 'Canción para el ingreso a carioca', tipo: 'textarea', requerido: false, condicional: { pregunta: 'realiza_ingreso_carioca', valor: 'Sí' } },
      ],
    },
    {
      id: 10,
      titulo: 'Musicalización Tandas',
      preguntas: [
        { id: 'tanda_1', label: 'Tanda 1', tipo: 'textarea', requerido: true },
        { id: 'tanda_2', label: 'Tanda 2', tipo: 'textarea', requerido: true },
        { id: 'tanda_3', label: 'Tanda 3', tipo: 'textarea', requerido: true },
        { id: 'tanda_4', label: 'Tanda 4', tipo: 'textarea', requerido: true },
      ],
    },
  ],
  Casamiento: [
    {
      id: 1,
      titulo: 'Estilo de tu Casamiento',
      preguntas: [
        { id: 'estilo_casamiento', label: 'Selecciona el estilo de tu casamiento', tipo: 'select', opciones: ['Ceremonial', 'Formal y Elegante', 'Descontracturado'], requerido: true },
      ],
    },
    {
      id: 2,
      titulo: 'Música de Recepción',
      preguntas: [
        { id: 'musica_recepcion', label: 'Descripción de la música de recepción', tipo: 'textarea', requerido: true },
        { id: 'artistas_favoritos', label: 'Artistas favoritos', tipo: 'textarea', requerido: false },
      ],
    },
    {
      id: 3,
      titulo: 'Ingreso a Recepción',
      preguntas: [
        { id: 'realizan_ingreso_recepcion', label: '¿Realizan ingreso a recepción?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
        { id: 'cancion_ingreso_recepcion', label: 'Canción para el ingreso a recepción', tipo: 'textarea', requerido: false, condicional: { pregunta: 'realizan_ingreso_recepcion', valor: 'Sí' } },
      ],
    },
    {
      id: 4,
      titulo: 'Ceremonia',
      preguntas: [
        { id: 'realizan_ceremonia_salon', label: '¿Realizan ceremonia en el salón?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
        { id: 'detalles_ceremonia', label: 'Detalles de la ceremonia', tipo: 'textarea', requerido: false, condicional: { pregunta: 'realizan_ceremonia_salon', valor: 'Sí' } },
        { id: 'cancion_ingreso_novio', label: 'Canción de ingreso del novio', tipo: 'textarea', requerido: false, condicional: { pregunta: 'realizan_ceremonia_salon', valor: 'Sí' } },
        { id: 'cancion_ingreso_novia', label: 'Canción de ingreso de la novia', tipo: 'textarea', requerido: false, condicional: { pregunta: 'realizan_ceremonia_salon', valor: 'Sí' } },
      ],
    },
    {
      id: 5,
      titulo: 'Ingreso al Salón',
      preguntas: [
        { id: 'realizan_ingreso_salon', label: '¿Realizan ingreso al salón?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
        { id: 'cancion_ingreso_salon', label: 'Canción de ingreso al salón', tipo: 'textarea', requerido: false, condicional: { pregunta: 'realizan_ingreso_salon', valor: 'Sí' } },
      ],
    },
    {
      id: 6,
      titulo: 'Vals',
      preguntas: [
        { id: 'bailan_vals', label: '¿Van a bailar el vals?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
        { id: 'cancion_vals', label: 'Canción para bailar el vals', tipo: 'textarea', requerido: false, condicional: { pregunta: 'bailan_vals', valor: 'Sí' } },
      ],
    },
    {
      id: 7,
      titulo: 'Coreografías',
      preguntas: [
        { id: 'realizan_coreografia', label: '¿Realizan alguna coreografía?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
        { id: 'detalles_coreografia', label: 'Detalles de la coreografía', tipo: 'textarea', requerido: false, condicional: { pregunta: 'realizan_coreografia', valor: 'Sí' } },
      ],
    },
    {
      id: 8,
      titulo: 'Canción para Ramo (novia) / Whisky (novio)',
      preguntas: [
        { id: 'cancion_ramo_novia', label: 'Canción para Ramo (novia)', tipo: 'textarea', requerido: true },
        { id: 'cancion_whisky_novio', label: 'Canción para Whisky (novio)', tipo: 'textarea', requerido: true },
      ],
    },
    {
      id: 9,
      titulo: 'Ingreso a Carioca',
      preguntas: [
        { id: 'realizan_ingreso_carioca', label: '¿Realizan ingreso a carioca?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
        { id: 'cancion_ingreso_carioca', label: 'Canción para el ingreso a carioca', tipo: 'textarea', requerido: false, condicional: { pregunta: 'realizan_ingreso_carioca', valor: 'Sí' } },
      ],
    },
    {
      id: 10,
      titulo: 'Música de Tanda',
      preguntas: [
        { id: 'tanda_1', label: 'Tanda 1', tipo: 'textarea', requerido: true },
        { id: 'tanda_2', label: 'Tanda 2', tipo: 'textarea', requerido: true },
        { id: 'tanda_3', label: 'Tanda 3', tipo: 'textarea', requerido: true },
        { id: 'tanda_4', label: 'Tanda 4', tipo: 'textarea', requerido: true },
      ],
    },
  ],
  Corporativo: [
    {
      id: 1,
      titulo: 'Temática del Evento',
      preguntas: [
        { id: 'tematica_evento', label: 'Selecciona la temática del evento', tipo: 'select', opciones: ['Presentación', 'Charla', 'Team Work', 'Fiesta'], requerido: true },
      ],
    },
    {
      id: 2,
      titulo: 'Colores de la Empresa',
      preguntas: [
        { id: 'colores_empresa', label: 'Colores que representan la empresa', tipo: 'textarea', requerido: true },
      ],
    },
    {
      id: 3,
      titulo: 'Música de Recepción',
      preguntas: [
        { id: 'musica_recepcion', label: 'Descripción de la música de recepción', tipo: 'textarea', requerido: true },
      ],
    },
    {
      id: 4,
      titulo: 'Escenario',
      preguntas: [
        { id: 'requieren_escenario', label: '¿Requieren escenario?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
        { id: 'medidas_aproximadas', label: 'Medidas aproximadas', tipo: 'textarea', requerido: false, condicional: { pregunta: 'requieren_escenario', valor: 'Sí' } },
      ],
    },
    {
      id: 5,
      titulo: 'Pantalla',
      preguntas: [
        { id: 'contratan_pantalla', label: '¿Contratan pantalla?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
        { id: 'material_proyectar', label: 'Material a proyectar', tipo: 'textarea', requerido: false, condicional: { pregunta: 'contratan_pantalla', valor: 'Sí' } },
      ],
    },
    {
      id: 6,
      titulo: 'Sorteos',
      preguntas: [
        { id: 'realizan_sorteos', label: '¿Van a realizar sorteos?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
      ],
    },
    {
      id: 7,
      titulo: 'Música de Tanda',
      preguntas: [
        { id: 'hay_tandas_baile', label: '¿Va a haber tandas de baile?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
        { id: 'tanda_1', label: 'Tanda 1', tipo: 'textarea', requerido: false, condicional: { pregunta: 'hay_tandas_baile', valor: 'Sí' } },
        { id: 'tanda_2', label: 'Tanda 2', tipo: 'textarea', requerido: false, condicional: { pregunta: 'hay_tandas_baile', valor: 'Sí' } },
        { id: 'tanda_3', label: 'Tanda 3', tipo: 'textarea', requerido: false, condicional: { pregunta: 'hay_tandas_baile', valor: 'Sí' } },
        { id: 'tanda_4', label: 'Tanda 4', tipo: 'textarea', requerido: false, condicional: { pregunta: 'hay_tandas_baile', valor: 'Sí' } },
      ],
    },
  ],
  Religioso: [
    {
      id: 1,
      titulo: 'Información del Evento',
      preguntas: [
        { id: 'tipo_ceremonia_religiosa', label: 'Tipo de ceremonia religiosa', tipo: 'select', opciones: ['Misa', 'Bautismo', 'Comunión', 'Confirmación', 'Otro'], requerido: true },
        { id: 'nombre_celebrante', label: 'Nombre del celebrante', tipo: 'text', requerido: false },
        { id: 'cantidad_fieles', label: 'Cantidad aproximada de fieles', tipo: 'number', requerido: true },
        { id: 'lugar_ceremonia', label: 'Lugar de la ceremonia', tipo: 'text', requerido: true },
      ],
    },
    {
      id: 2,
      titulo: 'Horarios',
      preguntas: [
        { id: 'hora_inicio', label: 'Hora de inicio de la ceremonia', tipo: 'time', requerido: true },
        { id: 'duracion_estimada', label: 'Duración estimada (horas)', tipo: 'number', requerido: true },
        { id: 'hora_arribo_dj', label: 'Hora de arribo del DJ', tipo: 'time', requerido: true },
      ],
    },
    {
      id: 3,
      titulo: 'Requisitos Musicales',
      preguntas: [
        { id: 'musica_religiosa', label: 'Música religiosa requerida', tipo: 'textarea', requerido: true },
        { id: 'canciones_especiales', label: 'Canciones especiales o himnos', tipo: 'textarea', requerido: false },
        { id: 'equipamiento_audio', label: 'Equipamiento de audio requerido', tipo: 'textarea', requerido: true },
      ],
    },
  ],
  Cumpleaños: [
    {
      id: 1,
      titulo: 'Temática del Evento',
      preguntas: [
        { id: 'tematica_evento', label: 'Selecciona la temática del evento', tipo: 'select', opciones: ['Formal', 'Descontracturado', 'Temático'], requerido: true },
      ],
    },
    {
      id: 2,
      titulo: 'Música de Recepción',
      preguntas: [
        { id: 'musica_recepcion', label: 'Descripción de la música de recepción', tipo: 'textarea', requerido: true },
        { id: 'artistas_favoritos', label: 'Artistas favoritos', tipo: 'textarea', requerido: false },
      ],
    },
    {
      id: 3,
      titulo: 'Ingreso al Salón',
      preguntas: [
        { id: 'cancion_ingreso_salon', label: 'Canción de ingreso al salón', tipo: 'textarea', requerido: true },
      ],
    },
    {
      id: 4,
      titulo: 'Coreografías',
      preguntas: [
        { id: 'realiza_coreografia', label: '¿Realiza alguna coreografía?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
        { id: 'descripcion_coreografia', label: 'Descripción de la coreografía', tipo: 'textarea', requerido: false, condicional: { pregunta: 'realiza_coreografia', valor: 'Sí' } },
      ],
    },
    {
      id: 5,
      titulo: 'Brindis',
      preguntas: [
        { id: 'cancion_brindis', label: 'Canción para brindis', tipo: 'textarea', requerido: true },
      ],
    },
    {
      id: 6,
      titulo: 'Tandas de Baile',
      preguntas: [
        { id: 'hay_tandas_baile', label: '¿Va a haber tandas de baile?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
        { id: 'tanda_1', label: 'Tanda 1', tipo: 'textarea', requerido: false, condicional: { pregunta: 'hay_tandas_baile', valor: 'Sí' } },
        { id: 'tanda_2', label: 'Tanda 2', tipo: 'textarea', requerido: false, condicional: { pregunta: 'hay_tandas_baile', valor: 'Sí' } },
        { id: 'tanda_3', label: 'Tanda 3', tipo: 'textarea', requerido: false, condicional: { pregunta: 'hay_tandas_baile', valor: 'Sí' } },
        { id: 'tanda_4', label: 'Tanda 4', tipo: 'textarea', requerido: false, condicional: { pregunta: 'hay_tandas_baile', valor: 'Sí' } },
      ],
    },
    {
      id: 7,
      titulo: 'Ingreso a Carioca',
      preguntas: [
        { id: 'realiza_ingreso_carioca', label: '¿Realiza ingreso a carioca?', tipo: 'select', opciones: ['Sí', 'No'], requerido: true },
        { id: 'cancion_ingreso_carioca', label: 'Canción para el ingreso a carioca', tipo: 'textarea', requerido: false, condicional: { pregunta: 'realiza_ingreso_carioca', valor: 'Sí' } },
      ],
    },
  ],
};

export default function CoordinacionFlujo({ coordinacionId }) {
  const router = useRouter();
  const [coordinacion, setCoordinacion] = useState(null);
  const [pasoActual, setPasoActual] = useState(1);
  const [respuestas, setRespuestas] = useState({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [showVelaModal, setShowVelaModal] = useState(false);
  const [velaForm, setVelaForm] = useState({ nombre: '', familiar: '', cancion: '' });
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    loadCoordinacion();
  }, [coordinacionId]);

  const loadCoordinacion = async () => {
    try {
      const response = await coordinacionesAPI.getById(coordinacionId);
      // axios devuelve response.data, pero si es directo puede ser el objeto
      const data = response?.data || response;
      
      console.log('Coordinación cargada:', data);
      console.log('Tipo de evento recibido:', data?.tipo_evento);
      console.log('Tipo de dato:', typeof data?.tipo_evento);
      console.log('Flujos disponibles:', Object.keys(FLUJOS_POR_TIPO));
      
      if (!data) {
        setError('No se pudo cargar la coordinación.');
        setLoading(false);
        return;
      }
      
      setCoordinacion(data);
      
      // Cargar flujo existente si existe (puede contener respuestas del cliente)
      try {
        const flujoResponse = await coordinacionesAPI.getFlujo(coordinacionId);
        const flujoData = flujoResponse?.data || flujoResponse;
        
        if (flujoData && flujoData.respuestas) {
          let respuestasExistentes = typeof flujoData.respuestas === 'string' 
            ? JSON.parse(flujoData.respuestas) 
            : flujoData.respuestas;
          
          // Si hay pre-coordinación completada por el cliente, mapear las respuestas al formato del DJ
          if (data.pre_coordinacion_completado_por_cliente || flujoData.estado === 'completado_por_cliente') {
            console.log('Mapeando respuestas del cliente al formato del DJ...');
            console.log('Respuestas originales del cliente:', respuestasExistentes);
            
            // Mapear respuestas del cliente al formato del DJ
            const respuestasMapeadas = { ...respuestasExistentes };
            
            // Mapear tema_fiesta (XV): convertir valores del cliente al formato del DJ
            if (respuestasMapeadas.tema_fiesta) {
              const tema = respuestasMapeadas.tema_fiesta;
              let valorLimpio = '';
              
              if (typeof tema === 'string') {
                if (tema.startsWith('[') || tema.includes(',')) {
                  try {
                    const parsed = JSON.parse(tema);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      valorLimpio = parsed[0].split('(')[0].trim();
                    }
                  } catch (e) {
                    valorLimpio = tema.split('(')[0].trim();
                  }
                } else {
                  valorLimpio = tema.split('(')[0].trim();
                }
              } else if (Array.isArray(tema) && tema.length > 0) {
                const primerValor = typeof tema[0] === 'string' ? tema[0] : String(tema[0]);
                valorLimpio = primerValor.split('(')[0].trim();
              }
              
              console.log('🔍 Mapeando tema_fiesta:', { original: tema, valorLimpio });
              
              // Mapear valores específicos del cliente al formato del DJ
              const mapeoTemaFiesta = {
                'Princesa': 'Princesa',
                'Moderna y Trendy': 'Moderna n Trendy',
                'Descontracturado': 'Descontracturado'
              };
              
              const valorMapeado = mapeoTemaFiesta[valorLimpio] || valorLimpio;
              console.log('✅ tema_fiesta mapeado:', { valorLimpio, valorMapeado });
              respuestasMapeadas.tema_fiesta = valorMapeado;
            }
            
            // Mapear tematica_evento (Cumpleaños/Corporativo): convertir de "Formal (elegante y sofisticado)" a "Formal"
            if (respuestasMapeadas.tematica_evento) {
              const tematica = respuestasMapeadas.tematica_evento;
              let valorLimpio = '';
              
              if (typeof tematica === 'string') {
                if (tematica.startsWith('[') || tematica.includes(',')) {
                  try {
                    const parsed = JSON.parse(tematica);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      valorLimpio = parsed[0].split('(')[0].trim();
                    }
                  } catch (e) {
                    valorLimpio = tematica.split('(')[0].trim();
                  }
                } else {
                  valorLimpio = tematica.split('(')[0].trim();
                }
              } else if (Array.isArray(tematica) && tematica.length > 0) {
                const primerValor = typeof tematica[0] === 'string' ? tematica[0] : String(tematica[0]);
                valorLimpio = primerValor.split('(')[0].trim();
              }
              
              respuestasMapeadas.tematica_evento = valorLimpio;
            }
            
            // Mapear estilo_casamiento (Casamiento): convertir valores del cliente al formato del DJ
            if (respuestasMapeadas.estilo_casamiento) {
              const estilo = respuestasMapeadas.estilo_casamiento;
              let valorLimpio = '';
              
              if (typeof estilo === 'string') {
                if (estilo.startsWith('[') || estilo.includes(',')) {
                  try {
                    const parsed = JSON.parse(estilo);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      valorLimpio = parsed[0].split('(')[0].trim();
                    }
                  } catch (e) {
                    valorLimpio = estilo.split('(')[0].trim();
                  }
                } else {
                  valorLimpio = estilo.split('(')[0].trim();
                }
              } else if (Array.isArray(estilo) && estilo.length > 0) {
                const primerValor = typeof estilo[0] === 'string' ? estilo[0] : String(estilo[0]);
                valorLimpio = primerValor.split('(')[0].trim();
              }
              
              // Mapear valores específicos del cliente al formato del DJ
              const mapeoEstiloCasamiento = {
                'Ceremonial': 'Ceremonial',
                'Formal y Elegante': 'Formal y Elegante',
                'Descontracturado': 'Descontracturado'
              };
              
              respuestasMapeadas.estilo_casamiento = mapeoEstiloCasamiento[valorLimpio] || valorLimpio;
            }
            
            // Mapear musica_recepcion: convertir de array/string de botones a texto descriptivo
            if (respuestasMapeadas.musica_recepcion) {
              const musica = respuestasMapeadas.musica_recepcion;
              if (typeof musica === 'string') {
                // Si ya es un string con comas, mantenerlo como está
                respuestasMapeadas.musica_recepcion = musica;
              } else if (Array.isArray(musica)) {
                // Convertir array a string separado por comas
                respuestasMapeadas.musica_recepcion = musica.join(', ');
              }
            }
            
            // Mapear realiza_ingreso_salon: convertir de array ["Sí"] a "Sí"
            if (respuestasMapeadas.realiza_ingreso_salon) {
              const ingreso = respuestasMapeadas.realiza_ingreso_salon;
              if (Array.isArray(ingreso) && ingreso.length > 0) {
                respuestasMapeadas.realiza_ingreso_salon = ingreso[0];
              } else if (typeof ingreso === 'string' && (ingreso === 'Sí' || ingreso === 'No' || ingreso === 'S1' || ingreso === 'N1')) {
                // Si es "S1" o "N1" (código interno), convertir a "Sí" o "No"
                respuestasMapeadas.realiza_ingreso_salon = ingreso === 'S1' ? 'Sí' : (ingreso === 'N1' ? 'No' : ingreso);
              }
            }
            
            // Mapear realiza_coreografia: convertir de array ["Sí"] a "Sí"
            if (respuestasMapeadas.realiza_coreografia) {
              const coreografia = respuestasMapeadas.realiza_coreografia;
              if (Array.isArray(coreografia) && coreografia.length > 0) {
                respuestasMapeadas.realiza_coreografia = coreografia[0];
              } else if (typeof coreografia === 'string' && (coreografia === 'S1' || coreografia === 'N1')) {
                respuestasMapeadas.realiza_coreografia = coreografia === 'S1' ? 'Sí' : 'No';
              }
            }
            
            // Mapear realiza_ingreso_carioca: convertir de array ["Sí"] a "Sí"
            if (respuestasMapeadas.realiza_ingreso_carioca) {
              const carioca = respuestasMapeadas.realiza_ingreso_carioca;
              if (Array.isArray(carioca) && carioca.length > 0) {
                respuestasMapeadas.realiza_ingreso_carioca = carioca[0];
              } else if (typeof carioca === 'string' && (carioca === 'S1' || carioca === 'N1')) {
                respuestasMapeadas.realiza_ingreso_carioca = carioca === 'S1' ? 'Sí' : 'No';
              }
            }
            
            // Asegurar que velas sea siempre un array
            if (respuestasMapeadas.velas) {
              if (!Array.isArray(respuestasMapeadas.velas)) {
                // Si velas no es un array, intentar parsearlo o inicializarlo como array vacío
                if (typeof respuestasMapeadas.velas === 'string') {
                  try {
                    const parsed = JSON.parse(respuestasMapeadas.velas);
                    respuestasMapeadas.velas = Array.isArray(parsed) ? parsed : [];
                  } catch (e) {
                    respuestasMapeadas.velas = [];
                  }
                } else {
                  respuestasMapeadas.velas = [];
                }
              }
            } else {
              // Si no existe velas, inicializarlo como array vacío
              respuestasMapeadas.velas = [];
            }
            
            console.log('Respuestas mapeadas al formato del DJ:', respuestasMapeadas);
            respuestasExistentes = respuestasMapeadas;
          }
          
          // Asegurar que velas siempre sea un array antes de pre-llenar
          if (respuestasExistentes.velas && !Array.isArray(respuestasExistentes.velas)) {
            if (typeof respuestasExistentes.velas === 'string') {
              try {
                const parsed = JSON.parse(respuestasExistentes.velas);
                respuestasExistentes.velas = Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                respuestasExistentes.velas = [];
              }
            } else {
              respuestasExistentes.velas = [];
            }
          } else if (!respuestasExistentes.velas) {
            respuestasExistentes.velas = [];
          }
          
          // Pre-llenar respuestas (pueden venir del cliente o ser parciales del DJ)
          setRespuestas(respuestasExistentes);
          
          // Si hay respuestas, continuar desde donde se quedó
          if (flujoData.paso_actual && flujoData.paso_actual < 999) {
            setPasoActual(flujoData.paso_actual);
          }
          
          // Si fue completado por el cliente, mostrar mensaje informativo
          if (flujoData.estado === 'completado_por_cliente' || data.pre_coordinacion_completado_por_cliente) {
            console.log('✅ Esta coordinación ya fue completada por el cliente. Puedes revisar y editar las respuestas.');
          }
        }
      } catch (err) {
        // No es un error crítico si no hay flujo aún
        console.log('No hay flujo guardado aún para esta coordinación');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar coordinación:', err);
      setError(`Error al cargar la coordinación: ${err.message || 'Error desconocido'}`);
      setLoading(false);
    }
  };

  // Normalizar el tipo de evento (trim y verificar coincidencia)
  const tipoEventoNormalizado = useMemo(() => {
    if (!coordinacion?.tipo_evento) return null;
    return coordinacion.tipo_evento.trim();
  }, [coordinacion?.tipo_evento]);
  
  const pasos = tipoEventoNormalizado ? FLUJOS_POR_TIPO[tipoEventoNormalizado] || [] : [];
  const paso = pasos.find(p => p.id === pasoActual);
  const totalPasos = pasos.length;
  
  // Debug: mostrar qué tipo se está usando
  useEffect(() => {
    if (coordinacion?.tipo_evento) {
      console.log('🔍 Debug CoordinacionFlujo:');
      console.log('- Tipo evento raw:', coordinacion.tipo_evento);
      console.log('- Tipo evento normalizado:', tipoEventoNormalizado);
      console.log('- Tipo evento length:', coordinacion.tipo_evento.length);
      console.log('- Tipo evento charCodes:', Array.from(coordinacion.tipo_evento).map(c => c.charCodeAt(0)));
      console.log('- Flujos disponibles:', Object.keys(FLUJOS_POR_TIPO));
      console.log('- ¿Existe en flujos?', FLUJOS_POR_TIPO[tipoEventoNormalizado] ? 'SÍ' : 'NO');
      console.log('- Comparación exacta:', `"${tipoEventoNormalizado}" === "XV"`, tipoEventoNormalizado === 'XV');
    }
  }, [coordinacion, tipoEventoNormalizado]);

  const handleInputChange = (preguntaId, value) => {
    setRespuestas({
      ...respuestas,
      [preguntaId]: value,
    });
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

    const velasActuales = respuestas.velas || [];
    const nuevaVela = {
      id: Date.now(), // ID temporal
      nombre: velaForm.nombre,
      familiar: velaForm.familiar,
      cancion: velaForm.cancion,
    };

    setRespuestas({
      ...respuestas,
      velas: [...velasActuales, nuevaVela],
    });

    setShowVelaModal(false);
    setVelaForm({ nombre: '', familiar: '', cancion: '' });
    setError('');
  };

  const handleEliminarVela = (id) => {
    const velasActuales = respuestas.velas || [];
    setRespuestas({
      ...respuestas,
      velas: velasActuales.filter(v => v.id !== id),
    });
  };

  // Constante para identificar respuestas pendientes
  const VALOR_PENDIENTE = '__PENDIENTE__';
  
  const esPendiente = (valor) => {
    return valor === VALOR_PENDIENTE || valor === '__PENDIENTE__';
  };

  const validarPaso = () => {
    if (!paso) return false;
    
    const preguntasRequeridas = paso.preguntas.filter(p => {
      // Si es condicional, verificar si debe mostrarse
      if (p.condicional && p.condicional.pregunta) {
        const debeMostrar = respuestas[p.condicional.pregunta] === p.condicional.valor;
        return p.requerido && debeMostrar;
      }
      return p.requerido;
    });
    
    // Permitir avanzar si todas las preguntas requeridas tienen respuesta O están marcadas como pendientes
    return preguntasRequeridas.every(p => {
      const valor = respuestas[p.id];
      return (valor !== undefined && valor !== '') || esPendiente(valor);
    });
  };

  const handleSiguiente = async () => {
    if (!validarPaso()) {
      setError('Por favor, completa todos los campos requeridos.');
      return;
    }

    setError('');
    
    if (pasoActual < totalPasos) {
      setPasoActual(pasoActual + 1);
    } else {
      // Último paso - completar flujo
      await completarFlujo();
    }
  };

  const handleAnterior = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
      setError('');
    }
  };

  const guardarProgreso = async () => {
    try {
      setGuardando(true);
      // TODO: Implementar guardado del progreso en la base de datos
      // await coordinacionesFlujoAPI.save(coordinacionId, { pasoActual, respuestas });
    } catch (err) {
      console.error('Error al guardar progreso:', err);
    } finally {
      setGuardando(false);
    }
  };

  const completarFlujo = async () => {
    // En lugar de completar inmediatamente, mostrar el resumen
    setMostrarResumen(true);
  };

  const confirmarYFinalizar = async () => {
    if (!confirmado) {
      setError('Por favor, confirma que toda la información es correcta marcando la casilla de verificación.');
      return;
    }

    try {
      setGuardando(true);
      
      // Guardar el flujo como completado
      await coordinacionesAPI.completeFlujo(coordinacionId, {
        respuestas,
        tipo_evento: coordinacion?.tipo_evento,
      });
      
      // Redirigir a la lista de coordinaciones
      router.push('/dashboard/coordinaciones');
    } catch (err) {
      console.error('Error al completar el flujo:', err);
      setError(err.response?.data?.error || 'Error al completar el flujo.');
      setGuardando(false);
    }
  };

  const exportarAPDF = () => {
    // Crear contenido del PDF
    const contenido = generarContenidoPDF();
    
    // Usar window.print() como solución simple, o implementar jsPDF
    const ventana = window.open('', '_blank');
    ventana.document.write(contenido);
    ventana.document.close();
    ventana.print();
  };

  const generarContenidoPDF = () => {
    const pasos = tipoEventoNormalizado ? FLUJOS_POR_TIPO[tipoEventoNormalizado] || [] : [];
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Resumen de Coordinación - ${coordinacion?.nombre_cliente || coordinacion?.titulo}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 3px solid #772c87; padding-bottom: 10px; }
          h2 { color: #772c87; margin-top: 30px; }
          .seccion { margin-bottom: 25px; }
          .campo { margin-bottom: 15px; }
          .campo-label { font-weight: bold; color: #666; }
          .campo-valor { margin-top: 5px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
          .vela-item { margin: 10px 0; padding: 10px; border-left: 3px solid #772c87; background: #f9f9f9; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #772c87; color: white; }
        </style>
      </head>
      <body>
        <h1>Resumen de Coordinación</h1>
        <div class="seccion">
          <h2>Información General</h2>
          <div class="campo">
            <div class="campo-label">Cliente:</div>
            <div class="campo-valor">${coordinacion?.nombre_cliente || 'N/A'}</div>
          </div>
          <div class="campo">
            <div class="campo-label">Tipo de Evento:</div>
            <div class="campo-valor">${coordinacion?.tipo_evento || 'N/A'}</div>
          </div>
          <div class="campo">
            <div class="campo-label">Código de Evento:</div>
            <div class="campo-valor">${coordinacion?.codigo_evento || 'N/A'}</div>
          </div>
          <div class="campo">
            <div class="campo-label">Fecha del Evento:</div>
            <div class="campo-valor">${coordinacion?.fecha_evento ? formatDateFromDB(coordinacion.fecha_evento) : 'N/A'}</div>
          </div>
        </div>
    `;

    // Agregar información de cada paso
    pasos.forEach((paso) => {
      html += `<div class="seccion"><h2>${paso.titulo}</h2>`;
      
      paso.preguntas.forEach((pregunta) => {
        const esCondicional = pregunta.condicional && pregunta.condicional.pregunta;
        const debeMostrar = !esCondicional || 
          (respuestas[pregunta.condicional.pregunta] === pregunta.condicional.valor);
        
        if (!debeMostrar) return;
        
        let valor = respuestas[pregunta.id];
        
        if (pregunta.tipo === 'velas' && Array.isArray(valor)) {
          html += `<div class="campo"><div class="campo-label">${pregunta.label}:</div>`;
          valor.forEach((vela) => {
            html += `
              <div class="vela-item">
                <strong>${vela.nombre}</strong> - ${vela.familiar}<br>
                🎵 ${vela.cancion}
              </div>
            `;
          });
          html += `</div>`;
        } else if (valor !== undefined && valor !== null && valor !== '') {
          html += `
            <div class="campo">
              <div class="campo-label">${pregunta.label}:</div>
              <div class="campo-valor">${String(valor).replace(/\n/g, '<br>')}</div>
            </div>
          `;
        }
      });
      
      html += `</div>`;
    });

    html += `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd;">
          <p><strong>Fecha de generación:</strong> ${format(new Date(), "dd/MM/yyyy HH:mm")}</p>
          <p><em>Este documento confirma que toda la información ha sido revisada y confirmada por el cliente.</em></p>
        </div>
      </body>
      </html>
    `;

    return html;
  };

  if (loading) {
    return <Loading message="Cargando coordinación..." />;
  }

  if (!coordinacion) {
    return <div className={styles.error}>Coordinación no encontrada.</div>;
  }

  if (!tipoEventoNormalizado) {
    return (
      <div className={styles.error}>
        <p>⚠️ La coordinación no tiene un tipo de evento definido.</p>
        <p>Por favor, edita la coordinación y asigna un tipo de evento antes de iniciar el flujo.</p>
        <p><strong>Valor recibido:</strong> "{coordinacion?.tipo_evento}" (longitud: {coordinacion?.tipo_evento?.length || 0})</p>
        <button
          className={styles.backButton}
          onClick={() => router.push('/dashboard/coordinaciones')}
          style={{ marginTop: '1rem' }}
        >
          ← Volver a Coordinaciones
        </button>
      </div>
    );
  }

  if (!FLUJOS_POR_TIPO[tipoEventoNormalizado]) {
    return (
      <div className={styles.error}>
        <p>⚠️ Tipo de evento "{tipoEventoNormalizado}" no tiene flujo definido.</p>
        <p><strong>Valor recibido:</strong> "{coordinacion.tipo_evento}"</p>
        <p><strong>Valor normalizado:</strong> "{tipoEventoNormalizado}"</p>
        <p><strong>Tipos disponibles:</strong> {Object.keys(FLUJOS_POR_TIPO).join(', ')}</p>
        <p><strong>¿Coincide exactamente?</strong> {Object.keys(FLUJOS_POR_TIPO).includes(tipoEventoNormalizado) ? 'Sí' : 'No'}</p>
        <button
          className={styles.backButton}
          onClick={() => router.push('/dashboard/coordinaciones')}
          style={{ marginTop: '1rem' }}
        >
          ← Volver a Coordinaciones
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => router.push('/dashboard/coordinaciones')}
        >
          ← Volver a Coordinaciones
        </button>
        <h1>Coordinación: {coordinacion.nombre_cliente || coordinacion.titulo}</h1>
        <p className={styles.subtitle}>Tipo: {coordinacion.tipo_evento}</p>
        {coordinacion.pre_coordinacion_completado_por_cliente && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#e8f5e9',
            border: '2px solid #4caf50',
            borderRadius: '8px',
            color: '#2e7d32'
          }}>
            <strong>✅ Pre-Coordinación completada por el cliente</strong>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
              El cliente ya completó el cuestionario. Las respuestas están pre-llenadas. Puedes revisarlas y editarlas si es necesario.
              {coordinacion.pre_coordinacion_fecha_completado && (
                <span> (Completado el {format(new Date(coordinacion.pre_coordinacion_fecha_completado), 'dd/MM/yyyy', { locale: es })})</span>
              )}
            </p>
          </div>
        )}
      </div>

      <div className={styles.progressBar}>
        {pasos.map((paso, index) => (
          <div
            key={paso.id}
            className={`${styles.progressStep} ${
              paso.id < pasoActual ? styles.completed :
              paso.id === pasoActual ? styles.active :
              styles.pending
            }`}
          >
            <div className={styles.stepNumber}>
              {paso.id < pasoActual ? '✓' : paso.id}
            </div>
            <div className={styles.stepLabel}>{paso.titulo}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {mostrarResumen ? (
        <div className={styles.resumenContainer}>
          <h2 className={styles.resumenTitulo}>Resumen de Coordinación</h2>
          <p className={styles.resumenSubtitulo}>
            Por favor, revisa toda la información antes de confirmar. Una vez confirmada, no podrás modificarla.
          </p>

          <div className={styles.resumenSeccion}>
            <h3 className={styles.resumenSeccionTitulo}>Información General</h3>
            <div className={styles.resumenCampo}>
              <span className={styles.resumenLabel}>Cliente:</span>
              <span className={styles.resumenValor}>{coordinacion?.nombre_cliente || 'N/A'}</span>
            </div>
            <div className={styles.resumenCampo}>
              <span className={styles.resumenLabel}>Tipo de Evento:</span>
              <span className={styles.resumenValor}>{coordinacion?.tipo_evento || 'N/A'}</span>
            </div>
            {coordinacion?.codigo_evento && (
              <div className={styles.resumenCampo}>
                <span className={styles.resumenLabel}>Código de Evento:</span>
                <span className={styles.resumenValor}>{coordinacion.codigo_evento}</span>
              </div>
            )}
            {coordinacion?.fecha_evento && (
              <div className={styles.resumenCampo}>
                <span className={styles.resumenLabel}>Fecha del Evento:</span>
                <span className={styles.resumenValor}>
                  {formatDateFromDB(coordinacion.fecha_evento)}
                </span>
              </div>
            )}
          </div>

          {/* Sección de Items Pendientes */}
          {(() => {
            const itemsPendientes = [];
            pasos.forEach((paso) => {
              paso.preguntas.forEach((pregunta) => {
                const esCondicional = pregunta.condicional && pregunta.condicional.pregunta;
                const debeMostrar = !esCondicional || 
                  (respuestas[pregunta.condicional.pregunta] === pregunta.condicional.valor);
                
                if (!debeMostrar) return;
                
                const valor = respuestas[pregunta.id];
                if (esPendiente(valor)) {
                  itemsPendientes.push({
                    paso: paso.titulo,
                    pregunta: pregunta.label
                  });
                }
              });
            });
            
            if (itemsPendientes.length > 0) {
              return (
                <div className={styles.resumenSeccion} style={{
                  background: '#fff3e0',
                  border: '2px solid #ff9800',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <h3 className={styles.resumenSeccionTitulo} style={{ color: '#e65100' }}>
                    ⏳ Items Pendientes ({itemsPendientes.length})
                  </h3>
                  <p style={{ color: '#e65100', marginBottom: '1rem', fontSize: '0.95rem' }}>
                    Los siguientes items quedaron pendientes de confirmar. Recuerda contactar al cliente antes del evento.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    {itemsPendientes.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '0.5rem', color: '#e65100' }}>
                        <strong>{item.paso}:</strong> {item.pregunta}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }
            return null;
          })()}

          {pasos.map((paso) => {
            const tieneRespuestas = paso.preguntas.some((p) => {
              const esCondicional = p.condicional && p.condicional.pregunta;
              const debeMostrar = !esCondicional || 
                (respuestas[p.condicional.pregunta] === p.condicional.valor);
              if (!debeMostrar) return false;
              const valor = respuestas[p.id];
              // Incluir pendientes en la verificación
              return (valor !== undefined && valor !== null && valor !== '') || esPendiente(valor);
            });

            if (!tieneRespuestas) return null;

            return (
              <div key={paso.id} className={styles.resumenSeccion}>
                <h3 className={styles.resumenSeccionTitulo}>{paso.titulo}</h3>
                {paso.preguntas.map((pregunta) => {
                  const esCondicional = pregunta.condicional && pregunta.condicional.pregunta;
                  const debeMostrar = !esCondicional || 
                    (respuestas[pregunta.condicional.pregunta] === pregunta.condicional.valor);
                  
                  if (!debeMostrar) return null;
                  
                  const valor = respuestas[pregunta.id];
                  
                  // Si está pendiente, mostrar como pendiente
                  if (esPendiente(valor)) {
                    return (
                      <div key={pregunta.id} className={styles.resumenCampo} style={{
                        background: '#fff3e0',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #ff9800',
                        marginBottom: '0.5rem'
                      }}>
                        <span className={styles.resumenLabel} style={{ color: '#e65100', fontWeight: 600 }}>
                          {pregunta.label}: <span style={{ fontSize: '0.9rem' }}>⏳ PENDIENTE</span>
                        </span>
                      </div>
                    );
                  }
                  
                  if (pregunta.tipo === 'velas' && Array.isArray(valor) && valor.length > 0) {
                    return (
                      <div key={pregunta.id} className={styles.resumenCampo}>
                        <span className={styles.resumenLabel}>{pregunta.label}:</span>
                        <div className={styles.resumenVelas}>
                          {valor.map((vela) => (
                            <div key={vela.id} className={styles.resumenVelaItem}>
                              <strong>{vela.nombre}</strong> - {vela.familiar}
                              <div className={styles.resumenVelaCancion}>🎵 {vela.cancion}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  
                  if (valor !== undefined && valor !== null && valor !== '') {
                    return (
                      <div key={pregunta.id} className={styles.resumenCampo}>
                        <span className={styles.resumenLabel}>{pregunta.label}:</span>
                        <span className={styles.resumenValor}>
                          {String(valor).split('\n').map((line, i) => (
                            <span key={i}>{line}<br /></span>
                          ))}
                        </span>
                      </div>
                    );
                  }
                  
                  return null;
                })}
              </div>
            );
          })}

          <div className={styles.resumenConfirmacion}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={confirmado}
                onChange={(e) => setConfirmado(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Confirmo que he revisado toda la información y es correcta. Entiendo que después de confirmar no podré modificar estos datos.</span>
            </label>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className={styles.resumenActions}>
            <button
              className={styles.buttonSecondary}
              onClick={() => setMostrarResumen(false)}
              disabled={guardando}
            >
              ← Volver a Editar
            </button>
            <button
              className={styles.buttonSecondary}
              onClick={exportarAPDF}
              disabled={guardando}
            >
              📄 Exportar a PDF
            </button>
            <button
              className={styles.buttonPrimary}
              onClick={confirmarYFinalizar}
              disabled={guardando || !confirmado}
            >
              {guardando ? 'Guardando...' : '✓ Confirmar y Finalizar'}
            </button>
          </div>
        </div>
      ) : paso && (
        <div className={styles.pasoContainer}>
          <h2 className={styles.pasoTitulo}>{paso.titulo}</h2>
          <div className={styles.preguntas}>
            {paso.preguntas.map((pregunta) => {
              // Verificar si la pregunta es condicional
              const esCondicional = pregunta.condicional && pregunta.condicional.pregunta;
              const debeMostrar = !esCondicional || 
                (respuestas[pregunta.condicional.pregunta] === pregunta.condicional.valor);
              
              // Si es condicional y no debe mostrarse, no renderizar
              if (esCondicional && !debeMostrar) {
                return null;
              }
              
              const valorActual = respuestas[pregunta.id] || '';
              const estaPendiente = esPendiente(valorActual);
              
              return (
                <div key={pregunta.id} className={styles.pregunta}>
                <label>
                  {pregunta.label}
                  {pregunta.requerido && debeMostrar && <span className={styles.required}> *</span>}
                  {estaPendiente && (
                    <span style={{ 
                      marginLeft: '0.5rem', 
                      color: '#ff9800', 
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}>
                      ⏳ PENDIENTE
                    </span>
                  )}
                </label>
                {pregunta.tipo === 'text' && (
                  <>
                    <input
                      type="text"
                      value={estaPendiente ? '' : valorActual}
                      onChange={(e) => handleInputChange(pregunta.id, e.target.value)}
                      required={pregunta.requerido && !estaPendiente}
                      disabled={estaPendiente}
                      style={estaPendiente ? { opacity: 0.5, backgroundColor: '#fff3e0' } : {}}
                    />
                    <button
                      type="button"
                      className={styles.pendienteButton}
                      onClick={() => handleInputChange(pregunta.id, estaPendiente ? '' : VALOR_PENDIENTE)}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: estaPendiente ? '#ff9800' : '#f5f5f5',
                        color: estaPendiente ? 'white' : '#666',
                        border: estaPendiente ? '2px solid #ff9800' : '2px solid #ddd',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600
                      }}
                    >
                      {estaPendiente ? '✓ Marcado como Pendiente' : '⏳ Marcar como Pendiente'}
                    </button>
                  </>
                )}
                {pregunta.tipo === 'number' && (
                  <>
                    <input
                      type="number"
                      value={estaPendiente ? '' : valorActual}
                      onChange={(e) => handleInputChange(pregunta.id, e.target.value)}
                      required={pregunta.requerido && !estaPendiente}
                      disabled={estaPendiente}
                      style={estaPendiente ? { opacity: 0.5, backgroundColor: '#fff3e0' } : {}}
                    />
                    <button
                      type="button"
                      className={styles.pendienteButton}
                      onClick={() => handleInputChange(pregunta.id, estaPendiente ? '' : VALOR_PENDIENTE)}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: estaPendiente ? '#ff9800' : '#f5f5f5',
                        color: estaPendiente ? 'white' : '#666',
                        border: estaPendiente ? '2px solid #ff9800' : '2px solid #ddd',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600
                      }}
                    >
                      {estaPendiente ? '✓ Marcado como Pendiente' : '⏳ Marcar como Pendiente'}
                    </button>
                  </>
                )}
                {pregunta.tipo === 'time' && (
                  <>
                    <input
                      type="time"
                      value={estaPendiente ? '' : valorActual}
                      onChange={(e) => handleInputChange(pregunta.id, e.target.value)}
                      required={pregunta.requerido && !estaPendiente}
                      disabled={estaPendiente}
                      style={estaPendiente ? { opacity: 0.5, backgroundColor: '#fff3e0' } : {}}
                    />
                    <button
                      type="button"
                      className={styles.pendienteButton}
                      onClick={() => handleInputChange(pregunta.id, estaPendiente ? '' : VALOR_PENDIENTE)}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: estaPendiente ? '#ff9800' : '#f5f5f5',
                        color: estaPendiente ? 'white' : '#666',
                        border: estaPendiente ? '2px solid #ff9800' : '2px solid #ddd',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600
                      }}
                    >
                      {estaPendiente ? '✓ Marcado como Pendiente' : '⏳ Marcar como Pendiente'}
                    </button>
                  </>
                )}
                {pregunta.tipo === 'textarea' && (
                  <>
                    <textarea
                      value={estaPendiente ? '' : valorActual}
                      onChange={(e) => handleInputChange(pregunta.id, e.target.value)}
                      rows={4}
                      required={pregunta.requerido && !estaPendiente}
                      disabled={estaPendiente}
                      style={estaPendiente ? { opacity: 0.5, backgroundColor: '#fff3e0' } : {}}
                    />
                    <button
                      type="button"
                      className={styles.pendienteButton}
                      onClick={() => handleInputChange(pregunta.id, estaPendiente ? '' : VALOR_PENDIENTE)}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: estaPendiente ? '#ff9800' : '#f5f5f5',
                        color: estaPendiente ? 'white' : '#666',
                        border: estaPendiente ? '2px solid #ff9800' : '2px solid #ddd',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600
                      }}
                    >
                      {estaPendiente ? '✓ Marcado como Pendiente' : '⏳ Marcar como Pendiente'}
                    </button>
                  </>
                )}
                {pregunta.tipo === 'velas' && (
                  <div className={styles.velasContainer}>
                    <button
                      type="button"
                      className={styles.agregarVelaButton}
                      onClick={handleAgregarVela}
                    >
                      + AGREGAR VELA
                    </button>
                    {Array.isArray(respuestas.velas) && respuestas.velas.length > 0 && (
                      <div className={styles.velasList}>
                        {respuestas.velas.map((vela) => (
                          <div key={vela.id} className={styles.velaItem}>
                            <div className={styles.velaInfo}>
                              <strong>{vela.nombre}</strong> - {vela.familiar}
                              <div className={styles.velaCancion}>🎵 {vela.cancion}</div>
                            </div>
                            <button
                              type="button"
                              className={styles.eliminarVelaButton}
                              onClick={() => handleEliminarVela(vela.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {pregunta.tipo === 'select' && (pregunta.id === 'tema_fiesta' || pregunta.id === 'estilo_casamiento' || pregunta.id === 'tematica_evento') ? (
                  <>
                    <div className={styles.tematicaButtons}>
                      {pregunta.opciones.map((opcion) => {
                        const valorActualSelect = respuestas[pregunta.id];
                        const estaSeleccionado = valorActualSelect === opcion && !esPendiente(valorActualSelect);
                        // Log para depuración solo la primera vez que se renderiza
                        if (pregunta.id === 'tema_fiesta' && valorActualSelect && pregunta.opciones.indexOf(opcion) === 0) {
                          console.log(`🔍 Renderizando botones tema_fiesta:`, { 
                            valorActualSelect, 
                            todasLasOpciones: pregunta.opciones,
                            estaSeleccionadoParaEstaOpcion: estaSeleccionado
                          });
                        }
                        return (
                          <button
                            key={opcion}
                            type="button"
                            className={`${styles.tematicaButton} ${
                              estaSeleccionado ? styles.tematicaButtonActive : ''
                            }`}
                            onClick={() => handleInputChange(pregunta.id, opcion)}
                            disabled={estaPendiente}
                            style={estaPendiente ? { opacity: 0.5 } : {}}
                          >
                            {opcion}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      className={styles.pendienteButton}
                      onClick={() => handleInputChange(pregunta.id, estaPendiente ? '' : VALOR_PENDIENTE)}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: estaPendiente ? '#ff9800' : '#f5f5f5',
                        color: estaPendiente ? 'white' : '#666',
                        border: estaPendiente ? '2px solid #ff9800' : '2px solid #ddd',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600
                      }}
                    >
                      {estaPendiente ? '✓ Marcado como Pendiente' : '⏳ Marcar como Pendiente'}
                    </button>
                  </>
                ) : pregunta.tipo === 'select' ? (
                  <>
                    <select
                      value={estaPendiente ? '' : (respuestas[pregunta.id] || '')}
                      onChange={(e) => handleInputChange(pregunta.id, e.target.value)}
                      required={pregunta.requerido && !estaPendiente}
                      disabled={estaPendiente}
                      style={estaPendiente ? { opacity: 0.5, backgroundColor: '#fff3e0' } : {}}
                    >
                      <option value="">Seleccionar...</option>
                      {pregunta.opciones.map((opcion) => (
                        <option key={opcion} value={opcion}>
                          {opcion}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={styles.pendienteButton}
                      onClick={() => handleInputChange(pregunta.id, estaPendiente ? '' : VALOR_PENDIENTE)}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: estaPendiente ? '#ff9800' : '#f5f5f5',
                        color: estaPendiente ? 'white' : '#666',
                        border: estaPendiente ? '2px solid #ff9800' : '2px solid #ddd',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600
                      }}
                    >
                      {estaPendiente ? '✓ Marcado como Pendiente' : '⏳ Marcar como Pendiente'}
                    </button>
                  </>
                ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={styles.buttonSecondary}
          onClick={handleAnterior}
          disabled={pasoActual === 1 || guardando}
        >
          ← Anterior
        </button>
        <button
          className={styles.buttonSecondary}
          onClick={guardarProgreso}
          disabled={guardando}
        >
          {guardando ? 'Guardando...' : '💾 Guardar Progreso'}
        </button>
          <button
            className={styles.buttonPrimary}
            onClick={pasoActual < totalPasos ? handleSiguiente : completarFlujo}
            disabled={guardando}
          >
            {pasoActual < totalPasos ? 'Siguiente →' : '✓ Ver Resumen'}
          </button>
      </div>

      {/* Modal para agregar vela */}
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
              <div className={styles.formGroup}>
                <label>Nombre *</label>
                <input
                  type="text"
                  value={velaForm.nombre}
                  onChange={(e) => setVelaForm({ ...velaForm, nombre: e.target.value })}
                  placeholder="Nombre de la persona"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Familiar *</label>
                <input
                  type="text"
                  value={velaForm.familiar}
                  onChange={(e) => setVelaForm({ ...velaForm, familiar: e.target.value })}
                  placeholder="Ej: Madre, Padre, Abuela, etc."
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Canción *</label>
                <input
                  type="text"
                  value={velaForm.cancion}
                  onChange={(e) => setVelaForm({ ...velaForm, cancion: e.target.value })}
                  placeholder="Nombre de la canción"
                  required
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.buttonSecondary}
                onClick={() => {
                  setShowVelaModal(false);
                  setVelaForm({ nombre: '', familiar: '', cancion: '' });
                }}
              >
                Cancelar
              </button>
              <button
                className={styles.buttonPrimary}
                onClick={handleGuardarVela}
              >
                Guardar Vela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


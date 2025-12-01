/**
 * Base de Conocimiento del Chatbot para Pre-Coordinación
 * Fase 1: MVP con reglas simples (sin IA)
 */

// Preguntas Frecuentes por tipo de evento
export const FAQs = {
  XV: [
    {
      pregunta: '¿Qué es la recepción?',
      respuesta: 'La recepción es el momento inicial del evento, cuando los invitados llegan y se reúnen antes de entrar al salón principal. Es un momento más relajado donde se sirven aperitivos y bebidas.',
      keywords: ['recepción', 'recepcion', 'que es recepción']
    },
    {
      pregunta: '¿Qué es el vals?',
      respuesta: 'El vals es el baile tradicional de los XV años. Es el primer baile que realiza la quinceañera, generalmente con su padre o padrino. Es un momento muy especial y emotivo del evento.',
      keywords: ['vals', 'baile', 'que es vals']
    },
    {
      pregunta: '¿Qué es la ceremonia de velas?',
      respuesta: 'La ceremonia de velas es un momento emotivo donde la quinceañera enciende velas en honor a personas especiales (familiares, amigos). Cada vela tiene una canción dedicada.',
      keywords: ['velas', 'ceremonia', 'ceremonia de velas']
    },
    {
      pregunta: '¿Qué es el ingreso a carioca?',
      respuesta: 'El ingreso a carioca es el momento cuando la quinceañera hace su entrada especial a la fiesta (después de la cena). Es un momento muy importante y emocionante.',
      keywords: ['carioca', 'ingreso carioca', 'entrada carioca']
    },
    {
      pregunta: '¿Puedo cambiar mis respuestas después?',
      respuesta: 'Sí, puedes modificar tus respuestas en cualquier momento antes de finalizar la pre-coordinación. Una vez que envíes todo, el DJ revisará la información y podrás coordinar cambios directamente con él.',
      keywords: ['cambiar', 'modificar', 'editar', 'respuestas']
    }
  ],
  Casamiento: [
    {
      pregunta: '¿Qué es la recepción?',
      respuesta: 'La recepción es el momento inicial del evento, cuando los invitados llegan y se reúnen antes de la ceremonia o entrada al salón. Es un momento más relajado donde se sirven aperitivos y bebidas.',
      keywords: ['recepción', 'recepcion', 'que es recepción']
    },
    {
      pregunta: '¿Qué es la ceremonia?',
      respuesta: 'La ceremonia es el momento más importante del casamiento, donde los novios se casan. Puede realizarse en el salón o en otro lugar (iglesia, civil, etc.).',
      keywords: ['ceremonia', 'que es ceremonia', 'boda']
    },
    {
      pregunta: '¿Qué es el vals?',
      respuesta: 'El vals es el primer baile de los novios como pareja casada. Es un momento muy especial y tradicional del casamiento.',
      keywords: ['vals', 'baile', 'primer baile']
    },
    {
      pregunta: '¿Qué es el ramo?',
      respuesta: 'El ramo es una tradición donde la novia lanza su ramo de flores a las solteras. Es un momento divertido y tradicional del casamiento.',
      keywords: ['ramo', 'ramo novia', 'lanzar ramo']
    },
    {
      pregunta: '¿Qué es el whisky?',
      respuesta: 'El whisky (o brindis del novio) es cuando el novio hace un brindis especial, generalmente con una canción dedicada. Es una tradición del casamiento.',
      keywords: ['whisky', 'brindis novio', 'whisky novio']
    },
    {
      pregunta: '¿Puedo cambiar mis respuestas después?',
      respuesta: 'Sí, puedes modificar tus respuestas en cualquier momento antes de finalizar la pre-coordinación. Una vez que envíes todo, el DJ revisará la información y podrás coordinar cambios directamente con él.',
      keywords: ['cambiar', 'modificar', 'editar', 'respuestas']
    }
  ],
  Corporativo: [
    {
      pregunta: '¿Qué es la recepción?',
      respuesta: 'La recepción es el momento inicial del evento, cuando los invitados llegan y se reúnen. Es un momento de networking y bienvenida antes de comenzar las actividades principales.',
      keywords: ['recepción', 'recepcion', 'que es recepción']
    },
    {
      pregunta: '¿Qué son las tandas de baile?',
      respuesta: 'Las tandas de baile son bloques de música para bailar durante el evento. Puedes tener diferentes estilos musicales para cada tanda.',
      keywords: ['tandas', 'tanda', 'baile', 'música baile']
    },
    {
      pregunta: '¿Puedo cambiar mis respuestas después?',
      respuesta: 'Sí, puedes modificar tus respuestas en cualquier momento antes de finalizar la pre-coordinación. Una vez que envíes todo, el DJ revisará la información y podrás coordinar cambios directamente con él.',
      keywords: ['cambiar', 'modificar', 'editar', 'respuestas']
    }
  ],
  Cumpleaños: [
    {
      pregunta: '¿Qué es la recepción?',
      respuesta: 'La recepción es el momento inicial del evento, cuando los invitados llegan y se reúnen. Es un momento más relajado donde se sirven aperitivos y bebidas.',
      keywords: ['recepción', 'recepcion', 'que es recepción']
    },
    {
      pregunta: '¿Qué es el ingreso a carioca?',
      respuesta: 'El ingreso a carioca es el momento cuando el cumpleañero hace su entrada especial a la fiesta (después de la cena). Es un momento muy importante y emocionante.',
      keywords: ['carioca', 'ingreso carioca', 'entrada carioca']
    },
    {
      pregunta: '¿Puedo cambiar mis respuestas después?',
      respuesta: 'Sí, puedes modificar tus respuestas en cualquier momento antes de finalizar la pre-coordinación. Una vez que envíes todo, el DJ revisará la información y podrás coordinar cambios directamente con él.',
      keywords: ['cambiar', 'modificar', 'editar', 'respuestas']
    }
  ],
  // FAQs generales (aplican a todos los tipos)
  general: [
    {
      pregunta: '¿Cuánto tiempo toma completar esto?',
      respuesta: 'La pre-coordinación toma aproximadamente 10-15 minutos. Te guiamos paso a paso, así que no te preocupes si no sabes todas las respuestas de inmediato.',
      keywords: ['tiempo', 'cuanto', 'duración', 'demora']
    },
    {
      pregunta: '¿Qué pasa si no sé qué canción elegir?',
      respuesta: 'No te preocupes! Puedes dejarlo en blanco por ahora y el DJ te ayudará a elegir más adelante. También puedes pedirme sugerencias y te ayudo con opciones populares.',
      keywords: ['canción', 'cancion', 'no sé', 'no se', 'sugerencias']
    },
    {
      pregunta: '¿Necesito completar todo ahora?',
      respuesta: 'Puedes guardar tu progreso y continuar más tarde. No es necesario completar todo de una vez. Puedes volver cuando quieras usando el mismo link.',
      keywords: ['completar', 'ahora', 'después', 'más tarde']
    },
    {
      pregunta: '¿Puedo pedir ayuda?',
      respuesta: '¡Por supuesto! Estoy aquí para ayudarte. Puedes preguntarme cualquier duda sobre el proceso o sobre los términos que no entiendas.',
      keywords: ['ayuda', 'help', 'asistencia', 'duda']
    }
  ]
};

// Sugerencias de canciones populares por momento y tipo de evento
export const SUGERENCIAS_CANCIONES = {
  ingreso_recepcion: {
    casamiento: [
      'At Last - Etta James',
      'Marry You - Bruno Mars',
      'All of Me - John Legend',
      'Perfect - Ed Sheeran',
      'A Thousand Years - Christina Perri',
      'Thinking Out Loud - Ed Sheeran'
    ],
    xv: [
      'Diamonds - Rihanna',
      'Shake It Off - Taylor Swift',
      'Firework - Katy Perry',
      'Roar - Katy Perry'
    ],
    cumpleaños: [
      'Happy - Pharrell Williams',
      'Celebration - Kool & The Gang',
      'I Gotta Feeling - Black Eyed Peas'
    ]
  },
  ingreso_salon: {
    casamiento: [
      'Marry You - Bruno Mars',
      'Best Day of My Life - American Authors',
      'I Gotta Feeling - Black Eyed Peas',
      'Celebration - Kool & The Gang'
    ],
    xv: [
      'Diamonds - Rihanna',
      'Shake It Off - Taylor Swift',
      'Firework - Katy Perry'
    ],
    cumpleaños: [
      'Happy - Pharrell Williams',
      'Celebration - Kool & The Gang'
    ]
  },
  vals: {
    casamiento: [
      'At Last - Etta James',
      'La Vie En Rose - Louis Armstrong',
      'Fly Me to the Moon - Frank Sinatra',
      'The Way You Look Tonight - Frank Sinatra'
    ],
    xv: [
      'A Thousand Years - Christina Perri',
      'Perfect - Ed Sheeran',
      'All of Me - John Legend'
    ]
  },
  brindis: {
    general: [
      'Celebration - Kool & The Gang',
      'I Gotta Feeling - Black Eyed Peas',
      'We Are Family - Sister Sledge',
      'Happy - Pharrell Williams'
    ]
  }
};

// Explicaciones de términos técnicos
export const TERMINOS = {
  recepcion: 'La recepción es el momento inicial del evento, cuando los invitados llegan y se reúnen antes de entrar al salón principal.',
  carioca: 'El ingreso a carioca es el momento cuando haces tu entrada especial a la fiesta, generalmente después de la cena.',
  vals: 'El vals es el baile tradicional. En casamientos es el primer baile de los novios, en XV es el baile de la quinceañera.',
  ceremonia: 'La ceremonia es el momento más importante del casamiento, donde los novios se casan oficialmente.',
  tandas: 'Las tandas son bloques de música para bailar. Puedes tener diferentes estilos musicales para cada tanda.'
};

/**
 * Busca una respuesta en la base de conocimiento
 * @param {string} mensaje - Mensaje del usuario
 * @param {string} tipoEvento - Tipo de evento (XV, Casamiento, etc.)
 * @returns {object|null} Respuesta encontrada o null
 */
export function buscarRespuesta(mensaje, tipoEvento = null) {
  const mensajeLower = mensaje.toLowerCase().trim();
  
  // Buscar en FAQs específicas del tipo de evento
  if (tipoEvento && FAQs[tipoEvento]) {
    for (const faq of FAQs[tipoEvento]) {
      for (const keyword of faq.keywords) {
        if (mensajeLower.includes(keyword.toLowerCase())) {
          return {
            respuesta: faq.respuesta,
            tipo: 'faq',
            fuente: tipoEvento
          };
        }
      }
    }
  }
  
  // Buscar en FAQs generales
  for (const faq of FAQs.general) {
    for (const keyword of faq.keywords) {
      if (mensajeLower.includes(keyword.toLowerCase())) {
        return {
          respuesta: faq.respuesta,
          tipo: 'faq',
          fuente: 'general'
        };
      }
    }
  }
  
  // Buscar términos técnicos
  for (const [termino, explicacion] of Object.entries(TERMINOS)) {
    if (mensajeLower.includes(termino)) {
      return {
        respuesta: explicacion,
        tipo: 'termino',
        fuente: termino
      };
    }
  }
  
  return null;
}

/**
 * Obtiene sugerencias de canciones para un momento específico
 * @param {string} momento - Momento del evento (ingreso_recepcion, vals, etc.)
 * @param {string} tipoEvento - Tipo de evento
 * @returns {array} Lista de sugerencias
 */
export function obtenerSugerenciasCanciones(momento, tipoEvento) {
  if (SUGERENCIAS_CANCIONES[momento]) {
    if (SUGERENCIAS_CANCIONES[momento][tipoEvento]) {
      return SUGERENCIAS_CANCIONES[momento][tipoEvento];
    }
    if (SUGERENCIAS_CANCIONES[momento].general) {
      return SUGERENCIAS_CANCIONES[momento].general;
    }
  }
  return [];
}

/**
 * Procesa un mensaje del usuario y retorna una respuesta
 * @param {string} mensaje - Mensaje del usuario
 * @param {object} contexto - Contexto actual (tipoEvento, pasoActual, etc.)
 * @returns {object} Respuesta del chatbot
 */
export function procesarMensaje(mensaje, contexto = {}) {
  const { tipoEvento, pasoActual } = contexto;
  
  // Saludos
  if (mensaje.match(/^(hola|hi|buenos días|buenas|saludos)/i)) {
    return {
      respuesta: '¡Hola! 👋 Soy tu asistente para la pre-coordinación. ¿En qué puedo ayudarte?',
      tipo: 'saludo'
    };
  }
  
  // Despedidas
  if (mensaje.match(/^(gracias|chau|adiós|bye|hasta luego)/i)) {
    return {
      respuesta: '¡De nada! 😊 Si necesitas algo más, no dudes en preguntarme.',
      tipo: 'despedida'
    };
  }
  
  // Solicitud de ayuda
  if (mensaje.match(/(ayuda|help|asistencia|no entiendo|no sé|no se)/i)) {
    return {
      respuesta: '¡Por supuesto! Estoy aquí para ayudarte. Puedes preguntarme sobre cualquier término que no entiendas, pedirme sugerencias de canciones, o cualquier duda sobre el proceso. ¿Qué necesitas?',
      tipo: 'ayuda'
    };
  }
  
  // Solicitud de sugerencias de canciones
  if (mensaje.match(/(sugerencia|sugerir|recomendación|recomendar|canción|cancion|música|musica)/i)) {
    const momento = detectarMomento(mensaje);
    if (momento && tipoEvento) {
      const sugerencias = obtenerSugerenciasCanciones(momento, tipoEvento);
      if (sugerencias.length > 0) {
        return {
          respuesta: `Te sugiero estas canciones populares:\n${sugerencias.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n¿Te gusta alguna de estas?`,
          tipo: 'sugerencias',
          sugerencias: sugerencias
        };
      }
    }
    return {
      respuesta: 'Puedo sugerirte canciones. ¿Para qué momento? (ingreso a recepción, vals, brindis, etc.)',
      tipo: 'pregunta'
    };
  }
  
  // Buscar en base de conocimiento
  const respuesta = buscarRespuesta(mensaje, tipoEvento);
  if (respuesta) {
    return respuesta;
  }
  
  // Respuesta por defecto
  return {
    respuesta: 'Entiendo tu pregunta. ¿Podrías ser más específico? Puedo ayudarte con:\n- Explicaciones de términos\n- Sugerencias de canciones\n- Preguntas sobre el proceso\n\n¿Qué necesitas?',
    tipo: 'default'
  };
}

/**
 * Detecta el momento del evento mencionado en el mensaje
 * @param {string} mensaje - Mensaje del usuario
 * @returns {string|null} Momento detectado
 */
function detectarMomento(mensaje) {
  const mensajeLower = mensaje.toLowerCase();
  
  if (mensajeLower.match(/ingreso.*recepcion|recepcion/)) {
    return 'ingreso_recepcion';
  }
  if (mensajeLower.match(/ingreso.*salon|salon/)) {
    return 'ingreso_salon';
  }
  if (mensajeLower.match(/vals|baile/)) {
    return 'vals';
  }
  if (mensajeLower.match(/brindis/)) {
    return 'brindis';
  }
  
  return null;
}


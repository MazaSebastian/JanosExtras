// Flujos simplificados y amigables para clientes en pre-coordinación
// Estos flujos están diseñados para ser más intuitivos y menos técnicos que los flujos de DJs

export const CLIENTE_FLUJOS_POR_TIPO = {
  XV: [
    {
      id: 1,
      titulo: '🎉 Sobre tu Fiesta',
      descripcion: 'Cuéntanos cómo te imaginas tu fiesta de XV',
      preguntas: [
        { 
          id: 'tema_fiesta', 
          label: '¿Qué estilo te gusta más para tu fiesta?', 
          tipo: 'select', 
          opciones: ['Princesa (clásico y elegante)', 'Moderna y Trendy (actual y divertida)', 'Descontracturado (relajado y casual)'], 
          requerido: true,
          ayuda: 'Elige el estilo que mejor represente cómo te imaginas tu celebración'
        },
      ],
    },
    {
      id: 2,
      titulo: '🎵 La Música',
      descripcion: 'Ayúdanos a elegir la música perfecta para tu evento',
      preguntas: [
        { 
          id: 'musica_recepcion', 
          label: '¿Qué tipo de música te gustaría durante la recepción?', 
          tipo: 'buttons', 
          requerido: true,
          opciones: [
            'Música Chill',
            'Acústicos',
            'Bossa N Nova',
            'Rock Nacional',
            'Pop Funcional',
            'Deep House',
            'Música Comercial',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
        { 
          id: 'artistas_favoritos', 
          label: '¿Tienes artistas o canciones favoritas que no pueden faltar? (opcional)', 
          tipo: 'buttons', 
          requerido: false,
          opciones: [
            'Shakira',
            'Maluma',
            'Bad Bunny',
            'J Balvin',
            'Daddy Yankee',
            'Ricky Martin',
            'Luis Fonsi',
            'Enrique Iglesias',
            'Marc Anthony',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
      ],
    },
    {
      id: 3,
      titulo: '🚪 Momentos Especiales',
      descripcion: 'Estos son los momentos más importantes de tu fiesta',
      preguntas: [
        { 
          id: 'realiza_ingreso_recepcion', 
          label: '¿Harás un ingreso especial a la recepción?', 
          tipo: 'select', 
          opciones: ['Sí', 'No'], 
          requerido: true 
        },
        { 
          id: 'cancion_ingreso_recepcion', 
          label: '¿Qué canción te gustaría para tu ingreso a la recepción?', 
          tipo: 'textarea', 
          requerido: false, 
          condicional: { pregunta: 'realiza_ingreso_recepcion', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
        { 
          id: 'realiza_ingreso_salon', 
          label: '¿Realizas ingreso al salón?', 
          tipo: 'buttons', 
          opciones: ['Sí', 'No'], 
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        { 
          id: 'cancion_ingreso_salon', 
          label: 'Canción de ingreso:', 
          tipo: 'textarea', 
          requerido: false,
          condicional: { pregunta: 'realiza_ingreso_salon', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
      ],
    },
    {
      id: 4,
      titulo: '💃 El Vals',
      descripcion: 'El baile tradicional de los XV',
      preguntas: [
        { 
          id: 'baila_vals', 
          label: '¿Vas a bailar el vals?', 
          tipo: 'select', 
          opciones: ['Sí', 'No'], 
          requerido: true 
        },
        { 
          id: 'cancion_vals', 
          label: '¿Qué canción te gustaría para el vals? (puedes mencionar más de una si quieres)', 
          tipo: 'textarea', 
          requerido: false, 
          condicional: { pregunta: 'baila_vals', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
      ],
    },
    {
      id: 5,
      titulo: '🕯️ Ceremonia de Velas',
      descripcion: 'Un momento muy emotivo donde honras a personas especiales',
      preguntas: [
        { 
          id: 'ceremonia_velas', 
          label: '¿Harás ceremonia de velas?', 
          tipo: 'select', 
          opciones: ['Sí', 'No'], 
          requerido: true 
        },
        { 
          id: 'velas', 
          label: 'Velas', 
          tipo: 'velas', 
          requerido: false, 
          condicional: { pregunta: 'ceremonia_velas', valor: 'Sí' },
          ayuda: 'Agrega cada vela que quieras incluir. Para cada una, indica a quién está dedicada y qué canción quieres'
        },
      ],
    },
    {
      id: 6,
      titulo: '🎭 Coreografías y Presentaciones',
      descripcion: '¿Tienes alguna presentación especial planificada?',
      preguntas: [
        { 
          id: 'realiza_coreografia', 
          label: '¿Harás alguna coreografía o presentación especial?', 
          tipo: 'select', 
          opciones: ['Sí', 'No'], 
          requerido: true 
        },
        { 
          id: 'descripcion_coreografia', 
          label: 'Cuéntanos sobre tu coreografía o presentación', 
          tipo: 'textarea', 
          requerido: false, 
          condicional: { pregunta: 'realiza_coreografia', valor: 'Sí' },
          placeholder: 'Describe qué harás, con quién, y si necesitas alguna canción específica'
        },
      ],
    },
    {
      id: 7,
      titulo: '🥂 Brindis',
      descripcion: 'El momento del brindis',
      preguntas: [
        { 
          id: 'cancion_brindis', 
          label: '¿Qué canción te gustaría para el brindis?', 
          tipo: 'textarea', 
          requerido: true,
          placeholder: 'Nombre de la canción y artista'
        },
      ],
    },
    {
      id: 8,
      titulo: '🎊 Ingreso a Carioca',
      descripcion: 'El momento de la fiesta',
      preguntas: [
        { 
          id: 'realiza_ingreso_carioca', 
          label: '¿Harás un ingreso especial a la carioca (fiesta)?', 
          tipo: 'select', 
          opciones: ['Sí', 'No'], 
          requerido: true 
        },
        { 
          id: 'cancion_ingreso_carioca', 
          label: '¿Qué canción te gustaría para tu ingreso a la carioca?', 
          tipo: 'textarea', 
          requerido: false, 
          condicional: { pregunta: 'realiza_ingreso_carioca', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
      ],
    },
    {
      id: 9,
      titulo: '🎶 Música para Bailar',
      descripcion: 'Las tandas de baile son los momentos donde todos bailan',
      preguntas: [
        { 
          id: 'tanda_1', 
          label: 'Tanda 1 - ¿Qué música te gustaría?', 
          tipo: 'buttons', 
          requerido: true,
          opciones: [
            'Cumbia',
            'Reggaeton',
            'Pop de los 2000s',
            'Pop actual',
            'Rock nacional',
            'Música latina',
            'Bachata',
            'Salsa',
            'Cuarteto',
            'Electrónica',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
        { 
          id: 'tanda_2', 
          label: 'Tanda 2 - ¿Qué música te gustaría?', 
          tipo: 'buttons', 
          requerido: true,
          opciones: [
            'Cumbia',
            'Reggaeton',
            'Pop de los 2000s',
            'Pop actual',
            'Rock nacional',
            'Música latina',
            'Bachata',
            'Salsa',
            'Cuarteto',
            'Electrónica',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
        { 
          id: 'tanda_3', 
          label: 'Tanda 3 - ¿Qué música te gustaría?', 
          tipo: 'buttons', 
          requerido: true,
          opciones: [
            'Cumbia',
            'Reggaeton',
            'Pop de los 2000s',
            'Pop actual',
            'Rock nacional',
            'Música latina',
            'Bachata',
            'Salsa',
            'Cuarteto',
            'Electrónica',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
        { 
          id: 'tanda_4', 
          label: 'Tanda 4 - ¿Qué música te gustaría?', 
          tipo: 'buttons', 
          requerido: true,
          opciones: [
            'Cumbia',
            'Reggaeton',
            'Pop de los 2000s',
            'Pop actual',
            'Rock nacional',
            'Música latina',
            'Bachata',
            'Salsa',
            'Cuarteto',
            'Electrónica',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
      ],
    },
  ],
  Casamiento: [
    {
      id: 1,
      titulo: '💍 Sobre tu Casamiento',
      descripcion: 'Cuéntanos el estilo de tu celebración',
      preguntas: [
        { 
          id: 'estilo_casamiento', 
          label: '¿Qué estilo tiene tu casamiento?', 
          tipo: 'select', 
          opciones: ['Ceremonial (tradicional y formal)', 'Formal y Elegante (sofisticado)', 'Descontracturado (relajado y divertido)'], 
          requerido: true 
        },
      ],
    },
    {
      id: 2,
      titulo: '🎵 La Música',
      descripcion: 'Ayúdanos a elegir la música perfecta para tu evento',
      preguntas: [
        { 
          id: 'musica_recepcion', 
          label: '¿Qué tipo de música te gustaría durante la recepción?', 
          tipo: 'buttons', 
          requerido: true,
          opciones: [
            'Música Chill',
            'Acústicos',
            'Bossa N Nova',
            'Rock Nacional',
            'Pop Funcional',
            'Deep House',
            'Música Comercial',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
        { 
          id: 'artistas_favoritos', 
          label: '¿Tienes artistas o canciones favoritas? (opcional)', 
          tipo: 'buttons', 
          requerido: false,
          opciones: [
            'Shakira',
            'Maluma',
            'Bad Bunny',
            'J Balvin',
            'Daddy Yankee',
            'Ricky Martin',
            'Luis Fonsi',
            'Enrique Iglesias',
            'Marc Anthony',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
      ],
    },
    {
      id: 3,
      titulo: '🚪 Momentos Especiales',
      descripcion: 'Los momentos más importantes de tu celebración',
      preguntas: [
        { 
          id: 'realizan_ingreso_recepcion', 
          label: '¿Harán un ingreso especial a la recepción?', 
          tipo: 'select', 
          opciones: ['Sí', 'No'], 
          requerido: true 
        },
        { 
          id: 'cancion_ingreso_recepcion', 
          label: '¿Qué canción les gustaría para el ingreso a la recepción?', 
          tipo: 'textarea', 
          requerido: false, 
          condicional: { pregunta: 'realizan_ingreso_recepcion', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
      ],
    },
    {
      id: 4,
      titulo: '💒 Ceremonia',
      descripcion: 'Si realizan la ceremonia en el salón',
      preguntas: [
        { 
          id: 'realizan_ceremonia_salon', 
          label: '¿Realizarán la ceremonia en el salón?', 
          tipo: 'select', 
          opciones: ['Sí', 'No'], 
          requerido: true 
        },
        { 
          id: 'detalles_ceremonia', 
          label: 'Detalles de la ceremonia (opcional)', 
          tipo: 'textarea', 
          requerido: false, 
          condicional: { pregunta: 'realizan_ceremonia_salon', valor: 'Sí' },
          placeholder: 'Cualquier detalle especial que quieras compartir'
        },
        { 
          id: 'cancion_ingreso_novio', 
          label: '¿Qué canción quiere el novio para su ingreso?', 
          tipo: 'textarea', 
          requerido: false, 
          condicional: { pregunta: 'realizan_ceremonia_salon', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
        { 
          id: 'cancion_ingreso_novia', 
          label: '¿Qué canción quiere la novia para su ingreso?', 
          tipo: 'textarea', 
          requerido: false, 
          condicional: { pregunta: 'realizan_ceremonia_salon', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
      ],
    },
    {
      id: 5,
      titulo: '🚪 Ingreso al Salón',
      descripcion: 'El momento de la fiesta',
      preguntas: [
        { 
          id: 'realizan_ingreso_salon', 
          label: '¿Harán un ingreso especial al salón?', 
          tipo: 'buttons', 
          opciones: ['Sí', 'No'], 
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        { 
          id: 'cancion_ingreso_salon', 
          label: '¿Qué canción les gustaría para el ingreso al salón?', 
          tipo: 'textarea', 
          requerido: false, 
          condicional: { pregunta: 'realizan_ingreso_salon', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
      ],
    },
    {
      id: 6,
      titulo: '💃 El Vals',
      descripcion: 'El baile tradicional de los casamientos',
      preguntas: [
        { 
          id: 'bailan_vals', 
          label: '¿Van a bailar el vals?', 
          tipo: 'select', 
          opciones: ['Sí', 'No'], 
          requerido: true 
        },
        { 
          id: 'cancion_vals', 
          label: '¿Qué canción les gustaría para el vals?', 
          tipo: 'textarea', 
          requerido: false, 
          condicional: { pregunta: 'bailan_vals', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
      ],
    },
    {
      id: 7,
      titulo: '🎭 Coreografías',
      descripcion: '¿Tienen alguna presentación especial?',
      preguntas: [
        { 
          id: 'realizan_coreografia', 
          label: '¿Harán alguna coreografía o presentación especial?', 
          tipo: 'select', 
          opciones: ['Sí', 'No'], 
          requerido: true 
        },
        { 
          id: 'detalles_coreografia', 
          label: 'Cuéntennos sobre su coreografía o presentación', 
          tipo: 'textarea', 
          requerido: false, 
          condicional: { pregunta: 'realizan_coreografia', valor: 'Sí' },
          placeholder: 'Describe qué harán y si necesitan alguna canción específica'
        },
      ],
    },
    {
      id: 8,
      titulo: '🌹 Momentos Especiales',
      descripcion: 'Tradiciones del casamiento',
      preguntas: [
        { 
          id: 'cancion_ramo_novia', 
          label: '¿Qué canción quiere la novia para el ramo?', 
          tipo: 'textarea', 
          requerido: true,
          placeholder: 'Nombre de la canción y artista'
        },
        { 
          id: 'cancion_whisky_novio', 
          label: '¿Qué canción quiere el novio para el whisky?', 
          tipo: 'textarea', 
          requerido: true,
          placeholder: 'Nombre de la canción y artista'
        },
      ],
    },
    {
      id: 9,
      titulo: '🎊 Ingreso a Carioca',
      descripcion: 'El momento de la fiesta',
      preguntas: [
        { 
          id: 'realizan_ingreso_carioca', 
          label: '¿Harán un ingreso especial a la carioca (fiesta)?', 
          tipo: 'select', 
          opciones: ['Sí', 'No'], 
          requerido: true 
        },
        { 
          id: 'cancion_ingreso_carioca', 
          label: '¿Qué canción les gustaría para el ingreso a la carioca?', 
          tipo: 'textarea', 
          requerido: false, 
          condicional: { pregunta: 'realizan_ingreso_carioca', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
      ],
    },
    {
      id: 10,
      titulo: '🎶 Música para Bailar',
      descripcion: 'Las tandas de baile son los momentos donde todos bailan',
      preguntas: [
        { 
          id: 'tanda_1', 
          label: 'Tanda 1 - ¿Qué música les gustaría?', 
          tipo: 'buttons', 
          requerido: true,
          opciones: [
            'Cumbia',
            'Reggaeton',
            'Pop de los 2000s',
            'Pop actual',
            'Rock nacional',
            'Música latina',
            'Bachata',
            'Salsa',
            'Cuarteto',
            'Electrónica',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
        { 
          id: 'tanda_2', 
          label: 'Tanda 2 - ¿Qué música les gustaría?', 
          tipo: 'buttons', 
          requerido: true,
          opciones: [
            'Cumbia',
            'Reggaeton',
            'Pop de los 2000s',
            'Pop actual',
            'Rock nacional',
            'Música latina',
            'Bachata',
            'Salsa',
            'Cuarteto',
            'Electrónica',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
        { 
          id: 'tanda_3', 
          label: 'Tanda 3 - ¿Qué música les gustaría?', 
          tipo: 'buttons', 
          requerido: true,
          opciones: [
            'Cumbia',
            'Reggaeton',
            'Pop de los 2000s',
            'Pop actual',
            'Rock nacional',
            'Música latina',
            'Bachata',
            'Salsa',
            'Cuarteto',
            'Electrónica',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
        { 
          id: 'tanda_4', 
          label: 'Tanda 4 - ¿Qué música les gustaría?', 
          tipo: 'buttons', 
          requerido: true,
          opciones: [
            'Cumbia',
            'Reggaeton',
            'Pop de los 2000s',
            'Pop actual',
            'Rock nacional',
            'Música latina',
            'Bachata',
            'Salsa',
            'Cuarteto',
            'Electrónica',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
      ],
    },
  ],
  Corporativo: [
    {
      id: 1,
      titulo: '🏢 Sobre tu Evento',
      descripcion: 'Cuéntanos sobre el tipo de evento',
      preguntas: [
        { 
          id: 'tematica_evento', 
          label: '¿Qué tipo de evento es?', 
          tipo: 'select', 
          opciones: ['Presentación', 'Charla o Conferencia', 'Team Building / Trabajo en Equipo', 'Fiesta o Celebración'], 
          requerido: true 
        },
      ],
    },
    {
      id: 2,
      titulo: '🎨 Identidad Visual',
      descripcion: 'Ayúdanos a personalizar el evento',
      preguntas: [
        { 
          id: 'colores_empresa', 
          label: '¿Cuáles son los colores de tu empresa o marca? (esto nos ayuda a coordinar la iluminación y ambiente)', 
          tipo: 'textarea', 
          requerido: true,
          placeholder: 'Ejemplo: Azul y blanco, rojo y negro, etc.'
        },
      ],
    },
    {
      id: 3,
      titulo: '🎤 Equipamiento',
      descripcion: 'Necesidades técnicas del evento',
      preguntas: [
        { 
          id: 'requieren_escenario', 
          label: '¿Necesitan escenario?', 
          tipo: 'select', 
          opciones: ['Sí', 'No'], 
          requerido: true 
        },
        { 
          id: 'medidas_aproximadas', 
          label: '¿Qué medidas aproximadas necesita el escenario? (opcional)', 
          tipo: 'textarea', 
          requerido: false, 
          condicional: { pregunta: 'requieren_escenario', valor: 'Sí' },
          placeholder: 'Ejemplo: 3m x 2m, o las medidas que necesiten'
        },
        { 
          id: 'contratan_pantalla', 
          label: '¿Contratan pantalla para proyectar?', 
          tipo: 'select', 
          opciones: ['Sí', 'No'], 
          requerido: true 
        },
        { 
          id: 'material_proyectar', 
          label: '¿Qué material van a proyectar? (opcional)', 
          tipo: 'textarea', 
          requerido: false, 
          condicional: { pregunta: 'contratan_pantalla', valor: 'Sí' },
          placeholder: 'Ejemplo: Presentaciones, videos, logos, etc.'
        },
      ],
    },
    {
      id: 4,
      titulo: '🎁 Actividades',
      descripcion: 'Actividades especiales durante el evento',
      preguntas: [
        { 
          id: 'realizan_sorteos', 
          label: '¿Van a realizar sorteos o rifas?', 
          tipo: 'select', 
          opciones: ['Sí', 'No'], 
          requerido: true 
        },
      ],
    },
    {
      id: 5,
      titulo: '🎶 Música para Bailar',
      descripcion: 'Si habrá momentos de baile',
      preguntas: [
        { 
          id: 'hay_tandas_baile', 
          label: '¿Va a haber tandas de baile?', 
          tipo: 'select', 
          opciones: ['Sí', 'No'], 
          requerido: true 
        },
        { 
          id: 'tanda_1', 
          label: 'Tanda 1 - ¿Qué música les gustaría? (opcional)', 
          tipo: 'buttons', 
          requerido: false, 
          condicional: { pregunta: 'hay_tandas_baile', valor: 'Sí' },
          opciones: [
            'Cumbia',
            'Reggaeton',
            'Pop de los 2000s',
            'Pop actual',
            'Rock nacional',
            'Música latina',
            'Bachata',
            'Salsa',
            'Cuarteto',
            'Electrónica',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
        { 
          id: 'tanda_2', 
          label: 'Tanda 2 - ¿Qué música les gustaría? (opcional)', 
          tipo: 'buttons', 
          requerido: false, 
          condicional: { pregunta: 'hay_tandas_baile', valor: 'Sí' },
          opciones: [
            'Cumbia',
            'Reggaeton',
            'Pop de los 2000s',
            'Pop actual',
            'Rock nacional',
            'Música latina',
            'Bachata',
            'Salsa',
            'Cuarteto',
            'Electrónica',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
        { 
          id: 'tanda_3', 
          label: 'Tanda 3 - ¿Qué música les gustaría? (opcional)', 
          tipo: 'buttons', 
          requerido: false, 
          condicional: { pregunta: 'hay_tandas_baile', valor: 'Sí' },
          opciones: [
            'Cumbia',
            'Reggaeton',
            'Pop de los 2000s',
            'Pop actual',
            'Rock nacional',
            'Música latina',
            'Bachata',
            'Salsa',
            'Cuarteto',
            'Electrónica',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
        { 
          id: 'tanda_4', 
          label: 'Tanda 4 - ¿Qué música les gustaría? (opcional)', 
          tipo: 'buttons', 
          requerido: false, 
          condicional: { pregunta: 'hay_tandas_baile', valor: 'Sí' },
          opciones: [
            'Cumbia',
            'Reggaeton',
            'Pop de los 2000s',
            'Pop actual',
            'Rock nacional',
            'Música latina',
            'Bachata',
            'Salsa',
            'Cuarteto',
            'Electrónica',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
      ],
    },
  ],
  Cumpleaños: [
    {
      id: 1,
      titulo: '🎂 Sobre tu Cumpleaños',
      descripcion: 'Cuéntanos cómo quieres celebrar',
      preguntas: [
        { 
          id: 'tematica_evento', 
          label: '¿Qué estilo tiene tu cumpleaños?', 
          tipo: 'select', 
          opciones: ['Formal (elegante y sofisticado)', 'Descontracturado (relajado y divertido)', 'Temático (con una temática específica)'], 
          requerido: true 
        },
      ],
    },
    {
      id: 2,
      titulo: '🎵 La Música',
      descripcion: 'Ayúdanos a elegir la música perfecta',
      preguntas: [
        { 
          id: 'musica_recepcion', 
          label: '¿Qué tipo de música te gustaría durante la recepción?', 
          tipo: 'buttons', 
          requerido: true,
          opciones: [
            'Música Chill',
            'Acústicos',
            'Bossa N Nova',
            'Rock Nacional',
            'Pop Funcional',
            'Deep House',
            'Música Comercial',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
        { 
          id: 'artistas_favoritos', 
          label: '¿Tienes artistas o canciones favoritas? (opcional)', 
          tipo: 'textarea', 
          requerido: false,
          placeholder: 'Menciona artistas o canciones que no pueden faltar'
        },
      ],
    },
    {
      id: 3,
      titulo: '🚪 Ingreso al Salón',
      descripcion: 'Tu momento especial',
      preguntas: [
        { 
          id: 'realiza_ingreso_salon', 
          label: '¿Realizas ingreso al salón?', 
          tipo: 'buttons', 
          opciones: ['Sí', 'No'], 
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        { 
          id: 'cancion_ingreso_salon', 
          label: 'Canción de ingreso:', 
          tipo: 'textarea', 
          requerido: false,
          condicional: { pregunta: 'realiza_ingreso_salon', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
      ],
    },
    {
      id: 4,
      titulo: '🥂 Brindis',
      descripcion: 'El momento del brindis',
      preguntas: [
        { 
          id: 'cancion_brindis', 
          label: '¿Qué canción te gustaría para el brindis?', 
          tipo: 'textarea', 
          requerido: true,
          placeholder: 'Nombre de la canción y artista'
        },
      ],
    },
    {
      id: 5,
      titulo: '🎭 Coreografías',
      descripcion: '¿Tienes alguna presentación especial?',
      preguntas: [
        { 
          id: 'realiza_coreografia', 
          label: '¿Harás alguna coreografía o presentación especial?', 
          tipo: 'select', 
          opciones: ['Sí', 'No'], 
          requerido: true 
        },
        { 
          id: 'descripcion_coreografia', 
          label: 'Cuéntanos sobre tu coreografía o presentación', 
          tipo: 'textarea', 
          requerido: false, 
          condicional: { pregunta: 'realiza_coreografia', valor: 'Sí' },
          placeholder: 'Describe qué harás y si necesitas alguna canción específica'
        },
      ],
    },
    {
      id: 6,
      titulo: '🎶 Música para Bailar',
      descripcion: 'Las tandas de baile son los momentos donde todos bailan',
      preguntas: [
        { 
          id: 'tanda_1', 
          label: 'Tanda 1 - ¿Qué música te gustaría?', 
          tipo: 'buttons', 
          requerido: true,
          opciones: [
            'Cumbia',
            'Reggaeton',
            'Pop de los 2000s',
            'Pop actual',
            'Rock nacional',
            'Música latina',
            'Bachata',
            'Salsa',
            'Cuarteto',
            'Electrónica',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
        { 
          id: 'tanda_2', 
          label: 'Tanda 2 - ¿Qué música te gustaría?', 
          tipo: 'buttons', 
          requerido: true,
          opciones: [
            'Cumbia',
            'Reggaeton',
            'Pop de los 2000s',
            'Pop actual',
            'Rock nacional',
            'Música latina',
            'Bachata',
            'Salsa',
            'Cuarteto',
            'Electrónica',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
        { 
          id: 'tanda_3', 
          label: 'Tanda 3 - ¿Qué música te gustaría?', 
          tipo: 'buttons', 
          requerido: true,
          opciones: [
            'Cumbia',
            'Reggaeton',
            'Pop de los 2000s',
            'Pop actual',
            'Rock nacional',
            'Música latina',
            'Bachata',
            'Salsa',
            'Cuarteto',
            'Electrónica',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
        { 
          id: 'tanda_4', 
          label: 'Tanda 4 - ¿Qué música te gustaría?', 
          tipo: 'buttons', 
          requerido: true,
          opciones: [
            'Cumbia',
            'Reggaeton',
            'Pop de los 2000s',
            'Pop actual',
            'Rock nacional',
            'Música latina',
            'Bachata',
            'Salsa',
            'Cuarteto',
            'Electrónica',
            'Otro (especificar)'
          ],
          multiple: true,
          permiteOtro: true
        },
      ],
    },
  ],
};


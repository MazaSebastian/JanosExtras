// Flujos simplificados y amigables para clientes en pre-coordinación
// Estos flujos están diseñados para ser más intuitivos y menos técnicos que los flujos de DJs

export const CLIENTE_FLUJOS_POR_TIPO = {
  XV: [
    {
      id: 4,
      titulo: '🚪 Ingreso al Salón',
      descripcion: 'Esta es la canción que sonará cuando hagas tu ingreso oficial al salón. ¡Elegí un tema que te represente y genere gran impacto!',
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
          label: '¿Con qué canción realizarás tu ingreso al salón?',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'realiza_ingreso_salon', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista',
          sugerencias: [
            { titulo: "Ingresos XV - Jano's Costanera", url: 'https://open.spotify.com/playlist/695pH6i5BOAhE1mF9yje2r?si=d1CXdpSsTT2EZSkHjmqrCg' }
          ]
        },
      ],
    },
    {
      id: 5,
      titulo: '💃 El Vals',
      descripcion: 'El baile tradicional de los XV',
      preguntas: [
        {
          id: 'baila_vals',
          label: '¿Vas a bailar el vals?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'cancion_vals',
          label: '¿Qué canción te gustaría para el vals? (puedes mencionar más de una si quieres)',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'baila_vals', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista',
          sugerencias: [
            { titulo: "Vals XV (Inglés) - Jano's Costanera", url: 'https://open.spotify.com/playlist/0mznIiPlc7F6kpafg2Nc7C?si=qSOAylsqSiuygdeJ2m4U9Q' },
            { titulo: "Vals XV (Español) - Jano's Costanera", url: 'https://open.spotify.com/playlist/2YN5WoQ0S1gTtxmbF2gTcx?si=chqRPdPATBWMFJpC0beuAQ' },
            { titulo: "Vals XV (Disney) - Jano's Costanera", url: 'https://open.spotify.com/playlist/05JOvsVPL93X3RGLpRgZX0?si=71GWp2aDQwG4PqroHbUaKw' },
            { titulo: "Vals XV (Instrumentales) - Jano's Costanera", url: 'https://open.spotify.com/playlist/2hrnI3wKn3dEBuJJGjYOnd?si=8e2eNNXsTtm-Z_WooNf7NQ' }
          ]
        },
      ],
    },
    {
      id: 6,
      titulo: '🕯️ Ceremonia de Velas',
      descripcion: 'Un momento muy emotivo donde honras a personas especiales',
      preguntas: [
        {
          id: 'ceremonia_velas',
          label: '¿Harás ceremonia de velas?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'velas',
          label: 'Velas',
          tipo: 'velas',
          requerido: true,
          condicional: { pregunta: 'ceremonia_velas', valor: 'Sí' },
          ayuda: 'Agrega cada vela que quieras incluir. Para cada una, indica a quién está dedicada y qué canción quieres'
        },
      ],
    },
    {
      id: 7,
      titulo: '🎭 Coreografías y Presentaciones',
      descripcion: '¿Tienes alguna presentación especial planificada?',
      preguntas: [
        {
          id: 'realiza_coreografia',
          label: '¿Harás alguna coreografía o presentación especial?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'descripcion_coreografia',
          label: 'Cuéntanos sobre tu coreografía o presentación',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'realiza_coreografia', valor: 'Sí' },
          placeholder: 'Describe qué harás, con quién, y si necesitas alguna canción específica'
        },
      ],
    },
    {
      id: 8,
      titulo: '🥂 Brindis',
      descripcion: 'El momento del brindis',
      preguntas: [
        {
          id: 'cancion_brindis',
          label: '¿Qué canción te gustaría para el brindis?',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'Nombre de la canción y artista',
          sugerencias: [
            { titulo: "Sugerencias Brindis - Jano's Costanera", url: 'https://open.spotify.com/playlist/50DNFEtKXdBoaWHTCLMfwh?si=dLP9tUK0RF2fSZPS83blsg' }
          ]
        },
      ],
    },
    {
      id: 9,
      titulo: '🎊 Ingreso a Carioca',
      descripcion: 'El momento de la fiesta',
      preguntas: [
        {
          id: 'realiza_ingreso_carioca',
          label: '¿Harás un ingreso especial a la carioca (fiesta)?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'cancion_ingreso_carioca',
          label: '¿Qué canción te gustaría para tu ingreso a la carioca?',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'realiza_ingreso_carioca', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista',
          sugerencias: [
            { titulo: "Ingresos Carioca - Jano's Costanera", url: 'https://open.spotify.com/playlist/5UYBsUbn8ZANdDWqWT0bfe?si=AneXW3pIRs6G9sktvO6aFg' }
          ]
        },
      ],
    },
    {
      id: 99,
      titulo: '🎧 Link de playlist',
      descripcion: 'Te invitamos a armar y compartirnos el link de tu playlist de Spotify, Apple Music o YouTube con las canciones que más te gusten. Tené en cuenta que esta playlist servirá como referencia de tus gustos musicales; las canciones no deben seguir ningún orden en particular, simplemente compartinos los temas que te encantan para que nosotros (DJs) tengamos un espectro mucho más amplio de tus gustos y podamos hacer brillar tu noche.',
      preguntas: [
        {
          id: 'link_playlist',
          label: 'Pegá el link de tu playlist acá:',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'https://open.spotify.com/playlist/...'
        },
      ],
    },
  ],
  Casamiento: [
    {
      id: 1,
      titulo: '💒 Ceremonia en el Salón',
      descripcion: 'Si realizan la ceremonia en el salón, coordinemos las canciones clave para ese momento mágico.',
      preguntas: [
        {
          id: 'realizan_ceremonia_salon',
          label: '¿Realizarán la ceremonia en el salón?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'detalles_ceremonia',
          label: 'Detalles de la ceremonia (opcional)',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'realizan_ceremonia_salon', valor: 'Sí' },
          placeholder: 'Cualquier detalle especial que quieran compartir'
        },
        {
          id: 'cancion_ingreso_novio',
          label: '¿Qué canción quiere el novio para su ingreso?',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'realizan_ceremonia_salon', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
        {
          id: 'cancion_ingreso_novia',
          label: '¿Qué canción quiere la novia para su ingreso?',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'realizan_ceremonia_salon', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
      ],
    },
    {
      id: 2,
      titulo: '🚪 Ingreso al Salón',
      descripcion: 'Esta es la canción que sonará cuando hagan su ingreso oficial al salón como pareja. ¡Elegí un tema lleno de energía!',
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
          requerido: true,
          condicional: { pregunta: 'realizan_ingreso_salon', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista',
          sugerencias: [
            { titulo: "Ingresos - Jano's Costanera", url: 'https://open.spotify.com/playlist/695pH6i5BOAhE1mF9yje2r?si=d1CXdpSsTT2EZSkHjmqrCg' }
          ]
        },
      ],
    },
    {
      id: 3,
      titulo: '💃 El Vals',
      descripcion: 'El baile tradicional de los casamientos. Un clásico inolvidable.',
      preguntas: [
        {
          id: 'bailan_vals',
          label: '¿Van a bailar el vals?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'cancion_vals',
          label: '¿Qué canción les gustaría para el vals?',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'bailan_vals', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista',
          sugerencias: [
            { titulo: "Vals (Inglés) - Jano's Costanera", url: 'https://open.spotify.com/playlist/0mznIiPlc7F6kpafg2Nc7C?si=qSOAylsqSiuygdeJ2m4U9Q' },
            { titulo: "Vals (Español) - Jano's Costanera", url: 'https://open.spotify.com/playlist/2YN5WoQ0S1gTtxmbF2gTcx?si=chqRPdPATBWMFJpC0beuAQ' }
          ]
        },
      ],
    },
    {
      id: 4,
      titulo: '🎭 Coreografías o Presentaciones',
      descripcion: '¿Tienen preparada alguna coreografía o baile especial con amigos o familiares?',
      preguntas: [
        {
          id: 'realizan_coreografia',
          label: '¿Harán alguna coreografía o presentación especial?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'detalles_coreografia',
          label: 'Cuéntennos sobre su coreografía o presentación',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'realizan_coreografia', valor: 'Sí' },
          placeholder: 'Describe qué harán y si necesitas alguna canción específica'
        },
      ],
    },
    {
      id: 5,
      titulo: '🌹 Ramo y Whisky',
      descripcion: 'Tradiciones clásicas para animar a los invitados.',
      preguntas: [
        {
          id: 'arroja_ramo',
          label: '¿La novia va a arrojar el ramo?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'cancion_ramo_novia',
          label: '¿Qué canción quiere la novia para el lanzamiento del ramo?',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'arroja_ramo', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
        {
          id: 'arroja_whisky',
          label: '¿El novio va a arrojar el whisky?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'cancion_whisky_novio',
          label: '¿Qué canción quiere el novio para el juego del whisky?',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'arroja_whisky', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
      ],
    },
    {
      id: 6,
      titulo: '🥂 Brindis',
      descripcion: 'El momento del brindis y festejo con copas al alza.',
      preguntas: [
        {
          id: 'cancion_brindis',
          label: '¿Qué canción les gustaría para el brindis?',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'Nombre de la canción y artista',
          sugerencias: [
            { titulo: "Sugerencias Brindis - Jano's Costanera", url: 'https://open.spotify.com/playlist/50DNFEtKXdBoaWHTCLMfwh?si=dLP9tUK0RF2fSZPS83blsg' }
          ]
        },
      ],
    },
    {
      id: 7,
      titulo: '🎊 Ingreso a Carioca',
      descripcion: 'El gran inicio de la tanda carioca o tanda de cotillón.',
      preguntas: [
        {
          id: 'realizan_ingreso_carioca',
          label: '¿Harán un ingreso especial a la carioca (fiesta)?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'cancion_ingreso_carioca',
          label: '¿Qué canción les gustaría para el ingreso a la carioca?',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'realizan_ingreso_carioca', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista',
          sugerencias: [
            { titulo: "Ingresos Carioca - Jano's Costanera", url: 'https://open.spotify.com/playlist/5UYBsUbn8ZANdDWqWT0bfe?si=AneXW3pIRs6G9sktvO6aFg' }
          ]
        },
      ],
    },
    {
      id: 99,
      titulo: '🎧 Link de playlist',
      descripcion: 'Te invitamos a armar y compartirnos el link de tu playlist de Spotify, Apple Music o YouTube con las canciones que más te gusten. Tené en cuenta que esta playlist servirá como referencia de tus gustos musicales; las canciones no deben seguir ningún orden en particular, simplemente compartinos los temas que te encantan para que nosotros (DJs) tengamos un espectro mucho más amplio de tus gustos y podamos hacer brillar tu noche.',
      preguntas: [
        {
          id: 'link_playlist',
          label: 'Pegá el link de tu playlist acá:',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'https://open.spotify.com/playlist/...'
        },
      ],
    },
  ],
  Corporativo: [
    {
      id: 1,
      titulo: '🏢 Sobre tu Evento',
      descripcion: 'Cuéntanos sobre el tipo de evento y la temática del mismo.',
      preguntas: [
        {
          id: 'tematica_evento',
          label: '¿Qué tipo de evento es?',
          tipo: 'buttons',
          opciones: ['Presentación', 'Charla o Conferencia', 'Team Building / Trabajo en Equipo', 'Fiesta o Celebración'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
      ],
    },
    {
      id: 2,
      titulo: '🎨 Identidad Visual',
      descripcion: 'Ayúdanos a personalizar la iluminación del salón con los colores de tu empresa.',
      preguntas: [
        {
          id: 'colores_empresa',
          label: '¿Cuáles son los colores de tu empresa o marca?',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'Ejemplo: Azul y blanco, rojo y negro, etc.'
        },
      ],
    },
    {
      id: 4,
      titulo: '🎤 Escenario y Proyecciones',
      descripcion: 'Necesidades técnicas de equipamiento y proyección.',
      preguntas: [
        {
          id: 'requieren_escenario',
          label: '¿Necesitan escenario?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'medidas_aproximadas',
          label: '¿Qué medidas aproximadas necesita el escenario? (opcional)',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'requieren_escenario', valor: 'Sí' },
          placeholder: 'Ejemplo: 3m x 2m'
        },
        {
          id: 'contratan_pantalla',
          label: '¿Contratan pantalla para proyectar?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
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
      id: 5,
      titulo: '🎁 Actividades Especiales',
      descripcion: 'Actividades programadas durante el transcurso del evento.',
      preguntas: [
        {
          id: 'realizan_sorteos',
          label: '¿Van a realizar sorteos o rifas?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
      ],
    },
    {
      id: 6,
      titulo: '🎵 Música del Evento',
      descripcion: 'Selecciona los estilos y preferencias musicales para ambientar.',
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
          id: 'estilo_musical',
          label: '¿Qué estilo musical prefieres para el evento?',
          tipo: 'buttons',
          opciones: [
            'Estilo Chill',
            'Estilo Acústico',
            'Estilo Corporativo',
            'Estilo Funcional',
            'Estilo Comercial'
          ],
          requerido: true,
          multiple: true,
          permiteOtro: false
        },
      ],
    },
    {
      id: 7,
      titulo: '🎶 Música para Bailar',
      descripcion: 'Contanos si habrá momentos de pista de baile y qué estilos les gustarían.',
      preguntas: [
        {
          id: 'hay_tandas_baile',
          label: '¿Va a haber tandas de baile?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
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
    {
      id: 99,
      titulo: '🎧 Link de playlist',
      descripcion: 'Te invitamos a armar y compartirnos el link de tu playlist de Spotify, Apple Music o YouTube con las canciones que más te gusten. Tené en cuenta que esta playlist servirá como referencia de tus gustos musicales; las canciones no deben seguir ningún orden en particular, simplemente compartinos los temas que te encantan para que nosotros (DJs) tengamos un espectro mucho más amplio de tus gustos y podamos hacer brillar tu noche.',
      preguntas: [
        {
          id: 'link_playlist',
          label: 'Pegá el link de tu playlist acá:',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'https://open.spotify.com/playlist/...'
        },
      ],
    },
  ],
  Religioso: [
    {
      id: 1,
      titulo: '🕍 Clasificación y Perfil del Evento',
      descripcion: 'Para comenzar, contanos qué tipo de celebración religiosa realizarán y qué perfil o tradición tendrá la fiesta.',
      preguntas: [
        {
          id: 'subtipo_religioso',
          label: '¿Qué tipo de celebración religiosa es?',
          tipo: 'buttons',
          opciones: ['Bar / Bat Mitzvah', 'Boda Religiosa / Jupá'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'tipo_perfil',
          label: '¿Qué perfil o nivel de tradición tendrá el evento?',
          tipo: 'buttons',
          opciones: ['Tradicional / Laico', 'Ortodoxo'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
      ],
    },
    {
      id: 2,
      titulo: '📜 Protocolo y Técnica de Salón',
      descripcion: 'Condiciones de montaje, pautas de música y técnica de iluminación para coordinar con el salón y el DJ.',
      preguntas: [
        {
          id: 'utilizan_mejitzah',
          label: '¿Utilizarán Mejitzah (separación física para el baile o salón)?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: false,
          condicional: { pregunta: 'tipo_perfil', valor: 'Ortodoxo' },
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'alcance_mejitzah',
          label: '¿En qué momentos se utilizará la Mejitzah?',
          tipo: 'buttons',
          opciones: [
            'Permanente (toda la fiesta)',
            'Solo en momentos de baile / tandas tradicionales',
            'Solo en la ceremonia'
          ],
          requerido: false,
          condicional: { pregunta: 'utilizan_mejitzah', valor: 'Sí' },
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'detalles_mejitzah',
          label: 'Detalles de montaje o distribución de pista y mesas para la Mejitzah:',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'utilizan_mejitzah', valor: 'Sí' },
          placeholder: 'Aclaraciones sobre biombos, telas, división de pista o ubicación de mesas'
        },
        {
          id: 'aplica_kol_isha',
          label: '¿Aplica la regla de Kol Isha (sin voces femeninas solistas en presencia masculina)?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: false,
          condicional: { pregunta: 'tipo_perfil', valor: 'Ortodoxo' },
          multiple: false,
          permiteOtro: false,
          ayuda: 'Si es Sí, el DJ solo reproducirá voces masculinas o instrumentales en presencia de público masculino, y la animación/conducción al micrófono será realizada por personal masculino.'
        },
        {
          id: 'preferencia_iluminacion',
          label: 'Preferencia de iluminación para tandas de baile y salón:',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'tipo_perfil', valor: 'Ortodoxo' },
          placeholder: 'Indicá si solicitan mantener el salón iluminado con mucha luz durante las tandas de baile, o detalles para el operador técnico.'
        },
        {
          id: 'audio_ceremonia_oficiantes',
          label: 'Audio en Ceremonia & Microfonía (Rabino / Jazán / Coro):',
          tipo: 'buttons',
          opciones: [
            'Solo Rabino / Oficiante',
            'Rabino + Jazán (cantor litúrgico)',
            'Coro / Músicos en vivo',
            'No aplica / Sin ceremonia'
          ],
          requerido: false,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'detalles_microfonia_ceremonia',
          label: 'Detalles técnicos de microfonía y pistas para la ceremonia:',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'audio_ceremonia_oficiantes', valor: 'Rabino + Jazán (cantor litúrgico)' },
          placeholder: 'Indicá si el Jazán trae pistas (pendrive) o canta a capela/con instrumentos, y confirmar requerimientos de micrófonos inalámbricos o corbateros dedicados para el altar.'
        },
      ],
    },
    {
      id: 3,
      titulo: '💍 Ceremonia de Jupá y Entrada de Novios',
      descripcion: 'Detalles de la ceremonia religiosa en el salón y canciones de ingreso.',
      subtipo: 'Boda Religiosa / Jupá',
      preguntas: [
        {
          id: 'realizan_jupa_salon',
          label: '¿Realizan la ceremonia de Jupá en el salón?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: false,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'cancion_ingreso_novio',
          label: 'Canción de ingreso del Novio (con sus padres):',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'realizan_jupa_salon', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista para la entrada del novio'
        },
        {
          id: 'cancion_ingreso_novia',
          label: 'Canción de ingreso de la Novia (con sus madres) / 7 Vueltas (Hakafot):',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'realizan_jupa_salon', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista para la entrada de la novia'
        },
        {
          id: 'canto_im_eshkajej',
          label: '¿Rompen la copa directo o hay canto previo de Im Eshkajej Yerushalayim?',
          tipo: 'buttons',
          opciones: ['Canto previo de Im Eshkajej (solemne)', 'Rompen la copa directo'],
          requerido: false,
          condicional: { pregunta: 'tipo_perfil', valor: 'Ortodoxo' },
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'detalle_im_eshkajej',
          label: 'Detalle o pista para Im Eshkajej (previo a romper la copa):',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'canto_im_eshkajej', valor: 'Canto previo de Im Eshkajej (solemne)' },
          placeholder: 'Indicar versión/pista si la reproduce el DJ o si canta el Jazán a capela. El Mazal Tov festivo se disparará al milisegundo exacto de escuchar el quiebre del vidrio.'
        },
        {
          id: 'cancion_rompimiento_copa',
          label: 'Canción para el Rompimiento de la Copa (Mazal Tov - Festejo inmediato):',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'realizan_jupa_salon', valor: 'Sí' },
          placeholder: 'Canción de explosión festiva inmediata tras romper la copa'
        },
        {
          id: 'baila_vals_novios',
          label: '¿Realizan vals o baile lento de novios?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: false,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'cancion_vals_novios',
          label: 'Canción para el vals o baile de novios:',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'baila_vals_novios', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
      ],
    },
    {
      id: 4,
      titulo: '🕯️ Ceremonia de Velas y Club',
      descripcion: 'Detalles de la ceremonia de velas y pertenencia a instituciones o clubes comunitarios.',
      subtipo: 'Bar / Bat Mitzvah',
      preguntas: [
        {
          id: 'ceremonia_velas',
          label: '¿Realizarán ceremonia de vela guía y encendido de velas?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: false,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'cancion_vela_guia',
          label: 'Canción para la Vela Guía:',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'ceremonia_velas', valor: 'Sí' },
          placeholder: 'Nombre de la canción para abrir el encendido de velas'
        },
        {
          id: 'velas',
          label: 'Velas y Homenajeados',
          tipo: 'velas',
          requerido: false,
          condicional: { pregunta: 'ceremonia_velas', valor: 'Sí' },
          ayuda: 'Agregá cada vela que quieras incluir. Para cada una, indicá a quién está dedicada y qué canción querés que suene'
        },
        {
          id: 'pertenece_club',
          label: '¿El/la agasajado/a pertenece a algún club o institución (ej: Hacoaj, Macabi, CISSAB, Hebraica, etc.)?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: false,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'detalles_club',
          label: 'Detalles del club (cantos, banderas, camisetas):',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'pertenece_club', valor: 'Sí' },
          placeholder: 'Mencioná qué club es y si tienen cantos o momentos especiales para incluir en la animación'
        },
      ],
    },
    {
      id: 5,
      titulo: '🎵 Música de Recepción y Comidas',
      descripcion: 'La música ideal para acompañar la recepción y los momentos de comida. ¡Podés sugerir estilos o artistas!',
      preguntas: [
        {
          id: 'musica_recepcion_comidas',
          label: '¿Qué tipo de música les gustaría para la recepción y momentos de comida?',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'Ejemplo: Klezmer instrumental, Jazz, Acústico, Pop suave, etc.'
        },
        {
          id: 'artistas_favoritos',
          label: 'Artistas o géneros preferidos:',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'Mencioná tus artistas favoritos o temas que no pueden faltar en estos momentos'
        },
      ],
    },
    {
      id: 6,
      titulo: '💃 Pre-dancing',
      descripcion: 'El pre-dancing es un momento lleno de energía al inicio de la celebración. Contanos si lo realizarán y qué música prefieren.',
      preguntas: [
        {
          id: 'realizan_predancing',
          label: '¿Realizan pre-dancing?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'detalles_predancing',
          label: 'Detalles musicales del pre-dancing:',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'realizan_predancing', valor: 'Sí' },
          placeholder: '¿Qué estilos o ritmos prefieren para abrir la fiesta?'
        },
        {
          id: 'ultima_cancion_predancing',
          label: 'Última canción del pre-dancing:',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'realizan_predancing', valor: 'Sí' },
          placeholder: 'Canción con la que cerramos el pre-dancing para dar paso a la comida'
        },
      ],
    },
    {
      id: 7,
      titulo: '🚪 Ingreso al Salón',
      descripcion: 'Detalles y canciones para su gran entrada triunfal al salón.',
      preguntas: [
        {
          id: 'realizan_ingreso_salon',
          label: '¿Realizan ingreso al salón?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'detalle_ingreso_salon',
          label: 'Detalles de la entrada (canción, artista, momentos):',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'realizan_ingreso_salon', valor: 'Sí' },
          placeholder: 'Nombre de la canción y cualquier detalle de coordinación'
        },
      ],
    },
    {
      id: 8,
      titulo: '🤝 Homenajes y Brindis',
      descripcion: 'Momentos dedicados a homenajear a familiares y compartir los deseos de la noche.',
      preguntas: [
        {
          id: 'realizan_homenajes',
          label: '¿Realizarán homenajes especiales?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'detalle_homenajes',
          label: 'Detalles de los homenajes y canciones elegidas:',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'realizan_homenajes', valor: 'Sí' },
          placeholder: 'Contanos brevemente quiénes reciben el homenaje y qué temas musicales acompañarán'
        },
        {
          id: 'cancion_brindis',
          label: '¿Qué canción les gustaría para el brindis?',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'Nombre de la canción y artista',
          sugerencias: [
            { titulo: "Sugerencias Brindis - Jano's Costanera", url: 'https://open.spotify.com/playlist/50DNFEtKXdBoaWHTCLMfwh?si=dLP9tUK0RF2fSZPS83blsg' }
          ]
        },
      ],
    },
    {
      id: 9,
      titulo: '🎊 Entrada en Carioca',
      descripcion: 'El momento del cotillón y fiesta final.',
      subtipo: 'Bar / Bat Mitzvah',
      preguntas: [
        {
          id: 'realizan_ingreso_carioca',
          label: '¿Realizan ingreso especial en carioca (cotillón)?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'detalle_ingreso_carioca',
          label: 'Canción y detalles del ingreso a carioca:',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'realizan_ingreso_carioca', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
      ],
    },
    {
      id: 10,
      titulo: '🎶 Tandas de Baile',
      descripcion: 'Estructuración y diseño musical de las 4 tandas de baile del evento (incluyendo Tanda Tradicional / Rikudim, Cachengue, Pop, Retro, etc.).',
      preguntas: [
        {
          id: 'tanda_1',
          label: 'Tanda 1 (ej: Tanda Tradicional / Rikudim / Cachengue de apertura):',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'Detalles musicales, ritmos, artistas o momentos especiales para la primera tanda'
        },
        {
          id: 'tanda_2',
          label: 'Tanda 2:',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'Géneros, estilos y temas sugeridos'
        },
        {
          id: 'tanda_3',
          label: 'Tanda 3:',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'Géneros, estilos y temas sugeridos'
        },
        {
          id: 'tanda_4',
          label: 'Tanda 4 (Cierre / Final de fiesta):',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'Géneros, estilos y temas sugeridos para el cierre'
        },
      ],
    },
    {
      id: 99,
      titulo: '🎧 Link de Playlist',
      descripcion: 'Te invitamos a armar y compartirnos el link de tu playlist de Spotify, Apple Music o YouTube con las canciones que más te gusten. Tené en cuenta que esta playlist servirá como referencia de tus gustos musicales para que el DJ arme una noche inolvidable.',
      preguntas: [
        {
          id: 'link_playlist',
          label: 'Pegá el link de tu playlist acá:',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'https://open.spotify.com/playlist/...'
        },
      ],
    },
  ],
  Casamiento: [
    {
      id: 3,
      titulo: '⛪ Ceremonia',
      descripcion: 'Si realizás la ceremonia en el salón, podés elegir las canciones para cada momento especial.',
      preguntas: [
        {
          id: 'realiza_ceremonia_salon',
          label: '¿Realizás la ceremonia en el salón?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'detalles_ceremonia',
          label: 'Detalles de la ceremonia',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'realiza_ceremonia_salon', valor: 'Sí' },
          placeholder: 'Indicá lecturas, rituales o cualquier detalle organizativo especial...'
        },
        {
          id: 'cancion_ingreso_novio',
          label: 'Canción de ingreso del novio',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'realiza_ceremonia_salon', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
        {
          id: 'cancion_ingreso_novia',
          label: 'Canción de ingreso de la novia',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'realiza_ceremonia_salon', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        }
      ]
    },
    {
      id: 4,
      titulo: '🚪 Ingreso al Salón',
      descripcion: 'Esta es la canción que sonará cuando hagan su ingreso oficial al salón. ¡Elegí un tema divertido y con ritmo!',
      preguntas: [
        {
          id: 'realiza_ingreso_salon',
          label: '¿Realizás ingreso al salón?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'cancion_ingreso_salon',
          label: '¿Con qué canción ingresarás al salón?',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'realiza_ingreso_salon', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        }
      ]
    },
    {
      id: 5,
      titulo: '💃 El Vals',
      descripcion: 'El baile tradicional de los novios.',
      preguntas: [
        {
          id: 'baila_vals',
          label: '¿Van a bailar el vals?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'cancion_vals',
          label: '¿Qué canción les gustaría para el vals?',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'baila_vals', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        }
      ]
    },
    {
      id: 6,
      titulo: '🎭 Coreografías o Presentaciones',
      descripcion: '¿Tienen alguna coreografía especial o show sorpresa con amigos?',
      preguntas: [
        {
          id: 'realiza_coreografia',
          label: '¿Harán alguna coreografía o presentación especial?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'descripcion_coreografia',
          label: 'Cuéntanos sobre su coreografía o presentación',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'realiza_coreografia', valor: 'Sí' },
          placeholder: 'Describe qué harán y si necesitan alguna canción específica'
        }
      ]
    },
    {
      id: 7,
      titulo: '💐 Ramo y 🥃 Whisky',
      descripcion: 'El momento tradicional donde la novia arroja el ramo y el novio la botella de Whisky.',
      preguntas: [
        {
          id: 'arroja_ramo',
          label: '¿La novia va a arrojar el ramo?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'cancion_ramo_novia',
          label: '¿Con qué canción la novia arrojará el ramo?',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'arroja_ramo', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
        {
          id: 'arroja_whisky',
          label: '¿El novio va a arrojar el Whisky?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'cancion_whisky_novio',
          label: '¿Con qué canción el novio arrojará el Whisky?',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'arroja_whisky', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        }
      ]
    },
    {
      id: 8,
      titulo: '🥂 Brindis',
      descripcion: 'El brindis y momento de la torta de novios.',
      preguntas: [
        {
          id: 'cancion_brindis',
          label: '¿Qué canción les gustaría para el brindis / torta?',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'Nombre de la canción y artista'
        }
      ]
    },
    {
      id: 9,
      titulo: '🎊 Ingreso a Carioca',
      descripcion: 'El gran inicio del baile de carioca o cotillón.',
      preguntas: [
        {
          id: 'realiza_ingreso_carioca',
          label: '¿Realizan ingreso a carioca?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'cancion_ingreso_carioca',
          label: '¿Qué canción les gustaría para su ingreso al carioca?',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'realiza_ingreso_carioca', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        }
      ]
    },
    {
      id: 99,
      titulo: '🎧 Link de playlist',
      descripcion: 'Te invitamos a armar y compartirnos el link de tu playlist de Spotify, Apple Music o YouTube con las canciones que más te gusten. Tené en cuenta que esta playlist servirá como referencia de tus gustos musicales; las canciones no deben seguir ningún orden en particular, simplemente compartinos los temas que te encantan para que nosotros (DJs) tengamos un espectro mucho más amplio de tus gustos y podamos hacer brillar tu noche.',
      preguntas: [
        {
          id: 'link_playlist',
          label: 'Pegá el link de tu playlist acá:',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'https://open.spotify.com/playlist/...'
        }
      ]
    }
  ],
  Cumpleaños: [
    {
      id: 1,
      titulo: '🎂 Temática del Evento',
      descripcion: 'Cuéntanos cómo quieres celebrar y qué temática o estilo tendrá tu fiesta.',
      preguntas: [
        {
          id: 'tematica_evento',
          label: '¿Qué estilo tiene tu cumpleaños?',
          tipo: 'buttons',
          opciones: ['Formal (elegante y sofisticado)', 'Descontracturado (relajado y divertido)', 'Temático (con una temática específica)'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'descripcion_tematica',
          label: 'Descripción de la temática',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'tematica_evento', valor: 'Temático (con una temática específica)' },
          placeholder: 'Cuéntanos cuál es la temática de la fiesta...'
        }
      ],
    },
    {
      id: 2,
      titulo: '🚪 Ingreso al Salón',
      descripcion: 'Esta es la canción que sonará cuando hagas tu ingreso oficial al salón. ¡Elegí un tema divertido y con ritmo!',
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
          label: '¿Con qué canción ingresarás al salón?',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'realiza_ingreso_salon', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista'
        },
      ],
    },
    {
      id: 3,
      titulo: '🎭 Coreografías o Presentaciones',
      descripcion: '¿Tienes alguna coreografía especial o show sorpresa con amigos?',
      preguntas: [
        {
          id: 'realiza_coreografia',
          label: '¿Harás alguna coreografía o presentación especial?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'descripcion_coreografia',
          label: 'Cuéntanos sobre tu coreografía o presentación',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'realiza_coreografia', valor: 'Sí' },
          placeholder: 'Describe qué harás y si necesitas alguna canción específica'
        },
      ],
    },
    {
      id: 4,
      titulo: '🥂 Brindis',
      descripcion: 'El brindis y momento de la torta de cumpleaños.',
      preguntas: [
        {
          id: 'cancion_brindis',
          label: '¿Qué canción te gustaría para el brindis / torta?',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'Nombre de la canción y artista',
          sugerencias: [
            { titulo: "Sugerencias Brindis - Jano's Costanera", url: 'https://open.spotify.com/playlist/50DNFEtKXdBoaWHTCLMfwh?si=dLP9tUK0RF2fSZPS83blsg' }
          ]
        },
      ],
    },
    {
      id: 5,
      titulo: '🎊 Ingreso a Carioca',
      descripcion: 'El gran inicio del baile de carioca o cotillón.',
      preguntas: [
        {
          id: 'realiza_ingreso_carioca',
          label: '¿Realizas ingreso a carioca?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'cancion_ingreso_carioca',
          label: '¿Qué canción te gustaría para tu ingreso al carioca?',
          tipo: 'textarea',
          requerido: true,
          condicional: { pregunta: 'realiza_ingreso_carioca', valor: 'Sí' },
          placeholder: 'Nombre de la canción y artista',
          sugerencias: [
            { titulo: "Ingresos Carioca - Jano's Costanera", url: 'https://open.spotify.com/playlist/5UYBsUbn8ZANdDWqWT0bfe?si=AneXW3pIRs6G9sktvO6aFg' }
          ]
        },
      ],
    },
    {
      id: 99,
      titulo: '🎧 Link de playlist',
      descripcion: 'Te invitamos a armar y compartirnos el link de tu playlist de Spotify, Apple Music o YouTube con las canciones que más te gusten. Tené en cuenta que esta playlist servirá como referencia de tus gustos musicales; las canciones no deben seguir ningún orden en particular, simplemente compartinos los temas que te encantan para que nosotros (DJs) tengamos un espectro mucho más amplio de tus gustos y podamos hacer brillar tu noche.',
      preguntas: [
        {
          id: 'link_playlist',
          label: 'Pegá el link de tu playlist acá:',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'https://open.spotify.com/playlist/...'
        },
      ],
    },
  ],
};

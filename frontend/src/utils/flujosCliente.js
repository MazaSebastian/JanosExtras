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
          id: 'cancion_ramo_novia',
          label: '¿Qué canción quiere la novia para el lanzamiento del ramo?',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'Nombre de la canción y artista'
        },
        {
          id: 'cancion_whisky_novio',
          label: '¿Qué canción quiere el novio para el juego del whisky?',
          tipo: 'textarea',
          requerido: true,
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
      titulo: '🕍 Mejitzah',
      descripcion: 'Contanos si en la fiesta utilizarán Mejitzah (separación física para el momento del baile tradicional).',
      preguntas: [
        {
          id: 'utilizan_mejitzah',
          label: '¿Utilizarán Mejitzah?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
      ],
    },
    {
      id: 2,
      titulo: '🎵 Música de Recepción y Comidas',
      descripcion: 'La música ideal para acompañar la recepción y los momentos de comida. ¡Podés sugerir estilos o artistas!',
      preguntas: [
        {
          id: 'musica_recepcion_comidas',
          label: '¿Qué tipo de música les gustaría?',
          tipo: 'textarea',
          requerido: true,
          placeholder: 'Ejemplo: Instrumental, Jazz, Klezmer tradicional, Pop suave, etc.'
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
      id: 3,
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
          placeholder: 'Canción con la que cerramos el pre-dancing para dar paso al siguiente momento'
        },
      ],
    },
    {
      id: 4,
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
      id: 5,
      titulo: '🤝 Homenajes',
      descripcion: 'Momentos dedicados a homenajear a personas especiales o familiares.',
      preguntas: [
        {
          id: 'realizan_homenajes',
          label: '¿Realizarán homenajes?',
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
      ],
    },
    {
      id: 6,
      titulo: '🕯️ Ceremonia de Velas / Vela Guía',
      descripcion: 'Ceremonia de encendido de velas para compartir y honrar a sus seres queridos.',
      preguntas: [
        {
          id: 'ceremonia_velas',
          label: '¿Realizarán ceremonia de vela guía o encendido de velas?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'cancion_vela_guia',
          label: 'Canción para la Vela Guía:',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'ceremonia_velas', valor: 'Sí' },
          placeholder: 'Nombre de la canción para abrir el encendido'
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
      id: 7,
      titulo: '🥂 Brindis',
      descripcion: 'El brindis y sus deseos para la celebración.',
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
      id: 8,
      titulo: '🎊 Ingreso a Carioca',
      descripcion: 'El inicio de la gran fiesta carioca o cotillón para bailar.',
      preguntas: [
        {
          id: 'realizan_ingreso_carioca',
          label: '¿Realizan ingreso en carioca?',
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
      id: 9,
      titulo: '🏆 Pertenencia a Club',
      descripcion: 'Contanos si pertenecen a algún club o institución (ej. Hacoaj, Macabi, etc.) para tenerlo en cuenta en la animación.',
      preguntas: [
        {
          id: 'pertenece_club',
          label: '¿Pertenece a un club?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'detalles_club',
          label: 'Detalles del club:',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'pertenece_club', valor: 'Sí' },
          placeholder: 'Mencioná qué club y detalles importantes si realizan cantos tradicionales del mismo'
        },
      ],
    },
    {
      id: 10,
      titulo: '🎶 Tanda Sher',
      descripcion: 'La tanda Sher es un baile tradicional judío. Contanos si les gustaría abrir el baile con este momento.',
      preguntas: [
        {
          id: 'abre_tanda_sher',
          label: '¿Abrimos el momento de baile con una tanda Sher?',
          tipo: 'buttons',
          opciones: ['Sí', 'No'],
          requerido: true,
          multiple: false,
          permiteOtro: false
        },
        {
          id: 'detalles_tanda_sher',
          label: 'Detalles de la tanda Sher:',
          tipo: 'textarea',
          requerido: false,
          condicional: { pregunta: 'abre_tanda_sher', valor: 'Sí' },
          placeholder: '¿Desean algún tema tradicional en particular o estilo de aceleración?'
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

import { authenticateToken } from '@/lib/auth';
import { AdicionalTecnica } from '@/lib/models/AdicionalTecnica';
import pdfParse from 'pdf-parse';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Deshabilitar el bodyParser por defecto de Next.js para manejar multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Función para parsear el texto del PDF y extraer información
async function parsePDFText(text, salonesConocidos = []) {
  // Para PDFs de Excel, preservar tabs y múltiples espacios para detectar columnas
  // Primero normalizar saltos de línea
  let normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  
  // Detectar si es formato tabular (tiene muchos tabs o espacios múltiples)
  const hasTabs = text.includes('\t');
  const hasMultipleSpaces = /\s{3,}/.test(text);
  const isTabular = hasTabs || hasMultipleSpaces;
  
  console.log('Formato detectado:', isTabular ? 'Tabular (Excel)' : 'Texto normal');
  console.log('Tiene tabs:', hasTabs, 'Tiene espacios múltiples:', hasMultipleSpaces);
  
  // Si es tabular, procesar de manera diferente
  if (isTabular) {
    // Para formato tabular, dividir por tabs o múltiples espacios
    const columnSeparator = hasTabs ? '\t' : /\s{2,}/;
    normalizedText = normalizedText.replace(/\t+/g, '\t'); // Normalizar tabs múltiples
  } else {
    // Para texto normal, normalizar espacios
    normalizedText = normalizedText
      .replace(/\t+/g, ' ')
      .replace(/ +/g, ' ');
  }
  
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const resultados = [];
  
  console.log('Total de líneas a procesar:', lines.length);
  console.log('Primeras 15 líneas:', lines.slice(0, 15));
  console.log('Salones conocidos para matching:', salonesConocidos.length);
  
  // Mapeo de complementos a categorías
  const complementosMap = {
    chispas: [
      'chispas', 'chispa', 'maquina de chispas', 'máquina de chispas',
      'sparks', 'spark', 'bengalas', 'bengala'
    ],
    humo: [
      'humo', 'smoke', 'niebla', 'humo bajo', 'jet co2', 'jet co 2',
      'co2', 'vapor', 'fog'
    ],
    lasers: [
      'laser', 'lasers', 'láser', 'láseres', 'laser rgb', 'laser vals',
      'show laser', 'rgb'
    ],
    otros: [] // Se llenará con todo lo que no coincida
  };
  
  let currentFecha = null;
  const currentYear = new Date().getFullYear();
  const mesMap = {
    'nov': '11', 'noviembre': '11',
    'dic': '12', 'diciembre': '12',
    'ene': '01', 'enero': '01',
    'feb': '02', 'febrero': '02',
    'mar': '03', 'marzo': '03',
    'abr': '04', 'abril': '04',
    'may': '05', 'mayo': '05',
    'jun': '06', 'junio': '06',
    'jul': '07', 'julio': '07',
    'ago': '08', 'agosto': '08',
    'sep': '09', 'septiembre': '09',
    'oct': '10', 'octubre': '10'
  };
  
  // Detectar fechas en múltiples formatos:
  // - "DD-nov", "DD/nov", "DD nov"
  // - "DD-nov-YYYY", "DD/nov/YYYY"
  // - "noviembre DD", "DD de noviembre"
  const fechaRegexes = [
    /(\d{1,2})[-/ ](nov|noviembre|dic|diciembre|ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|septiembre|oct|octubre)(?:[-/ ](\d{2,4}))?/i,
    /(nov|noviembre|dic|diciembre|ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|septiembre|oct|octubre)[-/ ](\d{1,2})(?:[-/ ](\d{2,4}))?/i,
    /(\d{1,2})[-/ ]de[-/ ](nov|noviembre|dic|diciembre|ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|septiembre|oct|octubre)/i,
  ];
  
  // Estructura para almacenar datos por salón y fecha
  const datosPorSalon = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();
    
    // Buscar fecha en diferentes formatos
    let fechaMatch = null;
    for (const regex of fechaRegexes) {
      fechaMatch = line.match(regex);
      if (fechaMatch) break;
    }
    
    if (fechaMatch) {
      let dia, mesAbrev, year;
      
      // Formato: DD-mes o mes-DD
      if (fechaMatch[1] && mesMap[fechaMatch[1].toLowerCase()]) {
        // Formato: mes-DD
        mesAbrev = fechaMatch[1].toLowerCase();
        dia = fechaMatch[2];
        year = fechaMatch[3] || currentYear;
      } else {
        // Formato: DD-mes
        dia = fechaMatch[1];
        mesAbrev = fechaMatch[2].toLowerCase();
        year = fechaMatch[3] || currentYear;
      }
      
      // Normalizar año (si es 2 dígitos, asumir 20XX)
      if (year && year.length === 2) {
        year = '20' + year;
      } else if (!year) {
        year = currentYear;
      }
      
      const mes = mesMap[mesAbrev] || '11';
      currentFecha = `${year}-${mes}-${dia.padStart(2, '0')}`;
      console.log(`Fecha detectada: ${currentFecha} (de línea: "${line}")`);
      continue;
    }
    
    // Si no hay fecha actual, continuar
    if (!currentFecha) continue;
    
    // Si es formato tabular, dividir la línea en columnas
    const columns = isTabular 
      ? line.split(hasTabs ? '\t' : /\s{2,}/).map(col => col.trim()).filter(col => col)
      : [line];
    
    // Buscar salón en la línea
    // Para PDFs de Excel, el salón puede estar en cualquier columna
    let salonEncontrado = null;
    let mejorCoincidencia = null;
    let mejorScore = 0;
    
    // Buscar salón en todas las columnas
    for (const column of columns) {
      const columnLower = column.toLowerCase().trim();
      
      for (const salon of salonesConocidos) {
        const salonNormalizado = salon.toLowerCase().trim();
        
        // Buscar coincidencia exacta (mayor prioridad)
        const salonRegex = new RegExp(`^${salon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$|^${salon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s|\\s${salon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$|\\s${salon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s`, 'i');
        if (salonRegex.test(column)) {
          salonEncontrado = salon;
          console.log(`Salón encontrado (exacto): ${salon} en línea: "${line}"`);
          break;
        }
        
        // Buscar coincidencia parcial
        if (columnLower.includes(salonNormalizado) || salonNormalizado.includes(columnLower)) {
          const score = Math.min(salonNormalizado.length, columnLower.length) / Math.max(salonNormalizado.length, columnLower.length);
          if (score > mejorScore && score > 0.6) { // Al menos 60% de coincidencia
            mejorScore = score;
            mejorCoincidencia = salon;
          }
        }
      }
      
      if (salonEncontrado) break;
    }
    
    // Si no hay coincidencia exacta pero hay una buena parcial, usarla
    if (!salonEncontrado && mejorCoincidencia) {
      salonEncontrado = mejorCoincidencia;
      console.log(`Salón encontrado (parcial, score: ${mejorScore.toFixed(2)}): ${mejorCoincidencia} en línea: "${line}"`);
    }
    
    if (!salonEncontrado) continue;
    
    // Inicializar estructura para este salón/fecha si no existe
    const key = `${currentFecha}_${salonEncontrado}`;
    if (!datosPorSalon[key]) {
      datosPorSalon[key] = {
        salon: salonEncontrado,
        fecha: currentFecha,
        complementos: []
      };
    }
    
    // Extraer complementos de la línea
    // Para formato tabular, los complementos pueden estar en columnas separadas
    const complementosEncontrados = [];
    
    // Si es tabular, buscar en todas las columnas (excepto la del salón)
    const columnasParaComplementos = isTabular 
      ? columns.filter(col => {
          const colLower = col.toLowerCase();
          // Excluir columnas que son fechas o salones
          return !fechaRegexes.some(regex => regex.test(col)) && 
                 !salonesConocidos.some(s => colLower.includes(s.toLowerCase()));
        })
      : [line];
    
    // Buscar cada tipo de complemento en todas las columnas relevantes
    for (const columna of columnasParaComplementos) {
      const columnaLower = columna.toLowerCase();
      
      for (const [categoria, keywords] of Object.entries(complementosMap)) {
        for (const keyword of keywords) {
          const keywordRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (keywordRegex.test(columnaLower)) {
            // Si la columna completa contiene la keyword, agregarla
            if (!complementosEncontrados.includes(columna.trim())) {
              complementosEncontrados.push(columna.trim());
            }
          }
        }
      }
      
      // Si la columna no es vacía y no es fecha/salón, puede ser un complemento
      if (columna.trim().length > 2 && 
          !fechaRegexes.some(regex => regex.test(columna)) &&
          !salonesConocidos.some(s => columnaLower.includes(s.toLowerCase()))) {
        // Verificar si contiene palabras clave de complementos
        const tieneKeyword = Object.values(complementosMap).flat().some(keyword => 
          columnaLower.includes(keyword.toLowerCase())
        );
        
        if (!tieneKeyword && !complementosEncontrados.includes(columna.trim())) {
          // Puede ser un complemento "otro"
          complementosEncontrados.push(columna.trim());
        }
      }
    }
    
    // Si no encontramos complementos en formato tabular, buscar en toda la línea
    if (complementosEncontrados.length === 0 && !isTabular) {
      // Remover el nombre del salón y la fecha de la línea
      let complementoLine = line;
      
      // Remover fecha si está presente
      for (const regex of fechaRegexes) {
        complementoLine = complementoLine.replace(regex, '').trim();
      }
      
      // Remover el nombre del salón
      for (const salon of salonesConocidos) {
        complementoLine = complementoLine.replace(new RegExp(salon, 'gi'), '').trim();
      }
      
      // Remover palabras comunes que no son complementos
      complementoLine = complementoLine.replace(/\b(salon|salón|complemento|complementos|fecha|date)\b/gi, '').trim();
      
      // Dividir por espacios y buscar palabras que parezcan complementos
      const palabras = complementoLine.split(/\s+/).filter(p => p.length > 2);
      
      // Si hay palabras restantes, agregarlas como complementos
      if (palabras.length > 0) {
        complementosEncontrados.push(...palabras);
      } else if (complementoLine && complementoLine.length > 2) {
        // Si queda algo como un solo string, agregarlo
        complementosEncontrados.push(complementoLine);
      }
    }
    
    // Agregar complementos encontrados
    datosPorSalon[key].complementos.push(...complementosEncontrados);
  }
  
  // Convertir datosPorSalon a resultados finales
  for (const key in datosPorSalon) {
    const item = datosPorSalon[key];
    const adicionales = {
      chispas: false,
      humo: false,
      lasers: false,
      otros: []
    };
    
    // Procesar complementos y categorizarlos
    const complementosUnicos = [...new Set(item.complementos)];
    
    for (const complemento of complementosUnicos) {
      const compLower = complemento.toLowerCase();
      let categorizado = false;
      
      // Verificar chispas
      if (complementosMap.chispas.some(kw => compLower.includes(kw))) {
        adicionales.chispas = true;
        categorizado = true;
      }
      
      // Verificar humo
      if (complementosMap.humo.some(kw => compLower.includes(kw))) {
        adicionales.humo = true;
        categorizado = true;
      }
      
      // Verificar lasers
      if (complementosMap.lasers.some(kw => compLower.includes(kw))) {
        adicionales.lasers = true;
        categorizado = true;
      }
      
      // Si no se categorizó, agregar a "otros"
      if (!categorizado) {
        adicionales.otros.push(complemento);
      }
    }
    
    // Convertir array de "otros" a string si tiene elementos
    if (adicionales.otros.length > 0) {
      adicionales.otros = adicionales.otros.join(', ');
    } else {
      delete adicionales.otros;
    }
    
    // Solo agregar si hay algún adicional
    if (adicionales.chispas || adicionales.humo || adicionales.lasers || adicionales.otros) {
      resultados.push({
        salon: item.salon,
        fecha: item.fecha,
        adicionales: adicionales
      });
    }
  }
  
  return resultados;
}

export default async function handler(req, res) {
  console.log('=== Handler upload-pdf llamado ===');
  console.log('Método:', req.method);
  console.log('URL:', req.url);
  console.log('Headers Content-Type:', req.headers['content-type']);
  
  if (req.method !== 'POST') {
    console.log('❌ Método no permitido:', req.method);
    return res.status(405).json({ 
      error: 'Método no permitido',
      metodo: req.method,
      permitido: 'POST'
    });
  }

  try {
    console.log('Autenticando usuario...');
    const auth = authenticateToken(req);
    if (auth.error) {
      console.log('Error de autenticación:', auth.error);
      return res.status(auth.status).json({ error: auth.error });
    }

    console.log('Usuario autenticado:', auth.user?.nombre, 'Rol:', auth.user?.rol);

    // Solo administradores pueden subir PDFs
    if (auth.user.rol !== 'admin') {
      console.log('Usuario no es administrador');
      return res.status(403).json({ error: 'Solo administradores pueden subir PDFs' });
    }

    console.log('📤 Iniciando parsing del formulario...');
    console.log('Content-Type recibido:', req.headers['content-type']);

    // Verificar que el Content-Type sea multipart
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart')) {
      console.error('❌ Content-Type no es multipart:', req.headers['content-type']);
      return res.status(400).json({ 
        error: 'El request debe ser multipart/form-data',
        contentType: req.headers['content-type']
      });
    }

    // Parsear el formulario multipart usando formidable
    // En Next.js/Vercel, necesitamos usar el stream de la request directamente
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      multiples: false, // Cambiar a false para evitar problemas con arrays
    });

    // Parsear la request
    // En Vercel/Next.js, necesitamos asegurarnos de que req no esté ya consumido
    const [fields, files] = await new Promise((resolve, reject) => {
      // Verificar que req sea un stream válido
      if (!req || typeof req.on !== 'function') {
        console.error('❌ Request no es un stream válido');
        reject(new Error('Request inválido'));
        return;
      }

      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('❌ Error al parsear formulario:', err);
          console.error('Stack:', err.stack);
          reject(err);
        } else {
          console.log('✅ Formulario parseado exitosamente');
          console.log('Fields encontrados:', Object.keys(fields));
          console.log('Files encontrados:', Object.keys(files));
          if (files && Object.keys(files).length > 0) {
            Object.keys(files).forEach(key => {
              const file = Array.isArray(files[key]) ? files[key][0] : files[key];
              console.log(`  - ${key}:`, {
                name: file.originalFilename || file.name,
                size: file.size,
                type: file.mimetype,
                path: file.filepath || file.path
              });
            });
          }
          resolve([fields, files]);
        }
      });
    });
    
    // Buscar el archivo en diferentes posibles nombres de campo
    // formidable v3 devuelve un array o un objeto File dependiendo de la configuración
    let file = null;
    
    if (files.pdf) {
      file = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf;
    } else if (files.file) {
      file = Array.isArray(files.file) ? files.file[0] : files.file;
    } else {
      // Buscar cualquier archivo
      const fileKeys = Object.keys(files);
      if (fileKeys.length > 0) {
        const firstFile = files[fileKeys[0]];
        file = Array.isArray(firstFile) ? firstFile[0] : firstFile;
      }
    }
    
    console.log('📄 Archivo encontrado:', file ? {
      nombre: file.originalFilename || file.name || 'sin nombre',
      tipo: file.mimetype || 'no especificado',
      tamaño: file.size,
      path: file.filepath || file.path
    } : '❌ No encontrado');

    if (!file) {
      console.error('❌ No se encontró ningún archivo en el request');
      console.log('Archivos disponibles:', Object.keys(files || {}));
      return res.status(400).json({ 
        error: 'No se proporcionó ningún archivo PDF',
        camposDisponibles: Object.keys(files || {})
      });
    }

    // Obtener la ruta del archivo
    const filepath = file.filepath || file.path;
    if (!filepath) {
      console.error('❌ No se pudo obtener la ruta del archivo');
      console.log('Estructura del archivo:', JSON.stringify(file, null, 2));
      return res.status(400).json({ 
        error: 'No se pudo obtener la ruta del archivo',
        detalles: 'El archivo no tiene filepath ni path'
      });
    }
    
    console.log('✅ Ruta del archivo obtenida:', filepath);

    // Leer y parsear el PDF
    let pdfBuffer;
    let pdfData;
    let textoPDF;
    
    try {
      pdfBuffer = fs.readFileSync(filepath);
      pdfData = await pdfParse(pdfBuffer);
      textoPDF = pdfData.text || '';
      
      console.log('PDF parseado exitosamente. Longitud del texto:', textoPDF.length);
      console.log('Primeros 500 caracteres del texto:', textoPDF.substring(0, 500));
      
      if (!textoPDF || textoPDF.trim().length === 0) {
        console.error('❌ PDF sin texto extraíble');
        return res.status(400).json({ 
          error: 'El PDF no contiene texto extraíble. Puede ser un PDF escaneado o con formato especial. Por favor, verifica que el PDF contenga texto seleccionable.',
          sugerencia: 'Si el PDF es una imagen escaneada, necesitarás convertirlo a texto primero usando OCR. Si es un PDF generado desde Excel, asegúrate de que el archivo original tenga texto seleccionable.'
        });
      }
      
      console.log('✅ PDF parseado exitosamente');
      console.log('Longitud del texto extraído:', textoPDF.length);
      console.log('Primeros 1000 caracteres:', textoPDF.substring(0, 1000));
    } catch (parseError) {
      console.error('Error al parsear el PDF:', parseError);
      return res.status(400).json({ 
        error: 'Error al leer el archivo PDF. Por favor, verifica que el archivo sea un PDF válido.',
        detalles: parseError.message
      });
    }
    
    // Obtener lista de salones para el parser
    const { Salon } = await import('@/lib/models/Salon');
    const salones = await Salon.findAll();
    const salonesNombres = salones.map(s => s.nombre);
    
    console.log('Salones cargados de la BD:', salonesNombres.length);
    
    // Parsear el texto para extraer información
    let resultados;
    try {
      resultados = await parsePDFText(textoPDF, salonesNombres);
      console.log('Resultados del parser:', resultados.length, 'registros encontrados');
      
      if (resultados.length === 0) {
        // Mostrar una muestra del texto para debugging
        const muestraTexto = textoPDF.substring(0, 2000);
        const lineasTexto = textoPDF.split('\n');
        console.error('❌ No se encontraron resultados en el PDF');
        console.log('Muestra del texto extraído (primeros 2000 caracteres):', muestraTexto);
        console.log('Total de líneas en el texto:', lineasTexto.length);
        console.log('Salones conocidos:', salonesNombres);
        
        return res.status(400).json({ 
          error: 'No se pudo extraer información del PDF. El formato del documento puede ser diferente al esperado.',
          textoExtraido: muestraTexto,
          sugerencia: 'Verifica que el PDF contenga:\n- Fechas en formato "DD-nov", "DD/nov", "noviembre DD", etc.\n- Nombres de salones que coincidan con los salones en la base de datos\n- Información de adicionales técnicos (chispas, humo, lasers, etc.)',
          salonesDisponibles: salonesNombres.slice(0, 10) // Mostrar primeros 10 salones como referencia
        });
      }
    } catch (parseError) {
      console.error('Error en el parser de texto:', parseError);
      return res.status(500).json({ 
        error: 'Error al procesar el contenido del PDF.',
        detalles: parseError.message,
        textoExtraido: textoPDF.substring(0, 500)
      });
    }

    // Los salones ya están cargados arriba, reutilizamos la variable
    
    // Crear mapa de salones con normalización mejorada
    const salonMap = {};
    const salonVariations = {}; // Mapeo de variaciones comunes
    
    salones.forEach(s => {
      const nombreLower = s.nombre.toLowerCase().trim();
      salonMap[nombreLower] = s.id;
      
      // Agregar variaciones comunes
      const variations = [
        nombreLower,
        nombreLower.replace(/\s+/g, ' '), // Normalizar espacios
        nombreLower.replace(/boutique/gi, 'boutique'), // Normalizar boutique
        nombreLower.replace(/\./g, ''), // Sin puntos
      ];
      
      variations.forEach(v => {
        if (v && v !== nombreLower) {
          salonVariations[v] = s.id;
        }
      });
    });
    
    // Función para encontrar salón con normalización mejorada
    const findSalonId = (nombreSalon) => {
      const nombreNormalizado = nombreSalon.toLowerCase().trim();
      
      // Buscar coincidencia exacta
      if (salonMap[nombreNormalizado]) {
        return salonMap[nombreNormalizado];
      }
      
      // Buscar en variaciones
      if (salonVariations[nombreNormalizado]) {
        return salonVariations[nombreNormalizado];
      }
      
      // Buscar coincidencia parcial (para casos como "Dot" vs "DOT")
      for (const [nombre, id] of Object.entries(salonMap)) {
        if (nombre.includes(nombreNormalizado) || nombreNormalizado.includes(nombre)) {
          return id;
        }
      }
      
      return null;
    };

    // Guardar cada resultado en la base de datos
    const guardados = [];
    const errores = [];

    for (const resultado of resultados) {
      try {
        const salonId = findSalonId(resultado.salon);
        if (!salonId) {
          errores.push(`Salón "${resultado.salon}" no encontrado en la base de datos. Salones disponibles: ${salones.map(s => s.nombre).join(', ')}`);
          continue;
        }

        const adicional = await AdicionalTecnica.create({
          salon_id: salonId,
          fecha_evento: resultado.fecha,
          adicionales: resultado.adicionales,
          archivo_pdf_url: null, // Por ahora no guardamos el PDF, solo la info extraída
          creado_por: auth.user.id,
        });

        guardados.push({
          salon: resultado.salon,
          fecha: resultado.fecha,
          adicionales: resultado.adicionales,
        });
      } catch (error) {
        console.error(`Error al guardar adicional para ${resultado.salon} - ${resultado.fecha}:`, error);
        const errorMsg = error.message || 'Error desconocido';
        // Si es un error de constraint único, es porque ya existe
        if (error.message && error.message.includes('unique') || error.message.includes('duplicate')) {
          errores.push(`Ya existe un registro para ${resultado.salon} - ${resultado.fecha}. Se actualizará el existente.`);
        } else {
          errores.push(`Error al guardar ${resultado.salon} - ${resultado.fecha}: ${errorMsg}`);
        }
      }
    }
    
    // Si hay errores pero también guardados, mostrar ambos
    if (errores.length > 0 && guardados.length === 0) {
      return res.status(400).json({
        error: 'No se pudo guardar ningún registro. Verifica los errores.',
        errores: errores,
        sugerencia: 'Verifica que los nombres de los salones en el PDF coincidan con los salones en la base de datos.'
      });
    }

    // Limpiar archivo temporal
    try {
      if (filepath && fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (e) {
      console.error('Error al eliminar archivo temporal:', e);
    }

    return res.status(200).json({
      success: true,
      guardados: guardados.length,
      total: resultados.length,
      datos: guardados,
      errores: errores.length > 0 ? errores : undefined,
      mensaje: guardados.length > 0 
        ? `Se procesaron ${guardados.length} de ${resultados.length} registros exitosamente.`
        : 'No se guardaron registros.'
    });
  } catch (error) {
    console.error('Error al procesar PDF:', error);
    console.error('Stack trace:', error.stack);
    
    // Limpiar archivo temporal en caso de error
    try {
      if (file && (file.filepath || file.path)) {
        const filepath = file.filepath || file.path;
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }
    } catch (e) {
      console.error('Error al eliminar archivo temporal:', e);
    }
    
    return res.status(500).json({ 
      error: 'Error al procesar el PDF. Por favor, verifica el formato del documento.',
      detalles: error.message,
      tipo: error.name
    });
  }
}


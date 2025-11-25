import { authenticateToken } from '@/lib/auth';
import { AdicionalTecnica } from '@/lib/models/AdicionalTecnica';
import pdfParse from 'pdf-parse';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Deshabilitar el bodyParser por defecto de Next.js
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

// Función para parsear el texto del PDF y extraer información
async function parsePDFText(text, salonesConocidos = []) {
  // Normalizar el texto: reemplazar múltiples espacios/tabs por un solo espacio
  // Esto ayuda con PDFs generados desde Excel que tienen formato tabular
  const normalizedText = text
    .replace(/\t+/g, ' ')  // Reemplazar tabs por espacios
    .replace(/ +/g, ' ')   // Reemplazar múltiples espacios por uno solo
    .replace(/\r\n/g, '\n') // Normalizar saltos de línea
    .replace(/\r/g, '\n');
  
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line);
  const resultados = [];
  
  console.log('Total de líneas a procesar:', lines.length);
  console.log('Primeras 10 líneas:', lines.slice(0, 10));
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
  
  // Detectar fechas en formato "DD-nov" o "DD-nov SALON"
  const fechaRegex = /(\d{1,2})[- ](nov|noviembre|dic|diciembre|ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|septiembre|oct|octubre)/i;
  
  // Estructura para almacenar datos por salón y fecha
  const datosPorSalon = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();
    
    // Buscar fecha (formato: "19-nov" o "19-nov SALON")
    const fechaMatch = line.match(fechaRegex);
    if (fechaMatch) {
      const dia = fechaMatch[1].padStart(2, '0');
      const mesAbrev = fechaMatch[2].toLowerCase();
      const mes = mesMap[mesAbrev] || '11';
      currentFecha = `${currentYear}-${mes}-${dia}`;
      continue;
    }
    
    // Si no hay fecha actual, continuar
    if (!currentFecha) continue;
    
    // Buscar salón en la línea
    // Para PDFs de Excel, el salón puede estar al inicio de la línea o después de espacios
    let salonEncontrado = null;
    let mejorCoincidencia = null;
    let mejorScore = 0;
    
    for (const salon of salonesConocidos) {
      // Normalizar nombres para comparación
      const salonNormalizado = salon.toLowerCase().trim();
      const lineNormalizado = lineLower.trim();
      
      // Buscar coincidencia exacta (mayor prioridad)
      const salonRegex = new RegExp(`(^|\\s)${salon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'i');
      if (salonRegex.test(line)) {
        salonEncontrado = salon;
        break; // Coincidencia exacta, usar esta
      }
      
      // Buscar coincidencia parcial para mejorar la precisión
      if (lineNormalizado.includes(salonNormalizado) || salonNormalizado.includes(lineNormalizado)) {
        const score = Math.min(salonNormalizado.length, lineNormalizado.length) / Math.max(salonNormalizado.length, lineNormalizado.length);
        if (score > mejorScore && score > 0.7) { // Al menos 70% de coincidencia
          mejorScore = score;
          mejorCoincidencia = salon;
        }
      }
    }
    
    // Si no hay coincidencia exacta pero hay una buena parcial, usarla
    if (!salonEncontrado && mejorCoincidencia) {
      salonEncontrado = mejorCoincidencia;
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
    // Los complementos pueden estar separados por espacios, tabs, o en diferentes posiciones
    // Buscar palabras clave de complementos
    const complementosEncontrados = [];
    
    // Buscar cada tipo de complemento
    for (const [categoria, keywords] of Object.entries(complementosMap)) {
      for (const keyword of keywords) {
        const keywordRegex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        if (keywordRegex.test(lineLower)) {
          // Extraer el complemento completo (puede tener texto adicional)
          const match = line.match(new RegExp(`([^\\s]*${keyword}[^\\s]*(?:\\s+[^\\s]+)*)`, 'i'));
          if (match && !complementosEncontrados.includes(match[1])) {
            complementosEncontrados.push(match[1]);
          }
        }
      }
    }
    
    // Si no encontramos complementos conocidos, buscar en toda la línea
    // Para PDFs de Excel, los complementos pueden estar en la misma línea separados por espacios
    if (complementosEncontrados.length === 0) {
      // Remover el nombre del salón y la fecha de la línea
      let complementoLine = line;
      
      // Remover fecha si está presente
      complementoLine = complementoLine.replace(fechaRegex, '').trim();
      
      // Remover el nombre del salón
      for (const salon of salonesConocidos) {
        complementoLine = complementoLine.replace(new RegExp(salon, 'gi'), '').trim();
      }
      
      // Remover palabras comunes que no son complementos
      complementoLine = complementoLine.replace(/\b(salon|salón|complemento|complementos)\b/gi, '').trim();
      
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
  console.log('Handler llamado. Método:', req.method, 'URL:', req.url);
  
  if (req.method !== 'POST') {
    console.log('Método no permitido:', req.method);
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

    console.log('Iniciando parsing del formulario...');

    // Parsear el formulario multipart usando formidable
    // En Next.js/Vercel, necesitamos usar el stream de la request directamente
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      multiples: true,
    });

    // Parsear la request
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Error al parsear formulario:', err);
          reject(err);
        } else {
          console.log('Formulario parseado. Fields:', Object.keys(fields), 'Files:', Object.keys(files));
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
    
    console.log('Archivo encontrado:', file ? (file.originalFilename || file.name || 'sin nombre') : 'No encontrado');

    if (!file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo PDF' });
    }

    // Obtener la ruta del archivo
    const filepath = file.filepath || file.path;
    if (!filepath) {
      return res.status(400).json({ error: 'No se pudo obtener la ruta del archivo' });
    }

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
        return res.status(400).json({ 
          error: 'El PDF no contiene texto extraíble. Puede ser un PDF escaneado o con formato especial. Por favor, verifica que el PDF contenga texto seleccionable.',
          sugerencia: 'Si el PDF es una imagen escaneada, necesitarás convertirlo a texto primero usando OCR.'
        });
      }
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
        const muestraTexto = textoPDF.substring(0, 1000);
        console.log('No se encontraron resultados. Muestra del texto:', muestraTexto);
        
        return res.status(400).json({ 
          error: 'No se pudo extraer información del PDF. El formato del documento puede ser diferente al esperado.',
          textoExtraido: muestraTexto,
          sugerencia: 'Verifica que el PDF contenga fechas en formato "DD-nov" y nombres de salones reconocidos.'
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


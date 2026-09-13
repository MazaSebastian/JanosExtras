/**
 * Normaliza el tipo de evento recibido (por ejemplo desde la planilla de Janos o ingresos libres)
 * a una de las claves principales definidas en FLUJOS_POR_TIPO y CLIENTE_FLUJOS_POR_TIPO:
 * 'XV' | 'Casamiento' | 'Corporativo' | 'Religioso' | 'Cumpleaños'
 */
export function normalizarTipoEvento(tipo) {
  if (!tipo || typeof tipo !== 'string') return '';

  const clean = tipo.trim();
  const lower = clean.toLowerCase();

  // XV / 15
  if (
    clean === 'XV' ||
    lower === '15' ||
    lower === '15s' ||
    lower.includes('quince') ||
    lower.includes('fiesta de 15') ||
    lower.startsWith('15 ')
  ) {
    return 'XV';
  }

  // Casamiento / Boda
  if (
    lower.includes('casamiento') ||
    lower.includes('boda') ||
    lower.includes('matrimonio')
  ) {
    return 'Casamiento';
  }

  // Corporativo / Empresarial
  if (
    lower.includes('corporativo') ||
    lower.includes('empresarial') ||
    lower.includes('empresa') ||
    lower.includes('charla') ||
    lower.includes('conferencia')
  ) {
    return 'Corporativo';
  }

  // Religioso / Bar o Bat Mitzvah
  if (
    lower.includes('religioso') ||
    lower.includes('bar mitzvah') ||
    lower.includes('bat mitzvah') ||
    lower.includes('mitzvah') ||
    lower.includes('jupa') ||
    lower.includes('jupá')
  ) {
    return 'Religioso';
  }

  // Cumpleaños
  if (
    lower.includes('cumple') ||
    lower.includes('aniversario')
  ) {
    return 'Cumpleaños';
  }

  // Si no coincide con ninguna regla específica pero coincide exactamente con una clave estándar
  const tiposValidos = ['XV', 'Casamiento', 'Corporativo', 'Religioso', 'Cumpleaños'];
  const exactMatch = tiposValidos.find(t => t.toLowerCase() === lower);
  if (exactMatch) return exactMatch;

  return clean;
}

export const VALOR_PENDIENTE = '__PENDIENTE__';

export function esValorPendiente(valor) {
  if (valor === undefined || valor === null) return false;
  if (valor === VALOR_PENDIENTE) return true;
  if (typeof valor === 'string') {
    const trimmed = valor.trim().toLowerCase();
    return trimmed === '__pendiente__' || trimmed === 'pendiente';
  }
  if (Array.isArray(valor) && valor.length > 0) {
    return esValorPendiente(valor[0]);
  }
  return false;
}

/**
 * Normaliza las respuestas guardadas (sea por el cliente o por el DJ)
 * para que sean compatibles con las definiciones de preguntas de FLUJOS_POR_TIPO
 */
export function normalizarRespuestasParaFlujo(respuestasRaw, tipoEvento) {
  if (!respuestasRaw) return {};

  let respuestas = respuestasRaw;
  if (typeof respuestas === 'string') {
    try {
      respuestas = JSON.parse(respuestas);
    } catch (e) {
      return {};
    }
  }

  if (!respuestas || typeof respuestas !== 'object') return {};

  const mapped = { ...respuestas };

  // Unificar campos de Casamiento (singular a plural o viceversa)
  const tipoNorm = normalizarTipoEvento(tipoEvento);
  if (tipoNorm === 'Casamiento') {
    // Si viene del cliente (singular) y el DJ espera plural:
    if (mapped.realiza_ingreso_salon !== undefined && mapped.realizan_ingreso_salon === undefined) {
      mapped.realizan_ingreso_salon = mapped.realiza_ingreso_salon;
    }
    if (mapped.realizan_ingreso_salon !== undefined && mapped.realiza_ingreso_salon === undefined) {
      mapped.realiza_ingreso_salon = mapped.realizan_ingreso_salon;
    }

    if (mapped.baila_vals !== undefined && mapped.bailan_vals === undefined) {
      mapped.bailan_vals = mapped.baila_vals;
    }
    if (mapped.bailan_vals !== undefined && mapped.baila_vals === undefined) {
      mapped.baila_vals = mapped.bailan_vals;
    }

    if (mapped.realiza_coreografia !== undefined && mapped.realizan_coreografia === undefined) {
      mapped.realizan_coreografia = mapped.realiza_coreografia;
    }
    if (mapped.realizan_coreografia !== undefined && mapped.realiza_coreografia === undefined) {
      mapped.realiza_coreografia = mapped.realizan_coreografia;
    }

    if (mapped.realiza_ingreso_carioca !== undefined && mapped.realizan_ingreso_carioca === undefined) {
      mapped.realizan_ingreso_carioca = mapped.realiza_ingreso_carioca;
    }
    if (mapped.realizan_ingreso_carioca !== undefined && mapped.realiza_ingreso_carioca === undefined) {
      mapped.realiza_ingreso_carioca = mapped.realizan_ingreso_carioca;
    }

    if (mapped.realiza_ceremonia_salon !== undefined && mapped.realizan_ceremonia_salon === undefined) {
      mapped.realizan_ceremonia_salon = mapped.realiza_ceremonia_salon;
    }
    if (mapped.realizan_ceremonia_salon !== undefined && mapped.realiza_ceremonia_salon === undefined) {
      mapped.realiza_ceremonia_salon = mapped.realizan_ceremonia_salon;
    }

    if (mapped.descripcion_coreografia !== undefined && mapped.detalles_coreografia === undefined) {
      mapped.detalles_coreografia = mapped.descripcion_coreografia;
    }
    if (mapped.detalles_coreografia !== undefined && mapped.descripcion_coreografia === undefined) {
      mapped.descripcion_coreografia = mapped.detalles_coreografia;
    }
  }

  // Normalizar velas
  if (mapped.velas) {
    if (typeof mapped.velas === 'string') {
      try {
        mapped.velas = JSON.parse(mapped.velas);
      } catch (e) {
        mapped.velas = [];
      }
    }
    if (!Array.isArray(mapped.velas)) {
      mapped.velas = [];
    }
    mapped.velas = mapped.velas.filter(v => v && typeof v === 'object' && (v.nombre || v.familiar || v.cancion));
  } else {
    mapped.velas = [];
  }

  return mapped;
}

/**
 * Evalúa si una respuesta satisface la condición de una pregunta condicional
 */
export function evalCondicional(valorCondicional, valorEsperado) {
  if (valorCondicional === undefined || valorCondicional === null) return false;

  // Si el valor es un array (por ejemplo botones seleccionados: ['Sí'])
  if (Array.isArray(valorCondicional)) {
    return valorCondicional.some(v => String(v).trim().toLowerCase() === String(valorEsperado).trim().toLowerCase());
  }

  // Comparación estándar
  return String(valorCondicional).trim().toLowerCase() === String(valorEsperado).trim().toLowerCase();
}

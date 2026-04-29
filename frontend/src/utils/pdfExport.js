import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const VALOR_PENDIENTE = '__PENDIENTE__';
const esPendiente = (valor) => valor === VALOR_PENDIENTE || valor === '__PENDIENTE__';

export const exportarCoordinacionPDF = async (coordinacion, coordinacionesAPI, FLUJOS_POR_TIPO) => {
  const html2pdf = (await import('html2pdf.js')).default;

  // Fetch details
  let flujo = null;
  try {
    const flujoResponse = await coordinacionesAPI.getFlujo(coordinacion.id);
    flujo = flujoResponse.data || flujoResponse;
  } catch (e) {
    console.error("Error fetching flujo:", e);
  }

  const tipoEvento = coordinacion.tipo_evento?.trim();
  const pasos = tipoEvento ? FLUJOS_POR_TIPO[tipoEvento] || [] : [];

  let respuestas = flujo?.respuestas || {};
  if (typeof respuestas === 'string') {
    try { respuestas = JSON.parse(respuestas); } catch (e) { }
  }

  let fechaStr = 'Fecha no definida';
  if (coordinacion.fecha_evento) {
    // Evitar desfase de zona horaria parseando las partes o usando el componente base
    const dateOnly = coordinacion.fecha_evento.split('T')[0]; // Extraer solo la fecha "YYYY-MM-DD"
    const parts = dateOnly.split(/[-/]/);
    if (parts.length === 3) {
      const year = parts[0].length === 4 ? parseInt(parts[0], 10) : parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parts[0].length === 4 ? parseInt(parts[2], 10) : parseInt(parts[0], 10);
      const d = new Date(year, month, day, 12, 0, 0);
      fechaStr = format(d, "d 'de' MMMM '-' yyyy", { locale: es });
    }
  }
  const eventoStr = `${fechaStr} - ${coordinacion.salon_nombre || 'Salón no definido'}`;

  const reportDiv = document.createElement('div');
  reportDiv.style.padding = '40px';
  reportDiv.style.fontFamily = 'Arial, sans-serif';
  reportDiv.style.color = '#333';

  // Build the details HTML
  let detallesHtml = '';
  let itemsPendientesHtml = '';

  const itemsPendientes = [];

  pasos.forEach((paso) => {
    let pasoHtml = '';
    let pasoTieneRespuestas = false;

    paso.preguntas.forEach((pregunta) => {
      const esCondicional = pregunta.condicional && pregunta.condicional.pregunta;
      const debeMostrar = !esCondicional || (respuestas[pregunta.condicional.pregunta] === pregunta.condicional.valor);

      if (!debeMostrar) return;

      const valor = respuestas[pregunta.id];

      if (esPendiente(valor)) {
        itemsPendientes.push({ paso: paso.titulo, pregunta: pregunta.label });
        pasoTieneRespuestas = true;
        pasoHtml += `
          <div class="avoid-break" style="background: #fff3e0; padding: 12px; border-radius: 6px; border: 1px solid #ff9800; margin-bottom: 8px; page-break-inside: avoid;">
            <span style="color: #e65100; font-weight: 600;">${pregunta.label}:</span> 
            <span style="font-size: 14px; color: #e65100;">⏳ PENDIENTE</span>
          </div>
        `;
      } else if (pregunta.tipo === 'velas' && Array.isArray(valor) && valor.length > 0) {
        pasoTieneRespuestas = true;
        let velasHtml = valor.map(vela => `
          <div style="padding: 8px; border: 1px solid #ddd; margin-bottom: 8px; border-radius: 4px; background: #fff; page-break-inside: avoid;">
            <strong>${vela.nombre}</strong> - ${vela.familiar}
            <div style="color: #666; font-size: 14px;">🎵 ${vela.cancion}</div>
          </div>
        `).join('');

        pasoHtml += `
          <div class="avoid-break" style="margin-bottom: 15px; page-break-inside: avoid;">
            <span style="font-weight: 600; display: block; margin-bottom: 8px;">${pregunta.label}:</span>
            ${velasHtml}
          </div>
        `;
      } else if (valor !== undefined && valor !== null && valor !== '') {
        pasoTieneRespuestas = true;
        const textValue = String(valor).replace(/\n/g, '<br/>');
        pasoHtml += `
          <div class="avoid-break" style="margin-bottom: 12px; page-break-inside: avoid;">
            <span style="font-weight: 600; display: block;">${pregunta.label}:</span>
            <span style="color: #555;">${textValue}</span>
          </div>
        `;
      }
    });

    if (pasoTieneRespuestas) {
      detallesHtml += `
        <div class="avoid-break" style="margin-bottom: 25px; page-break-inside: avoid;">
          <h3 style="font-size: 18px; color: #772c87; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px;">${paso.titulo}</h3>
          ${pasoHtml}
        </div>
      `;
    }
  });

  if (itemsPendientes.length > 0) {
    let listHtml = itemsPendientes.map(item => `<li style="margin-bottom: 6px; color: #e65100; font-size: 15px;"><strong>${item.paso}:</strong> ${item.pregunta}</li>`).join('');
    itemsPendientesHtml = `
      <div style="background: #fff3e0; border: 2px solid #ff9800; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #e65100; margin-top: 0; font-size: 18px;">⏳ Items Pendientes (${itemsPendientes.length})</h3>
        <p style="color: #e65100; margin-bottom: 15px; font-size: 15px;">Los siguientes items quedaron pendientes de confirmar. Recuerda contactar al cliente antes del evento.</p>
        <ul style="margin: 0; padding-left: 20px;">
          ${listHtml}
        </ul>
      </div>
    `;
  }

  const contentHtml = `
    <div style="border-bottom: 2px solid #772c87; padding-bottom: 20px; margin-bottom: 30px;">
      <h1 style="color: #772c87; margin: 0;">REPORTE DE COORDINACIÓN</h1>
      <p style="color: #666; font-size: 14px; margin-top: 5px;">Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
    </div>
    
    <div style="margin-bottom: 30px; line-height: 1.8; font-size: 16px;">
      <h2 style="font-size: 20px; color: #444; border-bottom: 1px solid #eee; padding-bottom: 8px;">Información General</h2>
      <p style="margin: 5px 0;"><strong>Evento:</strong> ${eventoStr} </p>
      <p style="margin: 5px 0;"><strong>Agasajado/a:</strong> ${coordinacion.nombre_agasajado || 'N/A'}</p>
      <p style="margin: 5px 0;"><strong>Cliente:</strong> ${coordinacion.nombre_cliente ? `${coordinacion.nombre_cliente} ${coordinacion.apellido_cliente || ''}`.trim() : 'N/A'}</p>
      <p style="margin: 5px 0;"><strong>Teléfono:</strong> ${coordinacion.telefono || 'N/A'}</p>
      <p style="margin: 5px 0;"><strong>Tipo:</strong> ${coordinacion.tipo_evento || 'N/A'}</p>
      <p style="margin: 5px 0;"><strong>Código:</strong> ${coordinacion.codigo_evento || 'N/A'}</p>
      <p style="margin: 5px 0;"><strong>Estado:</strong> <span style="font-weight:bold; color: ${itemsPendientes.length > 0 ? '#ff9800' : '#4caf50'}">${coordinacion.estado ? coordinacion.estado.toUpperCase() : 'PENDIENTE'}</span></p>
    </div>

    ${itemsPendientesHtml}

    <div style="background: #fafafa; padding: 25px; border-radius: 8px; border: 1px solid #eee; page-break-inside: avoid;">
      <h2 style="font-size: 20px; color: #444; margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px;">Resumen de Evento</h2>
      ${detallesHtml || '<p style="color: #666;">No hay detalles cargados para este evento.</p>'}
    </div>
  `;

  reportDiv.innerHTML = contentHtml;
  document.body.appendChild(reportDiv);

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `Coordinacion_${coordinacion.codigo_evento || 'Janos'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: 'css', avoid: '.avoid-break' }
  };

  try {
    await html2pdf().set(opt).from(reportDiv).save();
  } finally {
    if (document.body.contains(reportDiv)) {
      document.body.removeChild(reportDiv);
    }
  }
};

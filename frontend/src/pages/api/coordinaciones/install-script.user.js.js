export default function handler(req, res) {
  const host = req.headers.host || 'janosdjs.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const script = `// ==UserScript==
// @name         Jano's Sync - Planilla de Coordinaciones
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Sincroniza y extrae detalles completos de clientes desde la ficha técnica de Jano's.
// @author       Antigravity
// @match        https://tecnica.janosgroup.com/index.php*
// @match        https://tecnica.janosgroup.com/
// @match        ${baseUrl}/dashboard/janos-sync*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      localhost
// @connect      janosdjs.com
// ==/UserScript==

(function() {
    'use strict';

    const API_URL = "${baseUrl}/api/coordinaciones/sync-bulk";
    const PARENT_ORIGIN = "${baseUrl}";

    // Ping al dashboard si estamos cargados en él
    const isDashboard = window.location.href.includes('/dashboard/janos-sync');
    if (isDashboard) {
        // Enviar ping inicial de inmediato
        window.postMessage({ type: 'JANOS_SYNC_SCRIPT_INSTALLED_PING' }, window.location.origin);
        
        // Escuchar pings del dashboard
        window.addEventListener('message', function(event) {
            if (event.origin !== window.location.origin) return;
            if (event.data && event.data.type === 'JANOS_SYNC_CHECK_PING') {
                window.postMessage({ type: 'JANOS_SYNC_SCRIPT_INSTALLED_PING' }, window.location.origin);
            }
        });
        return;
    }

    // Comunicar estado al Dashboard si estamos en un iframe
    const isIframe = window.self !== window.top;
    if (isIframe) {
        window.top.postMessage({ type: 'JANOS_SYNC_SCRIPT_LOADED' }, PARENT_ORIGIN);

        // Escuchar credenciales desde el dashboard principal
        window.addEventListener('message', function(event) {
            if (event.origin !== PARENT_ORIGIN) return;

            if (event.data.type === 'JANOS_SYNC_AUTO_LOGIN') {
                const { usuario, contrasena } = event.data;
                const userInput = document.querySelector('input[name="usuario"], input[type="text"]');
                const passInput = document.querySelector('input[name="contrasena"], input[type="password"]');
                const submitBtn = document.querySelector('button[type="submit"], input[type="submit"]');

                if (userInput && passInput && submitBtn) {
                    userInput.value = usuario;
                    passInput.value = contrasena;
                    submitBtn.click();
                }
            }
        });

        // Solicitar credenciales
        window.top.postMessage({ type: 'JANOS_SYNC_REQUEST_CREDS' }, PARENT_ORIGIN);
    }

    // 2. Insertar contenedor de Jano's Sync en la interfaz
    const syncContainer = document.createElement('div');
    syncContainer.style.cssText = \`
        margin: 20px auto;
        padding: 15px;
        background: linear-gradient(135deg, #1e1b4b, #311042);
        border: 1px solid #7c3aed;
        border-radius: 8px;
        color: white;
        font-family: Arial, sans-serif;
        max-width: 95%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
    \`;

    const infoText = document.createElement('div');
    infoText.innerHTML = \`
        <h3 style="margin: 0 0 5px 0; color: #a78bfa;">🔗 Jano's Sync Activo</h3>
        <p style="margin: 0; font-size: 13px; color: #cbd5e1;">Presioná el botón para importar automáticamente los eventos visibles y todos los datos de sus clientes.</p>
    \`;
    syncContainer.appendChild(infoText);

    // Botón de sincronizar
    const syncBtn = document.createElement('button');
    syncBtn.innerText = '⚡ Sincronizar Eventos';
    syncBtn.style.cssText = \`
        padding: 10px 20px;
        background-color: #8b5cf6;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.2s;
    \`;
    syncBtn.onmouseover = () => syncBtn.style.backgroundColor = '#7c3aed';
    syncBtn.onmouseout = () => syncBtn.style.backgroundColor = '#8b5cf6';
    syncContainer.appendChild(syncBtn);

    // Insertar el contenedor arriba de la tabla principal
    const mainTitle = document.querySelector('h1, h2, .Planillas');
    if (mainTitle) {
        mainTitle.parentNode.insertBefore(syncContainer, mainTitle.nextSibling);
    } else {
        document.body.insertBefore(syncContainer, document.body.firstChild);
    }

    // Buscar tabla principal
    function getPlanillaTable() {
        const tables = Array.from(document.querySelectorAll('table'));
        for (const t of tables) {
            if (t.innerText.includes('Codigo Evento') || t.innerText.includes('Código Evento')) {
                return t;
            }
        }
        return null;
    }

    // Extraer campos de la ficha técnica usando el texto plano renderizado por el navegador
    function parseFichaTecnica(htmlText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const text = doc.body ? doc.body.innerText : '';

        const clean = (regex) => {
            const match = text.match(regex);
            return match ? match[1].trim() : '';
        };

        const tipoVal = clean(/Tipo de evento\\\\s*[:\\\\-]?\\\\s*([^\\\\n]+)/i) || clean(/Tipo\\\\s*:\\\\s*([^\\\\n]+)/i);

        return {
            tipo: tipoVal.toLowerCase().includes('de evento') ? '' : tipoVal,
            nombre: clean(/Nombre\\\\s*[:\\\\-]?\\\\s*([^\\\\n]+)/i),
            apellido: clean(/Apellido\\\\s*[:\\\\-]?\\\\s*([^\\\\n]+)/i),
            agasajado: clean(/Agasajad[oa]\\\\s*[:\\\\-]?\\\\s*([^\\\\n]+)/i),
            telefono: clean(/Celular\\\\s*[:\\\\-]?\\\\s*([^\\\\n]+)/i) || clean(/Teléfono\\\\s*[:\\\\-]?\\\\s*([^\\\\n]+)/i) || clean(/Telefono\\\\s*[:\\\\-]?\\\\s*([^\\\\n]+)/i),
            mail: clean(/Mail\\\\s*[:\\\\-]?\\\\s*([^\\\\n\\\\s]+)/i),
            dni: clean(/DNI\\\\s*[:\\\\-]?\\\\s*([^\\\\n]+)/i),
            direccion: clean(/Direccion\\\\s*[:\\\\-]?\\\\s*([^\\\\n]+)/i) || clean(/Dirección\\\\s*[:\\\\-]?\\\\s*([^\\\\n]+)/i),
            localidad: clean(/Localidad\\\\s*[:\\\\-]?\\\\s*([^\\\\n]+)/i)
        };
    }

    // Realizar HTTP request de fondo para un evento individual
    function fetchEventDetails(codigo) {
        const detailUrl = \`\${window.location.origin}/ver_evento.php?id=\${codigo}\`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: detailUrl,
                onload: function(res) {
                    if (res.status === 200) {
                        resolve(parseFichaTecnica(res.responseText));
                    } else {
                        reject(new Error(\`Status \${res.status}\`));
                    }
                },
                onerror: function(err) {
                    reject(err);
                }
            });
        });
    }

    // Acción al presionar el botón
    syncBtn.addEventListener('click', async () => {
        const table = getPlanillaTable();
        if (!table) {
            alert('❌ No se encontró la tabla de coordinaciones. Asegurate de que la planilla esté visible en pantalla.');
            return;
        }

        const rows = table.querySelectorAll('tr');
        const baseEventos = [];

        rows.forEach((row, index) => {
            if (index === 0) return;
            const cells = row.querySelectorAll('td');
            if (cells.length >= 7) {
                const codigo = cells[0].innerText.trim();
                const fecha = cells[1].innerText.trim();
                const salon = cells[2].innerText.trim();
                const tipo = cells[3].innerText.trim();
                const cliente = cells[6].innerText.trim();

                if (codigo && /^\\\\d+$/.test(codigo)) {
                    baseEventos.push({
                        codigo_evento: codigo,
                        fecha_evento: fecha,
                        salon_nombre: salon,
                        tipo_evento: tipo,
                        nombre_cliente: cliente
                    });
                }
            }
        });

        if (baseEventos.length === 0) {
            alert('⚠️ No se encontraron códigos de eventos en la tabla.');
            return;
        }

        let token = GM_getValue('sync_token', '');
        if (!token) {
            token = 'janos_cron_secret_push_notif_2026_secure';
            GM_setValue('sync_token', token);
        }

        syncBtn.disabled = true;
        const richEventos = [];
        let completed = 0;

        for (const ev of baseEventos) {
            completed++;
            syncBtn.innerText = \`⏳ Cargando \${completed}/\${baseEventos.length}...\`;
            if (isIframe) {
                window.top.postMessage({ 
                    type: 'JANOS_SYNC_PROGRESS', 
                    current: completed, 
                    total: baseEventos.length,
                    codigo: ev.codigo_evento
                }, PARENT_ORIGIN);
            }

            try {
                const details = await fetchEventDetails(ev.codigo_evento);
                let telLimpio = details.telefono ? details.telefono.replace(/[^\\\\d+]/g, '') : '';
                const extraNotes = [];
                if (details.mail) extraNotes.push(\`Mail: \${details.mail}\`);
                if (details.dni) extraNotes.push(\`DNI: \${details.dni}\`);
                if (details.direccion) extraNotes.push(\`Dirección: \${details.direccion}\${details.localidad ? ', ' + details.localidad : ''}\`);
                
                richEventos.push({
                    ...ev,
                    tipo_evento: details.tipo || ev.tipo_evento,
                    nombre_cliente: details.nombre || ev.nombre_cliente,
                    apellido_cliente: details.apellido || null,
                    nombre_agasajado: details.agasajado || null,
                    telefono: telLimpio || null,
                    notas: extraNotes.length > 0 ? extraNotes.join(' | ') : null
                });
            } catch (err) {
                console.error(\`Error cargando ficha para \${ev.codigo_evento}:\`, err);
                richEventos.push(ev);
            }
            await new Promise(resolve => setTimeout(resolve, 150));
        }

        syncBtn.innerText = '📤 Enviando a Extras...';
        if (isIframe) {
            window.top.postMessage({ type: 'JANOS_SYNC_SENDING' }, PARENT_ORIGIN);
        }

        GM_xmlhttpRequest({
            method: "POST",
            url: API_URL,
            headers: {
                "Content-Type": "application/json",
                "Authorization": \`Bearer \${token}\`
            },
            data: JSON.stringify({ eventos: richEventos }),
            onload: function(response) {
                try {
                    const resData = JSON.parse(response.responseText);
                    if (response.status === 200 && resData.success) {
                        const report = resData.report;
                        const msg = \`🎉 Sincronización completada: \${report.recibidos} procesados, \${report.creados} creados, \${report.actualizados} actualizados.\`;
                        if (isIframe) {
                            window.top.postMessage({ type: 'JANOS_SYNC_SUCCESS', report }, PARENT_ORIGIN);
                        } else {
                            alert(msg);
                        }
                    } else {
                        const errMsg = resData.error || response.statusText;
                        if (isIframe) {
                            window.top.postMessage({ type: 'JANOS_SYNC_ERROR', error: errMsg }, PARENT_ORIGIN);
                        } else {
                            alert(\`❌ Error del servidor: \${errMsg}\`);
                        }
                    }
                } catch (e) {
                    if (isIframe) {
                        window.top.postMessage({ type: 'JANOS_SYNC_ERROR', error: 'Error parseando respuesta' }, PARENT_ORIGIN);
                    } else {
                        alert('❌ Error al procesar respuesta.');
                    }
                }
                resetButton();
            },
            onerror: function(error) {
                if (isIframe) {
                    window.top.postMessage({ type: 'JANOS_SYNC_ERROR', error: 'Error de conexión' }, PARENT_ORIGIN);
                } else {
                    alert('❌ Error de conexión al servidor.');
                }
                resetButton();
            }
        });
    });

    function resetButton() {
        syncBtn.innerText = '⚡ Sincronizar Eventos';
        syncBtn.disabled = false;
    }
})();`;

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Content-Disposition', 'inline; filename="janos_sync.user.js"');
  return res.send(script);
}

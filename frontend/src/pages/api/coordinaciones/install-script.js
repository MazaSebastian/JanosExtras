export default function handler(req, res) {
  const host = req.headers.host || 'janosdjs.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const script = `// ==UserScript==
// @name         Jano's Sync - Planilla de Coordinaciones
// @namespace    http://tampermonkey.net/
// @version      1.15
// @description  Sincroniza y extrae detalles completos de clientes desde la ficha técnica de Jano's.
// @author       Antigravity
// @match        *://tecnica.janosgroup.com/*
// @match        ${baseUrl}/*
// @allFrames    true
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      localhost
// @connect      janosgroup.com
// @connect      janosdjs.com
// @connect      vercel.app
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

    const API_URL = "${baseUrl}/api/coordinaciones/sync-bulk";
    const PARENT_ORIGIN = "${baseUrl}";

    // Indicador visual en la pantalla de Login para diagnosticar si el script corre en el iframe
    const isLoginPage = window.location.href.includes('/index.php') || window.location.pathname === '/';
    if (isLoginPage) {
        setTimeout(() => {
            const loginCard = document.querySelector('form') || document.querySelector('.card') || document.body;
            if (loginCard && !document.getElementById('janos-sync-badge')) {
                const badge = document.createElement('div');
                badge.id = "janos-sync-badge";
                badge.innerText = "⚡ Jano's Sync Conectado";
                badge.style.cssText = "background-color: #7c3aed; color: white; padding: 8px; text-align: center; font-size: 12px; font-weight: bold; border-radius: 6px; margin-top: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);";
                loginCard.appendChild(badge);
            }
        }, 500);
    }

    // Si estamos en nuestra plataforma, guardar el token en Tampermonkey
    const isPlatform = window.location.href.startsWith(PARENT_ORIGIN);
    if (isPlatform) {
        // Guardar el token de la sesión activa de inmediato
        const activeToken = localStorage.getItem('token');
        if (activeToken) {
            GM_setValue('sync_token', activeToken);
        }

        // Si estamos específicamente en la página del panel, interactuar con ella
        const isDashboardPage = window.location.href.includes('/dashboard/janos-sync');
        if (isDashboardPage) {
            // Enviar ping inicial de inmediato
            window.postMessage({ type: 'JANOS_SYNC_SCRIPT_INSTALLED_PING' }, window.location.origin);
            
            // Escuchar pings del dashboard
            window.addEventListener('message', function(event) {
                if (event.origin !== window.location.origin) return;
                if (event.data && event.data.type === 'JANOS_SYNC_CHECK_PING') {
                    const currentToken = localStorage.getItem('token');
                    if (currentToken) {
                        GM_setValue('sync_token', currentToken);
                    }
                    window.postMessage({ type: 'JANOS_SYNC_SCRIPT_INSTALLED_PING' }, window.location.origin);
                }
            });
        }
        return;
    }

    // Comunicar estado al Dashboard si estamos en un iframe de Extras
    const isIframe = (function() {
        if (window.self === window.top) return false;
        // Verificar orígenes de ancestros en navegadores compatibles (Blink)
        if (window.location.ancestorOrigins) {
            const origins = Array.from(window.location.ancestorOrigins);
            if (origins.some(o => o.includes('localhost') || o.includes('janosdjs.com') || o.includes('vercel.app'))) {
                return true;
            }
        }
        // Fallback usando document.referrer
        if (document.referrer) {
            const ref = document.referrer.toLowerCase();
            if (ref.includes('localhost') || ref.includes('janosdjs.com') || ref.includes('vercel.app')) {
                return true;
            }
        }
        return false;
    })();

    if (isIframe) {
        window.top.postMessage({ type: 'JANOS_SYNC_SCRIPT_LOADED' }, '*');

        // Escuchar credenciales desde el dashboard principal
        window.addEventListener('message', function(event) {
            const isAuthorizedOrigin = event.origin === PARENT_ORIGIN || 
                                       event.origin.includes('localhost') || 
                                       event.origin.includes('janosdjs.com') || 
                                       event.origin.includes('vercel.app');
            if (!isAuthorizedOrigin) return;

            if (event.data.type === 'JANOS_SYNC_AUTO_LOGIN') {
                const { usuario, contrasena, token } = event.data;
                if (token) {
                    GM_setValue('sync_token', token);
                }
                
                // Selector robusto de campos de texto
                const userInput = document.querySelector('input[name="usuario"]') ||
                                  document.querySelector('input[type="text"]') ||
                                  document.querySelector('input[placeholder*="usuario" i]');
                                  
                const passInput = document.querySelector('input[name="contrasena"]') ||
                                  document.querySelector('input[name="contraseña"]') ||
                                  document.querySelector('input[type="password"]') ||
                                  document.querySelector('input[placeholder*="contrase" i]');
                
                let submitBtn = document.querySelector('form button[type="submit"]') ||
                                document.querySelector('button[type="submit"]') ||
                                document.querySelector('input[type="submit"]') ||
                                document.querySelector('form button') ||
                                document.querySelector('.btn-primary');

                if (!submitBtn) {
                    const clickables = Array.from(document.querySelectorAll('button, input, a, div, span'));
                    submitBtn = clickables.find(el => el.innerText && el.innerText.trim().toLowerCase() === 'ingresar');
                }

                if (userInput && passInput) {
                    // Autofilar valores
                    userInput.value = usuario;
                    passInput.value = contrasena;

                    // Despachar eventos nativos para forzar que frameworks (React/Vue) actualicen el estado interno
                    userInput.dispatchEvent(new Event('input', { bubbles: true }));
                    userInput.dispatchEvent(new Event('change', { bubbles: true }));
                    passInput.dispatchEvent(new Event('input', { bubbles: true }));
                    passInput.dispatchEvent(new Event('change', { bubbles: true }));

                    // Cliquear botón de ingresar
                    if (submitBtn) {
                        const attempted = sessionStorage.getItem('janos_sync_auto_login_attempted');
                        if (event.data.isManual || !attempted) {
                            if (!event.data.isManual) {
                                sessionStorage.setItem('janos_sync_auto_login_attempted', 'true');
                            }
                            setTimeout(() => {
                                submitBtn.click();
                            }, 100);
                        } else {
                            console.log("Jano's Sync: Auto-login already attempted. Skipping click to prevent loops.");
                        }
                    }
                }
            }
        });

        // Solicitar credenciales
        window.top.postMessage({ type: 'JANOS_SYNC_REQUEST_CREDS' }, '*');
    }

    // Solo continuar y crear la interfaz si estamos en la página de la planilla (existe la tabla de coordinaciones)
    const table = getPlanillaTable();
    if (!table) {
        return;
    }

    // Login exitoso detectado -> Limpiar flag de intento de autologin
    sessionStorage.removeItem('janos_sync_auto_login_attempted');

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

        const tipoVal = clean(/Tipo de evento\\s*[:\\-]?\\s*(.*?)(?=(?:Nombre|Apellido|Direccion|Dirección|Localidad|DNI|Telefono|Teléfono|Celular|Mail|Agasajad|\\n|$))/i) || 
                        clean(/Tipo\\s*:\\s*(.*?)(?=(?:Nombre|Apellido|Direccion|Dirección|Localidad|DNI|Telefono|Teléfono|Celular|Mail|Agasajad|\\n|$))/i);

        return {
            tipo: tipoVal.toLowerCase().includes('de evento') ? '' : tipoVal,
            nombre: clean(/Nombre\\s*[:\\-]?\\s*(.*?)(?=(?:Apellido|Direccion|Dirección|Localidad|DNI|Telefono|Teléfono|Celular|Mail|Agasajad|\\n|$))/i),
            apellido: clean(/Apellido\\s*[:\\-]?\\s*(.*?)(?=(?:Direccion|Dirección|Localidad|DNI|Telefono|Teléfono|Celular|Mail|Agasajad|\\n|$))/i),
            agasajado: clean(/Agasajad[oa]\\s*[:\\-]?\\s*(.*?)(?=(?:Direccion|Dirección|Localidad|DNI|Telefono|Teléfono|Celular|Mail|\\n|$))/i),
            telefono: clean(/Celular\\s*[:\\-]?\\s*(.*?)(?=(?:Mail|DNI|Direccion|Dirección|Localidad|\\n|$))/i) || 
                      clean(/Teléfono\\s*[:\\-]?\\s*(.*?)(?=(?:Mail|DNI|Direccion|Dirección|Localidad|\\n|$))/i) || 
                      clean(/Telefono\\s*[:\\-]?\\s*(.*?)(?=(?:Mail|DNI|Direccion|Dirección|Localidad|\\n|$))/i),
            mail: clean(/Mail\\s*[:\\-]?\\s*(.*?)(?=(?:DNI|Direccion|Dirección|Localidad|\\n|\\s|$))/i),
            dni: clean(/DNI\\s*[:\\-]?\\s*(.*?)(?=(?:Direccion|Dirección|Localidad|Telefono|Teléfono|Celular|Mail|\\n|$))/i),
            direccion: clean(/Direccion\\s*[:\\-]?\\s*(.*?)(?=(?:Localidad|DNI|Telefono|Teléfono|Celular|Mail|\\n|$))/i) || 
                       clean(/Dirección\\s*[:\\-]?\\s*(.*?)(?=(?:Localidad|DNI|Telefono|Teléfono|Celular|Mail|\\n|$))/i),
            localidad: clean(/Localidad\\s*[:\\-]?\\s*(.*?)(?=(?:DNI|Telefono|Teléfono|Celular|Mail|\\n|$))/i)
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

                if (codigo && /^\\d+$/.test(codigo)) {
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
                }, '*');
            }

            try {
                const details = await fetchEventDetails(ev.codigo_evento);
                let telLimpio = details.telefono ? details.telefono.replace(/[^\\d+]/g, '') : '';
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
            window.top.postMessage({ type: 'JANOS_SYNC_SENDING' }, '*');
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
                        let msg = "🎉 Chequeo de Sincronización Completado:\n\n";
                        if (report.creados > 0) {
                            msg += \`✅ \${report.creados} \${report.creados === 1 ? 'evento AGREGADO' : 'eventos AGREGADOS'}.\n\`;
                        } else {
                            msg += "ℹ️ No se encontraron nuevos eventos para agregar.\n";
                        }
                        if (report.duplicados > 0) {
                            msg += \`⚠️ [Advertencia] Evento duplicado: \${report.duplicados} \${report.duplicados === 1 ? 'evento ya existe' : 'eventos ya existen'} en la plataforma (se omitió su importación para evitar pérdida de coordinaciones realizadas).\n\`;
                        }
                        if (isIframe) {
                            window.top.postMessage({ type: 'JANOS_SYNC_SUCCESS', report }, '*');
                        } else {
                            alert(msg);
                        }
                    } else {
                        const errMsg = resData.error || response.statusText;
                        if (isIframe) {
                            window.top.postMessage({ type: 'JANOS_SYNC_ERROR', error: errMsg }, '*');
                        } else {
                            alert(\`❌ Error del servidor: \${errMsg}\`);
                        }
                    }
                } catch (e) {
                    if (isIframe) {
                        window.top.postMessage({ type: 'JANOS_SYNC_ERROR', error: 'Error parseando respuesta' }, '*');
                    } else {
                        alert('❌ Error al procesar respuesta.');
                    }
                }
                resetButton();
            },
            onerror: function(error) {
                if (isIframe) {
                    window.top.postMessage({ type: 'JANOS_SYNC_ERROR', error: 'Error de conexión' }, '*');
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

    // --- AUTOCORRESPONDENCIA Y AUTOCOMPLETADO DE FICHAS TÉCNICAS ---
    
    // Inyectar estilos del panel flotante y toasts
    const styleTag = document.createElement('style');
    styleTag.innerHTML = \`
        @keyframes janosFadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes janosToast {
            0% { opacity: 0; transform: translateY(20px); }
            15% { opacity: 1; transform: translateY(0); }
            85% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
        }
        .janos-panel {
            position: fixed !important;
            top: 80px !important;
            right: 20px !important;
            z-index: 99999999 !important;
            width: 280px;
            padding: 16px;
            background: rgba(15, 12, 30, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(124, 58, 237, 0.6);
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.6);
            font-family: 'Outfit', 'Inter', Arial, sans-serif;
            color: white;
            animation: janosFadeIn 0.3s ease-out;
        }
        .janos-panel h4 {
            margin: 0 0 4px 0;
            color: #a78bfa;
            font-size: 14px;
            font-weight: bold;
        }
        .janos-panel p {
            margin: 0 0 12px 0;
            font-size: 11px;
            color: #9ca3af;
        }
        .janos-btn-autofill {
            padding: 8px 12px;
            background: linear-gradient(135deg, #7c3aed, #8b5cf6);
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            width: 100%;
            margin-bottom: 8px;
        }
        .janos-btn-autofill:hover:not(:disabled) {
            background: linear-gradient(135deg, #6d28d9, #7c3aed);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }
        .janos-btn-autofill:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .janos-template-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            margin-top: 8px;
        }
        .janos-btn-temp {
            padding: 6px 4px;
            background: #374151;
            color: #e5e7eb;
            border: none;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.15s ease;
            text-align: center;
        }
        .janos-btn-temp:hover {
            background: #4b5563;
            color: white;
        }
        .janos-btn-clear {
            padding: 6px 12px;
            background: transparent;
            border: 1px solid rgba(239, 68, 68, 0.4);
            color: #f87171;
            border-radius: 6px;
            font-weight: bold;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            margin-top: 12px;
        }
        .janos-btn-clear:hover {
            background: rgba(239, 68, 68, 0.1);
            border-color: #ef4444;
            color: #ef4444;
        }
    \`;
    document.head.appendChild(styleTag);

    // Guardar el último código de evento cliqueado en la planilla
    let lastClickedEventCode = '';
    let lastClickedEventType = '';
    
    document.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row) {
            const cells = row.querySelectorAll('td');
            if (cells.length > 3) {
                const codigo = cells[0].innerText.trim();
                const tipo = cells[3].innerText.trim();
                if (codigo && /^\\d+$/.test(codigo)) {
                    lastClickedEventCode = codigo;
                    lastClickedEventType = tipo;
                    // Actualizar texto si el panel está visible
                    const badge = document.getElementById('janos-active-event-badge');
                    if (badge) {
                        badge.innerText = \`Evento: #\${codigo} (\${tipo})\`;
                    }
                }
            }
        }
    }, true);

    const TEMPLATES = {
        'XV': {
            'temadeingresoarecepcion': 'Covers acústicos / Pop chillout de fondo.',
            'cancionesceremonia': 'No realiza ceremonia en el salón (solo recepción y fiesta).',
            'temadeentradaalsalon': 'Tema enérgico e impactante elegido por la quinceañera.',
            'vals': 'Vals tradicional con familiares (duración aproximada 5-10 minutos).',
            'velas': 'Ceremonia tradicional de las 15 velas con temas dedicados a cada uno.',
            'shows': 'A coordinar de acuerdo al cronograma general de la fiesta.',
            'showsexternos': 'No se informan shows contratados externamente.',
            'coreografias': 'Coreografía especial de la quinceañera con amigos en tanda de baile.',
            'temadebrindis': 'Tema festivo alegre luego de la torta y videos.',
            'temaderamowhisky': 'No aplica (opcional juego de cintas o cofre para las amigas).',
            'musicalizacionrecepcion': 'Chill out, Pop acústico, Lounge moderno.',
            'musicalizaciontanda': 'Tanda 1: Cumbia clásica y pop. Tanda 2: Reggaeton actual. Tanda 3: Carioca y dance comercial.',
            'cancionesclave': 'Mantener volumen e impacto alto en entrada y momentos clave.',
            'entradaencarioca': 'Tema enérgico para apertura de tanda de cotillón.',
            'estilosartistasevitar': 'Música lenta en tandas de baile. Evitar temas explícitos fuera de la trasnoche.',
            'videostraidosporelcliente': 'Video cronológico y saludos de amigos en formato digital.',
            'playlist': 'Link de Spotify provisto por la quinceañera.'
        },
        'Casamiento': {
            'temadeingresoarecepcion': 'Instrumental / Lounge / Covers acústicos.',
            'cancionesceremonia': 'Ingreso de novios, intercambio de alianzas y tema de salida festivo.',
            'temadeentradaalsalon': 'Tema explosivo y de gran energía para la entrada de los novios.',
            'vals': 'Vals clásico de novios e invitados tradicionales.',
            'velas': 'No realiza ceremonia de velas.',
            'shows': 'A coordinar según el cronograma de shows y sorpresas.',
            'showsexternos': 'Por confirmar según proveedores externos contratados.',
            'coreografias': 'Coreografía sorpresa de los novios o amigos.',
            'temadebrindis': 'Brindis de novios, alza de copas y fotos.',
            'temaderamowhisky': 'Lanzamiento de ramo (Novia) y botella de Whisky en caja (Novio).',
            'musicalizacionrecepcion': 'Bossa Nova, Jazz, Pop suave internacional.',
            'musicalizaciontanda': 'Tanda 1: Cumbia clásica, reggaeton comercial. Tanda 2: Hits 80s/90s y pop nacional. Tanda 3: Fiesta, cuarteto y carioca.',
            'cancionesclave': 'Coordinar canciones de entrada, vals, ramo, whisky y brindis.',
            'entradaencarioca': 'Tema fiestero/carioca para inicio de cotillón.',
            'estilosartistasevitar': 'Música pesada, electrónica dura, metal.',
            'videostraidosporelcliente': 'Video cronológico / Historial de fotos de la pareja.',
            'playlist': 'Playlist oficial de Spotify compartida por los novios.'
        },
        'Corporativo': {
            'temadeingresoarecepcion': 'Música corporativa / Lounge / Chill out de fondo.',
            'cancionesceremonia': 'No realiza ceremonia (presentaciones o videos corporativos).',
            'temadeentradaalsalon': 'Música enérgica para la bienvenida formal y discursos.',
            'vals': 'No realiza.',
            'velas': 'No realiza.',
            'shows': 'Entrega de reconocimientos / Palabras de autoridades.',
            'showsexternos': 'A confirmar según agenda del evento.',
            'coreografias': 'No realiza.',
            'temadebrindis': 'Brindis corporativo, palabras de cierre del año.',
            'temaderamowhisky': 'No aplica (puede realizar sorteos de vouchers/regalos).',
            'musicalizacionrecepcion': 'Lounge, instrumental, jazz moderno, pop funcional.',
            'musicalizaciontanda': 'Hits comerciales ATP, clásicos bailables, cumbia clásica.',
            'cancionesclave': 'Música para premiaciones, fanfarria de ganadores y discursos.',
            'entradaencarioca': 'Apertura de tanda de baile general.',
            'estilosartistasevitar': 'Música explícita, letras ofensivas, estilos estridentes fuera de tanda.',
            'videostraidosporelcliente': 'Presentación institucional (PPT) / Videos de fin de año.',
            'playlist': 'Música sugerida por el comité de organización.'
        }
    };

    const JANO_FIELDS_MAP = {
        'temadeingresoarecepcion': ['ingreso recepcion', 'ingreso a recepcion', 'ingreso recepción', 'ingreso recepcion', 'ingreso a recepción'],
        'cancionesceremonia': ['canciones ceremonia', 'cancion ceremonia', 'ceremonia'],
        'temadeentradaalsalon': ['entrada al salon', 'entrada salon', 'entrada al salón', 'entrada salón', 'entrada'],
        'vals': ['vals', 'baile de vals', 'vals de 15', 'vals de novios'],
        'velas': ['velas', 'ceremonia de velas', 'tira de velas'],
        'shows': ['shows', 'show', 'shows internos'],
        'showsexternos': ['shows externos', 'show externo', 'shows externo', 'show externos'],
        'coreografias': ['coreografias', 'coreografia', 'coreografías', 'coreografía'],
        'temadebrindis': ['tema de brindis', 'tema brindis', 'brindis'],
        'temaderamowhisky': ['ramo/whisky', 'ramo / whisky', 'tema de ramo/whisky', 'ramo y whisky', 'ramo', 'whisky'],
        'musicalizacionrecepcion': ['musicalizacion recepcion', 'musicalización recepcion', 'musicalizacion recepción', 'musicalización recepción', 'musica recepcion', 'música recepción'],
        'musicalizaciontanda': ['musicalizacion tanda', 'musicalización tanda', 'musicalizacion tandas', 'musicalización tandas', 'tandas', 'tanda'],
        'cancionesclave': ['canciones clave', 'cancion clave'],
        'entradaencarioca': ['entrada en carioca', 'carioca', 'entrada carioca'],
        'estilosartistasevitar': ['estilos/artistas evitar', 'estilos y artistas evitar', 'artistas evitar', 'evitar', 'no pasar'],
        'videostraidosporelcliente': ['videos traidos por el cliente', 'videos cliente', 'videos traídos por el cliente'],
        'playlist': ['playlist', 'link de playlist', 'spotify', 'link playlist']
    };

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = \`
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 10001;
            padding: 12px 24px;
            font-family: Arial, sans-serif;
            font-weight: bold;
            font-size: 13px;
            animation: janosToast 3s forwards;
            pointer-events: none;
            color: white;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
        \`;
        
        if (type === 'success') {
            toast.style.backgroundColor = '#10b981';
        } else if (type === 'error') {
            toast.style.backgroundColor = '#ef4444';
        } else {
            toast.style.backgroundColor = '#f59e0b';
        }
        
        toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function getFormControls() {
        const controls = {};
        // Filtrar solo controles que tengan altura y ancho visible (para no detectar campos de modales ocultos)
        const inputs = Array.from(document.querySelectorAll('textarea, input:not([type="button"]):not([type="submit"]):not([type="hidden"]):not([type="checkbox"]):not([type="radio"])'))
            .filter(input => {
                const rect = input.getBoundingClientRect();
                return rect.height > 0 && rect.width > 0;
            });
        
        inputs.forEach(input => {
            let labelText = '';
            
            // 1. Intentar por id y label[for]
            if (input.id) {
                const label = document.querySelector('label[for="' + input.id + '"]');
                if (label) {
                    labelText = label.innerText || label.textContent || '';
                }
            }
            
            // 2. Intentar buscar en hermanos anteriores directos (incluyendo texto y elementos)
            if (!labelText) {
                let prev = input.previousSibling;
                while (prev && !labelText) {
                    const txt = (prev.textContent || prev.innerText || '').trim();
                    if (txt) {
                        labelText = txt;
                        break;
                    }
                    prev = prev.previousSibling;
                }
            }
            
            // 3. Intentar buscar en el parent o grandparent (buscando etiquetas comunes)
            if (!labelText) {
                let parent = input.parentElement;
                for (let i = 0; i < 3 && parent; i++) {
                    const possibleLabel = parent.querySelector('label, strong, b, h1, h2, h3, h4, h5, h6, p, span, th, td:first-child');
                    if (possibleLabel && possibleLabel !== parent && possibleLabel !== input) {
                        labelText = possibleLabel.innerText || possibleLabel.textContent || '';
                        break;
                    }
                    // Si el parent tiene texto propio al inicio
                    const parentText = (parent.firstChild && parent.firstChild.nodeType === Node.TEXT_NODE) 
                        ? parent.firstChild.textContent.trim() 
                        : '';
                    if (parentText) {
                        labelText = parentText;
                        break;
                    }
                    parent = parent.parentElement;
                }
            }
            
            // 4. Fallback a placeholder o name
            if (!labelText) {
                labelText = input.placeholder || input.name || '';
            }
            
            labelText = labelText.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (!labelText) return;

            // Limpiar dos puntos al final o espacios
            labelText = labelText.replace(/:$/, '').trim();

            for (const [fieldKey, patterns] of Object.entries(JANO_FIELDS_MAP)) {
                const matches = patterns.some(pattern => {
                    const normalizedPattern = pattern.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    return labelText.includes(normalizedPattern) || normalizedPattern.includes(labelText);
                });
                
                if (matches) {
                    controls[fieldKey] = input;
                    break;
                }
            }
        });
        
        return controls;
    }

    function mapSurveyToJanosFields(respuestas, tipoEvento) {
        const data = {};
        
        // 1. Tema de ingreso a recepcion
        if (tipoEvento === 'Religioso') {
            data['temadeingresoarecepcion'] = respuestas['musica_recepcion_comidas'] || respuestas['artistas_favoritos'] || '';
        } else if (tipoEvento === 'Corporativo') {
            data['temadeingresoarecepcion'] = respuestas['musica_recepcion'] ? (Array.isArray(respuestas['musica_recepcion']) ? respuestas['musica_recepcion'].join(', ') : respuestas['musica_recepcion']) : '';
        } else {
            data['temadeingresoarecepcion'] = 'Covers / Acústicos sugeridos por el DJ';
        }

        // 2. Canciones Ceremonia
        if (tipoEvento === 'Casamiento') {
            const realiza = respuestas['realizan_ceremonia_salon'];
            if (realiza === 'No') {
                data['cancionesceremonia'] = 'No realiza ceremonia en salón';
            } else {
                const novio = respuestas['cancion_ingreso_novio'] || '';
                const novia = respuestas['cancion_ingreso_novia'] || '';
                const detalles = respuestas['detalles_ceremonia'] || '';
                data['cancionesceremonia'] = \`Ingreso Novio: \${novio}\\nIngreso Novia: \${novia}\\nDetalles: \${detalles}\`.trim();
            }
        } else if (tipoEvento === 'Religioso') {
            data['cancionesceremonia'] = respuestas['detalle_homenajes'] || '';
        } else {
            data['cancionesceremonia'] = 'No realiza ceremonia';
        }

        // 3. Tema de entrada al salon
        data['temadeentradaalsalon'] = respuestas['cancion_ingreso_salon'] || respuestas['detalle_ingreso_salon'] || '';

        // 4. Vals
        if (tipoEvento === 'XV') {
            if (respuestas['baila_vals'] === 'No') {
                data['vals'] = 'No realiza vals';
            } else {
                data['vals'] = respuestas['cancion_vals'] || '';
            }
        } else if (tipoEvento === 'Casamiento') {
            if (respuestas['bailan_vals'] === 'No') {
                data['vals'] = 'No realiza vals';
            } else {
                data['vals'] = respuestas['cancion_vals'] || '';
            }
        } else {
            data['vals'] = 'No realiza vals';
        }

        // 5. Velas
        if (respuestas['velas'] && Array.isArray(respuestas['velas']) && respuestas['velas'].length > 0) {
            data['velas'] = respuestas['velas'].map((v, i) => \`Vela \${i+1}: \${v.dedicacion || ''} - Canción: \${v.cancion || ''}\`).join('\\n');
        } else if (respuestas['ceremonia_velas'] === 'No') {
            data['velas'] = 'No realiza ceremonia de velas';
        } else if (respuestas['cancion_vela_guia']) {
            data['velas'] = \`Vela Guía: \${respuestas['cancion_vela_guia']}\`;
        } else {
            data['velas'] = 'No realiza ceremonia de velas';
        }

        // 6. Shows
        data['shows'] = respuestas['shows'] || '';

        // 7. Shows Externos
        data['showsexternos'] = respuestas['shows_externos'] || '';

        // 8. Coreografias
        data['coreografias'] = respuestas['descripcion_coreografia'] || respuestas['detalles_coreografia'] || '';

        // 9. Tema de brindis
        data['temadebrindis'] = respuestas['cancion_brindis'] || '';

        // 10. Tema de Ramo/whisky
        if (tipoEvento === 'Casamiento') {
            const ramo = respuestas['cancion_ramo_novia'] || '';
            const whisky = respuestas['cancion_whisky_novio'] || '';
            data['temaderamowhisky'] = \`Ramo: \${ramo}\\nWhisky: \${whisky}\`.trim();
        } else {
            data['temaderamowhisky'] = 'No aplica';
        }

        // 11. Musicalizacion recepcion
        data['musicalizacionrecepcion'] = respuestas['musica_recepcion'] ? (Array.isArray(respuestas['musica_recepcion']) ? respuestas['musica_recepcion'].join(', ') : respuestas['musica_recepcion']) : (respuestas['musica_recepcion_comidas'] || 'Chill out / Lounge');

        // 12. Musicalizacion Tanda
        let tandas = [];
        if (respuestas['tanda_1']) tandas.push(\`Tanda 1: \${Array.isArray(respuestas['tanda_1']) ? respuestas['tanda_1'].join(', ') : respuestas['tanda_1']}\`);
        if (respuestas['tanda_2']) tandas.push(\`Tanda 2: \${Array.isArray(respuestas['tanda_2']) ? respuestas['tanda_2'].join(', ') : respuestas['tanda_2']}\`);
        if (respuestas['tanda_3']) tandas.push(\`Tanda 3: \${Array.isArray(respuestas['tanda_3']) ? respuestas['tanda_3'].join(', ') : respuestas['tanda_3']}\`);
        if (respuestas['tanda_4']) tandas.push(\`Tanda 4: \${Array.isArray(respuestas['tanda_4']) ? respuestas['tanda_4'].join(', ') : respuestas['tanda_4']}\`);
        data['musicalizaciontanda'] = tandas.join('\\n');

        // 13. Canciones clave
        data['cancionesclave'] = respuestas['canciones_clave'] || '';

        // 14. Entrada en carioca
        data['entradaencarioca'] = respuestas['cancion_ingreso_carioca'] || '';

        // 15. Estilos/artistas evitar
        data['estilosartistasevitar'] = respuestas['artistas_evitar'] || respuestas['estilos_evitar'] || '';

        // 16. Videos traidos por el cliente
        data['videostraidosporelcliente'] = respuestas['videos_cliente'] || '';

        // 17. Playlist
        data['playlist'] = respuestas['link_playlist'] || '';

        return data;
    }

    function autofillWithTemplate(type) {
        const template = TEMPLATES[type];
        if (!template) return;
        
        const controls = getFormControls();
        let filledCount = 0;
        
        for (const [key, value] of Object.entries(template)) {
            if (controls[key]) {
                controls[key].value = value;
                controls[key].dispatchEvent(new Event('input', { bubbles: true }));
                controls[key].dispatchEvent(new Event('change', { bubbles: true }));
                filledCount++;
            }
        }
        
        if (filledCount > 0) {
            showToast(\`✅ Plantilla \${type} aplicada con éxito\`, 'success');
        } else {
            showToast('⚠️ No se encontraron campos compatibles', 'warning');
        }
    }

    function clearForm() {
        const controls = getFormControls();
        let clearedCount = 0;
        for (const control of Object.values(controls)) {
            control.value = '';
            control.dispatchEvent(new Event('input', { bubbles: true }));
            control.dispatchEvent(new Event('change', { bubbles: true }));
            clearedCount++;
        }
        showToast('🧹 Ficha técnica limpiada', 'success');
    }

    function detectTemplateType(typeString) {
        if (!typeString) return 'XV';
        const norm = typeString.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (norm.includes('xv') || norm.includes('15')) return 'XV';
        if (norm.includes('casamiento') || norm.includes('boda') || norm.includes('novio') || norm.includes('civil')) return 'Casamiento';
        if (norm.includes('corp') || norm.includes('empresa') || norm.includes('egresado')) return 'Corporativo';
        return 'XV';
    }

    async function autofillFromExtras() {
        const detectedCode = lastClickedEventCode;
        const code = prompt("Ingresá el código de evento para auto-completar:", detectedCode || "");
        
        if (!code) return;
        
        const apiSearchUrl = PARENT_ORIGIN + '/api/coordinaciones/by-codigo/' + code;
        const token = GM_getValue('sync_token', '');
        
        const fetchBtn = document.getElementById('janos-btn-fetch-extras');
        if (fetchBtn) {
            fetchBtn.disabled = true;
            fetchBtn.innerText = '⏳ Buscando...';
        }
        
        GM_xmlhttpRequest({
            method: "GET",
            url: apiSearchUrl,
            headers: {
                "Authorization": 'Bearer ' + token
            },
            onload: function(res) {
                if (fetchBtn) {
                    fetchBtn.disabled = false;
                    fetchBtn.innerText = '⚡ Auto-completar Ficha';
                }
                
                try {
                    if (res.status === 200) {
                        const data = JSON.parse(res.responseText);
                        if (data.encuesta_respuestas) {
                            const mapped = mapSurveyToJanosFields(data.encuesta_respuestas, data.tipo_evento);
                            const controls = getFormControls();
                            let count = 0;
                            
                            for (const [key, val] of Object.entries(mapped)) {
                                if (controls[key]) {
                                    controls[key].value = val;
                                    controls[key].dispatchEvent(new Event('input', { bubbles: true }));
                                    controls[key].dispatchEvent(new Event('change', { bubbles: true }));
                                    count++;
                                }
                            }
                            
                            if (count > 0) {
                                showToast('✅ ' + (data.nombre_agasajado || data.nombre_cliente || 'Cliente') + ': ¡Ficha cargada desde Extras!', 'success');
                            } else {
                                showToast('⚠️ Se obtuvieron los datos pero no se mapeó ningún campo.', 'warning');
                            }
                        } else {
                            const detectedType = detectTemplateType(data.tipo_evento || lastClickedEventType);
                            showToast('⚠️ El evento no tiene una encuesta completada en Extras.', 'warning');
                            if (confirm('El evento no tiene una encuesta completada en Extras. ¿Querés cargar la plantilla estándar para "' + detectedType + '" en su lugar?')) {
                                autofillWithTemplate(detectedType);
                            }
                        }
                    } else {
                        const detectedType = detectTemplateType(lastClickedEventType);
                        showToast('⚠️ Evento no encontrado en Extras.', 'warning');
                        if (confirm('No se encontró el evento en Extras. ¿Querés cargar la plantilla estándar para "' + detectedType + '" en su lugar?')) {
                            autofillWithTemplate(detectedType);
                        }
                    }
                } catch (e) {
                    const detectedType = detectTemplateType(lastClickedEventType);
                    showToast('❌ Error de comunicación con Extras. Cargando plantilla...', 'error');
                    autofillWithTemplate(detectedType);
                }
            },
            onerror: function() {
                if (fetchBtn) {
                    fetchBtn.disabled = false;
                    fetchBtn.innerText = '⚡ Auto-completar Ficha';
                }
                const detectedType = detectTemplateType(lastClickedEventType);
                showToast('❌ Error de red al consultar Extras. Cargando plantilla...', 'error');
                autofillWithTemplate(detectedType);
            }
        });
    }

    function injectAutofillUI() {
        // Extraer código de evento actual de la pantalla si no está guardado
        let displayCode = lastClickedEventCode;
        if (!displayCode) {
            const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, span, strong, b, div, p'));
            for (const el of elements) {
                const text = el.innerText || el.textContent || '';
                const match = text.match(/Evento\\s*:?\\s*(\\d{4,6})/i);
                if (match) {
                    displayCode = match[1];
                    lastClickedEventCode = displayCode;
                    break;
                }
            }
        }

        const displayType = lastClickedEventType ? ' (' + lastClickedEventType + ')' : '';
        const badgeText = 'Evento: #' + (displayCode || '---') + displayType;

        const existingContainer = document.getElementById('janos-autofill-container');
        if (existingContainer) {
            const badge = document.getElementById('janos-active-event-badge');
            if (badge && badge.innerText !== badgeText) {
                badge.innerText = badgeText;
            }
            return;
        }
        
        const container = document.createElement('div');
        container.id = 'janos-autofill-container';
        container.className = 'janos-panel';
        
        container.innerHTML = 
            '<h4>⚡ Autocompletado Extras</h4>' +
            '<p id="janos-active-event-badge">' + badgeText + '</p>' +
            '<button id="janos-btn-fetch-extras" class="janos-btn-autofill">⚡ Auto-completar Ficha</button>' +
            '<div style="font-size: 11px; font-weight: bold; color: #a78bfa; margin-top: 12px; margin-bottom: 6px;">O USAR PLANTILLAS MANUALES:</div>' +
            '<div class="janos-template-grid">' +
                '<button id="janos-temp-xv" class="janos-btn-temp">🌸 XV</button>' +
                '<button id="janos-temp-boda" class="janos-btn-temp">💍 Boda</button>' +
                '<button id="janos-temp-corp" class="janos-btn-temp">🏢 Corp</button>' +
            '</div>' +
            '<button id="janos-btn-clear-form" class="janos-btn-clear">🗑️ Limpiar Ficha</button>';
        
        document.body.appendChild(container);
        
        // Listeners
        document.getElementById('janos-btn-fetch-extras').addEventListener('click', autofillFromExtras);
        document.getElementById('janos-temp-xv').addEventListener('click', () => autofillWithTemplate('XV'));
        document.getElementById('janos-temp-boda').addEventListener('click', () => autofillWithTemplate('Casamiento'));
        document.getElementById('janos-temp-corp').addEventListener('click', () => autofillWithTemplate('Corporativo'));
        document.getElementById('janos-btn-clear-form').addEventListener('click', clearForm);
    }

    function checkAndInjectAutofill() {
        // Detectar si el modal está abierto basándose en el número de textareas visibles.
        // Esto evita depender de etiquetas o títulos específicos que puedan fallar en la detección.
        const textareas = Array.from(document.querySelectorAll('textarea'))
            .filter(t => {
                const rect = t.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            });
            
        // El modal de coordinación tiene más de 10 campos de tipo textarea visibles
        const isModalOpen = textareas.length >= 5;
            
        if (isModalOpen) {
            injectAutofillUI();
        } else {
            const container = document.getElementById('janos-autofill-container');
            if (container) {
                container.remove();
            }
        }
    }

    setInterval(checkAndInjectAutofill, 1000);
})();`;

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Content-Disposition', 'inline; filename="janos_sync.user.js"');
  return res.send(script);
}

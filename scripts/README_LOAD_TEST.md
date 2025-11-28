# Guía de Pruebas de Carga

Este directorio contiene scripts para realizar pruebas de carga y determinar la capacidad máxima del sistema.

## 📋 Requisitos Previos

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno (opcional):**
```bash
export API_URL=https://janosdjs.com
export TEST_TOKENS=token1,token2,token3  # Para pruebas autenticadas
```

## 🚀 Scripts Disponibles

### 1. Prueba Básica de Carga

Prueba simple de un endpoint específico.

**Uso básico:**
```bash
npm run load-test
# O directamente:
node scripts/load-test-basic.js https://janosdjs.com/api/health
```

**Opciones avanzadas:**
```bash
node scripts/load-test-basic.js https://janosdjs.com/api/health \
  --connections=50 \
  --duration=60 \
  --pipelining=2
```

**Parámetros:**
- `URL`: Endpoint a probar (requerido)
- `--connections=N`: Número de conexiones concurrentes (default: 10)
- `--duration=N`: Duración en segundos (default: 30)
- `--pipelining=N`: Número de requests por conexión (default: 1)

**Ejemplo de salida:**
```
📊 Resultados de la Prueba de Carga

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Métricas Generales:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total de Requests:     15,234
Requests por segundo:   507.80 req/s
Throughput:            2.45 MB/s
Errores:               0 (0.00%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Latencia (Tiempo de Respuesta):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Promedio:              98.45 ms
Mediana (p50):         95.23 ms
Percentil 95 (p95):    245.67 ms
Percentil 99 (p99):    456.78 ms
```

### 2. Prueba con Escenarios Realistas

Simula patrones de uso reales del sistema.

**Uso:**
```bash
npm run load-test:scenarios
# O directamente:
node scripts/load-test-scenarios.js https://janosdjs.com
```

**Escenarios incluidos:**
1. **Carga de Salones:** Simula múltiples usuarios cargando salones
2. **Health Check:** Establece baseline de rendimiento
3. **Consulta de Eventos:** Simula consultas autenticadas
4. **Pico de Fichadas:** Simula pico de fichadas simultáneas
5. **Carga Gradual:** Encuentra punto de saturación

**Nota:** Para escenarios autenticados, necesitas configurar `TEST_TOKENS` con tokens JWT válidos.

## 📊 Interpretación de Resultados

### Métricas Clave

1. **Requests por segundo (RPS):**
   - **Excelente:** > 100 RPS
   - **Bueno:** 50-100 RPS
   - **Aceptable:** 20-50 RPS
   - **Preocupante:** < 20 RPS

2. **Latencia (Tiempo de Respuesta):**
   - **Excelente:** p95 < 200ms
   - **Bueno:** p95 < 500ms
   - **Aceptable:** p95 < 1s
   - **Preocupante:** p95 > 2s

3. **Tasa de Errores:**
   - **Excelente:** < 0.1%
   - **Bueno:** < 1%
   - **Aceptable:** < 5%
   - **Preocupante:** > 5%

### Señales de Problemas

⚠️ **Alta Tasa de Errores (>5%):**
- Posible agotamiento de conexiones a DB
- Límites de Vercel alcanzados
- Problemas de red o infraestructura

⚠️ **Latencia Alta (p95 > 2s):**
- Queries lentas en base de datos
- Falta de índices
- Endpoints no optimizados

⚠️ **Throughput Bajo:**
- Cuellos de botella en base de datos
- Límites de rate limiting muy restrictivos
- Problemas de configuración

## 🎯 Objetivos de Prueba

### Prueba de Capacidad Normal
- **Objetivo:** Validar que el sistema maneja carga normal
- **Configuración:** 20 conexiones, 60 segundos
- **Endpoints:** Health check, salones, eventos

### Prueba de Pico de Carga
- **Objetivo:** Encontrar punto de saturación
- **Configuración:** 50-100 conexiones, 120 segundos
- **Endpoints:** Todos los críticos

### Prueba de Estrés
- **Objetivo:** Determinar límites absolutos
- **Configuración:** 100+ conexiones, 180 segundos
- **Endpoints:** Endpoints más usados

## 📝 Resultados

Los resultados se guardan automáticamente en:
- `logs/load-test-[timestamp].json` - Resultados completos en JSON
- `logs/load-test-progress.txt` - Progreso en tiempo real
- `logs/load-test-scenarios-[timestamp].json` - Resultados de escenarios

## 🔧 Troubleshooting

### Error: "Cannot find module 'autocannon'"
```bash
npm install --save-dev autocannon
```

### Error: "ECONNREFUSED"
- Verificar que la URL es correcta
- Verificar que el servidor está corriendo
- Verificar firewall/red

### Resultados Inconsistentes
- Ejecutar múltiples veces y promediar
- Verificar que no hay otros procesos usando recursos
- Ejecutar en horarios de bajo tráfico

## ⚠️ Advertencias

1. **No ejecutar en producción durante horarios pico**
2. **Notificar al equipo antes de ejecutar pruebas extensivas**
3. **Monitorear métricas de Supabase durante pruebas**
4. **Detener pruebas si se detectan problemas críticos**

## 📚 Recursos Adicionales

- [Documentación de Autocannon](https://github.com/mcollina/autocannon)
- [Análisis de Rendimiento](./ANALISIS_RENDIMIENTO.md)
- [Recomendaciones para Gerencia](./RECOMENDACIONES_GERENCIA.md)


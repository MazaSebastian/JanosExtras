#!/usr/bin/env node

/**
 * Script de Prueba de Carga con Escenarios Realistas
 * 
 * Simula patrones de uso reales del sistema:
 * - Múltiples DJs fichando simultáneamente
 * - Carga de calendarios
 * - Consultas de salones
 * - Operaciones de administración
 * 
 * Uso:
 *   node scripts/load-test-scenarios.js [BASE_URL]
 * 
 * Ejemplo:
 *   node scripts/load-test-scenarios.js https://janosdjs.com
 */

import autocannon from 'autocannon';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.argv[2] || process.env.API_URL || 'http://localhost:3000';

// Tokens de prueba (necesitas generar tokens válidos para pruebas reales)
// Para pruebas sin autenticación, usar endpoints públicos
const TEST_TOKENS = process.env.TEST_TOKENS?.split(',') || [];

console.log('🎯 Prueba de Carga con Escenarios Realistas\n');
console.log(`URL Base: ${BASE_URL}\n`);

// Escenarios de prueba
const scenarios = [
  {
    name: 'Escenario 1: Carga de Salones (Alto Tráfico)',
    description: 'Simula múltiples usuarios cargando la lista de salones',
    config: {
      url: `${BASE_URL}/api/salones/public`,
      connections: 20,
      duration: 30,
      method: 'GET',
    },
  },
  {
    name: 'Escenario 2: Health Check (Baseline)',
    description: 'Endpoint de health check para establecer baseline',
    config: {
      url: `${BASE_URL}/api/health`,
      connections: 50,
      duration: 30,
      method: 'GET',
    },
  },
  {
    name: 'Escenario 3: Consulta de Eventos (Carga Moderada)',
    description: 'Simula consultas de eventos (requiere autenticación)',
    config: {
      url: `${BASE_URL}/api/eventos/mis-eventos`,
      connections: 10,
      duration: 30,
      method: 'GET',
      headers: TEST_TOKENS[0] ? {
        'Authorization': `Bearer ${TEST_TOKENS[0]}`,
      } : {},
    },
  },
  {
    name: 'Escenario 4: Pico de Fichadas',
    description: 'Simula pico de fichadas (requiere autenticación y datos)',
    config: {
      url: `${BASE_URL}/api/fichadas`,
      connections: 15,
      duration: 60,
      method: 'POST',
      headers: TEST_TOKENS[0] ? {
        'Authorization': `Bearer ${TEST_TOKENS[0]}`,
        'Content-Type': 'application/json',
      } : {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tipo: 'ingreso',
        latitud: -34.6037,
        longitud: -58.3816,
      }),
    },
  },
  {
    name: 'Escenario 5: Carga Gradual (Ramp-up)',
    description: 'Aumenta gradualmente la carga para encontrar el punto de saturación',
    config: {
      url: `${BASE_URL}/api/health`,
      connections: 1,
      duration: 120,
      method: 'GET',
    },
    rampUp: true, // Aumentar conexiones gradualmente
  },
];

// Función para ejecutar un escenario
async function runScenario(scenario, index) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Escenario ${index + 1}: ${scenario.name}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Descripción: ${scenario.description}`);
  console.log(`Configuración:`);
  console.log(`  URL: ${scenario.config.url}`);
  console.log(`  Conexiones: ${scenario.config.connections}`);
  console.log(`  Duración: ${scenario.config.duration}s`);
  console.log(`  Método: ${scenario.config.method}`);
  console.log('\n⏳ Ejecutando...\n');

  return new Promise((resolve, reject) => {
    const instance = autocannon(scenario.config, (err, result) => {
      if (err) {
        console.error(`❌ Error en escenario ${index + 1}:`, err);
        reject(err);
        return;
      }

      // Mostrar resultados resumidos
      console.log('📊 Resultados:');
      console.log(`  Requests totales: ${result.requests.total.toLocaleString()}`);
      console.log(`  Requests/segundo: ${result.requests.mean.toFixed(2)}`);
      console.log(`  Latencia promedio: ${result.latency.mean.toFixed(2)} ms`);
      console.log(`  Latencia p95: ${result.latency.p95.toFixed(2)} ms`);
      console.log(`  Latencia p99: ${result.latency.p99.toFixed(2)} ms`);
      console.log(`  Errores: ${result.errors} (${((result.errors / result.requests.total) * 100).toFixed(2)}%)`);
      console.log(`  Throughput: ${(result.throughput.total / 1024 / 1024).toFixed(2)} MB/s`);

      // Análisis rápido
      const errorRate = (result.errors / result.requests.total) * 100;
      if (errorRate > 5) {
        console.log('  ⚠️  ALTA TASA DE ERRORES');
      } else if (errorRate > 1) {
        console.log('  ⚠️  TASA DE ERRORES MODERADA');
      } else {
        console.log('  ✅ TASA DE ERRORES BAJA');
      }

      if (result.latency.p95 > 2000) {
        console.log('  ⚠️  LATENCIA ALTA (p95 > 2s)');
      } else {
        console.log('  ✅ LATENCIA ACEPTABLE');
      }

      resolve(result);
    });

    // Mostrar progreso
    let lastProgress = 0;
    instance.on('tick', () => {
      const progress = Math.floor((instance.opts.duration - instance.remaining) / instance.opts.duration * 100);
      if (progress >= lastProgress + 10) {
        process.stdout.write(`  Progreso: ${progress}%\r`);
        lastProgress = progress;
      }
    });
  });
}

// Función principal
async function runAllScenarios() {
  console.log('🚀 Iniciando suite de pruebas de carga\n');
  console.log(`Total de escenarios: ${scenarios.length}\n`);

  const results = [];

  for (let i = 0; i < scenarios.length; i++) {
    try {
      const result = await runScenario(scenarios[i], i);
      results.push({
        scenario: scenarios[i].name,
        result,
      });

      // Pausa entre escenarios
      if (i < scenarios.length - 1) {
        console.log('\n⏸️  Pausa de 5 segundos antes del siguiente escenario...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(`Error ejecutando escenario ${i + 1}:`, error);
      results.push({
        scenario: scenarios[i].name,
        error: error.message,
      });
    }
  }

  // Resumen final
  console.log('\n\n' + '='.repeat(60));
  console.log('📋 RESUMEN FINAL');
  console.log('='.repeat(60));

  results.forEach((item, index) => {
    console.log(`\n${index + 1}. ${item.scenario}`);
    if (item.error) {
      console.log(`   ❌ Error: ${item.error}`);
    } else {
      const r = item.result;
      console.log(`   Requests: ${r.requests.total.toLocaleString()}`);
      console.log(`   RPS: ${r.requests.mean.toFixed(2)}`);
      console.log(`   Latencia p95: ${r.latency.p95.toFixed(2)} ms`);
      console.log(`   Errores: ${r.errors} (${((r.errors / r.requests.total) * 100).toFixed(2)}%)`);
    }
  });

  // Guardar resultados
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = join(__dirname, `../logs/load-test-scenarios-${timestamp}.json`);
  
  import('fs').then(fs => {
    if (!fs.existsSync(join(__dirname, '../logs'))) {
      fs.mkdirSync(join(__dirname, '../logs'), { recursive: true });
    }
    
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Resultados completos guardados en: ${resultsFile}`);
  });

  console.log('\n✅ Suite de pruebas completada\n');
}

// Ejecutar
runAllScenarios().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});


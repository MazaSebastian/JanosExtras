#!/usr/bin/env node

/**
 * Script de Prueba de Carga Básica
 * 
 * Prueba la capacidad del sistema bajo diferentes niveles de carga
 * 
 * Uso:
 *   node scripts/load-test-basic.js [URL] [opciones]
 * 
 * Ejemplo:
 *   node scripts/load-test-basic.js https://janosdjs.com/api/health
 *   node scripts/load-test-basic.js https://janosdjs.com/api/salones/public --connections 50 --duration 30
 */

import autocannon from 'autocannon';
import { createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración por defecto
const DEFAULT_URL = process.env.API_URL || 'http://localhost:3000';
const DEFAULT_CONNECTIONS = 10;
const DEFAULT_DURATION = 30; // segundos
const DEFAULT_PIPELINING = 1;

// Parsear argumentos
const args = process.argv.slice(2);
const url = args[0] || `${DEFAULT_URL}/api/health`;
const connections = parseInt(args.find(arg => arg.startsWith('--connections'))?.split('=')[1]) || DEFAULT_CONNECTIONS;
const duration = parseInt(args.find(arg => arg.startsWith('--duration'))?.split('=')[1]) || DEFAULT_DURATION;
const pipelining = parseInt(args.find(arg => arg.startsWith('--pipelining'))?.split('=')[1]) || DEFAULT_PIPELINING;

console.log('🚀 Iniciando prueba de carga...\n');
console.log('Configuración:');
console.log(`  URL: ${url}`);
console.log(`  Conexiones concurrentes: ${connections}`);
console.log(`  Duración: ${duration}s`);
console.log(`  Pipelining: ${pipelining}\n`);

// Configuración de autocannon
const instance = autocannon({
  url,
  connections,
  duration,
  pipelining,
  headers: {
    'Content-Type': 'application/json',
  },
}, (err, result) => {
  if (err) {
    console.error('❌ Error en la prueba:', err);
    process.exit(1);
  }

  // Mostrar resultados
  console.log('\n📊 Resultados de la Prueba de Carga\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Métricas Generales:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total de Requests:     ${result.requests.total.toLocaleString()}`);
  console.log(`Requests por segundo:  ${result.requests.mean.toFixed(2)} req/s`);
  console.log(`Throughput:            ${(result.throughput.total / 1024 / 1024).toFixed(2)} MB/s`);
  console.log(`Errores:               ${result.errors} (${((result.errors / result.requests.total) * 100).toFixed(2)}%)`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Latencia (Tiempo de Respuesta):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Promedio:              ${result.latency.mean.toFixed(2)} ms`);
  console.log(`Mediana (p50):         ${result.latency.p50.toFixed(2)} ms`);
  console.log(`Percentil 95 (p95):    ${result.latency.p95.toFixed(2)} ms`);
  console.log(`Percentil 99 (p99):    ${result.latency.p99.toFixed(2)} ms`);
  console.log(`Mínimo:                ${result.latency.min.toFixed(2)} ms`);
  console.log(`Máximo:                ${result.latency.max.toFixed(2)} ms`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Análisis:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Análisis de resultados
  const errorRate = (result.errors / result.requests.total) * 100;
  const avgLatency = result.latency.mean;
  const p95Latency = result.latency.p95;

  if (errorRate > 5) {
    console.log('⚠️  ALTA TASA DE ERRORES: Más del 5% de requests fallaron');
    console.log('   Recomendación: Revisar logs del servidor y capacidad de base de datos');
  } else if (errorRate > 1) {
    console.log('⚠️  TASA DE ERRORES MODERADA: Entre 1-5% de requests fallaron');
    console.log('   Recomendación: Monitorear y optimizar endpoints con errores');
  } else {
    console.log('✅ TASA DE ERRORES BAJA: Menos del 1% de requests fallaron');
  }

  if (avgLatency > 2000) {
    console.log('⚠️  LATENCIA ALTA: Tiempo de respuesta promedio > 2s');
    console.log('   Recomendación: Optimizar queries y considerar caching');
  } else if (avgLatency > 1000) {
    console.log('⚠️  LATENCIA MODERADA: Tiempo de respuesta promedio > 1s');
    console.log('   Recomendación: Revisar optimizaciones de base de datos');
  } else {
    console.log('✅ LATENCIA ACEPTABLE: Tiempo de respuesta promedio < 1s');
  }

  if (p95Latency > 5000) {
    console.log('⚠️  P95 LATENCIA MUY ALTA: 95% de requests > 5s');
    console.log('   Recomendación: Revisar cuellos de botella críticos');
  } else if (p95Latency > 2000) {
    console.log('⚠️  P95 LATENCIA ALTA: 95% de requests > 2s');
    console.log('   Recomendación: Optimizar endpoints más lentos');
  }

  // Guardar resultados en archivo
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = join(__dirname, `../logs/load-test-${timestamp}.json`);
  
  // Crear directorio logs si no existe
  import('fs').then(fs => {
    if (!fs.existsSync(join(__dirname, '../logs'))) {
      fs.mkdirSync(join(__dirname, '../logs'), { recursive: true });
    }
    
    fs.writeFileSync(resultsFile, JSON.stringify(result, null, 2));
    console.log(`\n💾 Resultados guardados en: ${resultsFile}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

// Mostrar progreso en tiempo real
autocannon.track(instance, {
  outputStream: createWriteStream(join(__dirname, '../logs/load-test-progress.txt')),
});

// Manejar interrupción
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Prueba interrumpida por el usuario');
  instance.stop();
  process.exit(0);
});


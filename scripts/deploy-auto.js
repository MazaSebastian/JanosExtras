#!/usr/bin/env node

/**
 * Script de deploy automático
 * Se ejecuta automáticamente después de cada cambio
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEPLOY_SCRIPT = path.join(__dirname, 'deploy.sh');

function deploy() {
  try {
    console.log('🚀 Ejecutando deploy automático...');
    
    // Verificar que el script de deploy existe
    if (!fs.existsSync(DEPLOY_SCRIPT)) {
      console.error('❌ No se encontró el script de deploy');
      process.exit(1);
    }

    // Hacer el script ejecutable
    execSync(`chmod +x "${DEPLOY_SCRIPT}"`, { cwd: PROJECT_ROOT });

    // Ejecutar el script de deploy
    const commitMessage = process.argv[2] || 'Deploy automático: Actualización del sistema';
    execSync(`"${DEPLOY_SCRIPT}" "${commitMessage}"`, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });

    console.log('✅ Deploy iniciado exitosamente');
  } catch (error) {
    console.error('❌ Error durante el deploy:', error.message);
    process.exit(1);
  }
}

deploy();


const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/CoordinacionFlujo.js');
let content = fs.readFileSync(filePath, 'utf8');

// The block starts with "Religioso: [" and ends with the next flow "Corporativo: [" or something similar.
const startIdx = content.indexOf('Religioso: [');
const endIdx = content.indexOf('};', startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    let block = content.substring(startIdx, endIdx);
    
    // We will replace the specific IDs in this block
    // Shows: 101 -> 1
    block = block.replace(/id: 101,\n\s*titulo: 'Shows'/, "id: 1,\n      titulo: 'Shows'");
    // Pantalla y Videos: 102 -> 2
    block = block.replace(/id: 102,\n\s*titulo: 'Pantalla y Videos'/, "id: 2,\n      titulo: 'Pantalla y Videos'");
    // Complementos Técnicos: 103 -> 3
    block = block.replace(/id: 103,\n\s*titulo: 'Complementos Técnicos'/, "id: 3,\n      titulo: 'Complementos Técnicos'");
    
    // Now Mejitzah: 1 -> 4
    block = block.replace(/id: 1,\n\s*titulo: 'Mejitzah'/, "id: 4,\n      titulo: 'Mejitzah'");
    
    // Música de recepción: 2 -> 5
    block = block.replace(/id: 2,\n\s*titulo: 'Música de recepción \/ Comidas'/, "id: 5,\n      titulo: 'Música de recepción / Comidas'");
    
    // Pre-dancing: 3 -> 6
    block = block.replace(/id: 3,\n\s*titulo: 'Pre-dancing'/, "id: 6,\n      titulo: 'Pre-dancing'");
    
    // Ingreso al salón: 4 -> 7
    block = block.replace(/id: 4,\n\s*titulo: 'Ingreso al salón'/, "id: 7,\n      titulo: 'Ingreso al salón'");
    
    // Homenajes: 5 -> 8
    block = block.replace(/id: 5,\n\s*titulo: 'Homenajes'/, "id: 8,\n      titulo: 'Homenajes'");
    
    // Velas: 6 -> 9
    block = block.replace(/id: 6,\n\s*titulo: 'Velas'/, "id: 9,\n      titulo: 'Velas'");
    
    // Canción de Brindis: 7 -> 10
    block = block.replace(/id: 7,\n\s*titulo: 'Canción de Brindis'/, "id: 10,\n      titulo: 'Canción de Brindis'");
    
    // Entrada en carioca: 8 -> 11
    block = block.replace(/id: 8,\n\s*titulo: 'Entrada en carioca'/, "id: 11,\n      titulo: 'Entrada en carioca'");
    
    // Club: 9 -> 12
    block = block.replace(/id: 9,\n\s*titulo: 'Club'/, "id: 12,\n      titulo: 'Club'");
    
    // Música de tandas: 10 -> 13
    block = block.replace(/id: 10,\n\s*titulo: 'Música de tandas'/, "id: 13,\n      titulo: 'Música de tandas'");

    content = content.substring(0, startIdx) + block + content.substring(endIdx);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('IDs actualizados correctamente');
} else {
    console.log('No se pudo encontrar el bloque de Religioso');
}

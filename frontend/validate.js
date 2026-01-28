#!/usr/bin/env node

/**
 * KYNDO - Validador de Código
 * Script para validar la estructura y calidad del código
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 KYNDO - Validador de Código\n');

// Validar que los archivos existen
const files = {
  html: 'index.html',
  css: 'styles.css',
  js: 'game.js',
  readme: 'README.md'
};

let allFilesExist = true;
console.log('📁 Verificando archivos...');
for (const [type, file] of Object.entries(files)) {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✓' : '✗'} ${file} ${exists ? '(existe)' : '(falta)'}`);
  if (!exists) allFilesExist = false;
}

if (!allFilesExist) {
  console.log('\n❌ Algunos archivos no existen\n');
  process.exit(1);
}

console.log('\n✓ Todos los archivos existen\n');

// Validar HTML
console.log('📄 Validando HTML...');
const html = fs.readFileSync(path.join(__dirname, files.html), 'utf-8');
const htmlChecks = {
  'DOCTYPE declarado': html.includes('<!DOCTYPE html>'),
  'Idioma español': html.includes('lang="es"'),
  'Meta charset UTF-8': html.includes('charset="UTF-8"'),
  'Meta viewport': html.includes('viewport'),
  'Link a CSS': html.includes('styles.css'),
  'Script de JS': html.includes('game.js'),
  'Elemento board': html.includes('id="board"'),
  'Elemento overlay': html.includes('id="overlay"'),
  'Elemento HUD': html.includes('id="hud"'),
};

for (const [check, passed] of Object.entries(htmlChecks)) {
  console.log(`  ${passed ? '✓' : '✗'} ${check}`);
}

// Validar CSS
console.log('\n🎨 Validando CSS...');
const css = fs.readFileSync(path.join(__dirname, files.css), 'utf-8');
const cssChecks = {
  'Estilos de cartas': css.includes('.card {'),
  'Animaciones': css.includes('@keyframes'),
  'Media queries': css.includes('@media'),
  'Grid layout': css.includes('display: grid'),
  'Flexbox': css.includes('display: flex'),
  'Accesibilidad (prefers-reduced-motion)': css.includes('prefers-reduced-motion'),
  'Focus visible': css.includes('focus-visible'),
};

for (const [check, passed] of Object.entries(cssChecks)) {
  console.log(`  ${passed ? '✓' : '✗'} ${check}`);
}

// Validar JavaScript
console.log('\n⚙️ Validando JavaScript...');
const js = fs.readFileSync(path.join(__dirname, files.js), 'utf-8');
const jsChecks = {
  'Modo estricto o ES6 modules': js.includes('use strict') || js.includes('class '),
  'Clase GameState': js.includes('class GameState'),
  'Clase UIManager': js.includes('class UIManager'),
  'Clase MemoryGame': js.includes('class MemoryGame'),
  'Clase ContentManager': js.includes('class ContentManager'),
  'Configuración exportada': js.includes('const CONFIG'),
  'DOMContentLoaded': js.includes('DOMContentLoaded'),
  'Comentarios en español': js.includes('/**') && js.includes('// '),
  'Async/await': js.includes('async '),
  'Try/catch': js.includes('try {'),
};

for (const [check, passed] of Object.entries(jsChecks)) {
  console.log(`  ${passed ? '✓' : '✗'} ${check}`);
}

// Estadísticas
console.log('\n📊 Estadísticas de código...');
console.log(`  HTML: ${html.length.toLocaleString()} caracteres, ${html.split('\n').length} líneas`);
console.log(`  CSS: ${css.length.toLocaleString()} caracteres, ${css.split('\n').length} líneas`);
console.log(`  JS: ${js.length.toLocaleString()} caracteres, ${js.split('\n').length} líneas`);

// Validar separación de responsabilidades
console.log('\n🔧 Validando arquitectura...');
const htmlHasInlineJS = html.includes('<script>') && !html.includes('<script src=');
const htmlHasInlineCSS = html.includes('<style>');

console.log(`  ${!htmlHasInlineJS ? '✓' : '✗'} Sin JavaScript inline en HTML`);
console.log(`  ${!htmlHasInlineCSS ? '✓' : '✗'} Sin CSS inline en HTML`);

// Verificar calidad del código
console.log('\n💎 Calidad del código...');
const hasComments = js.split('\n').filter(line => line.trim().startsWith('//')).length;
const hasFunctions = (js.match(/function /g) || []).length;
const hasClasses = (js.match(/class /g) || []).length;
const hasConstants = (js.match(/const /g) || []).length;

console.log(`  ✓ Comentarios: ${hasComments}`);
console.log(`  ✓ Funciones: ${hasFunctions}`);
console.log(`  ✓ Clases: ${hasClasses}`);
console.log(`  ✓ Constantes: ${hasConstants}`);

// Resultado final
console.log('\n' + '='.repeat(50));
const allPassed = Object.values(htmlChecks).every(v => v) && 
                  Object.values(cssChecks).every(v => v) && 
                  Object.values(jsChecks).every(v => v) &&
                  !htmlHasInlineJS && !htmlHasInlineCSS;

if (allPassed) {
  console.log('✅ TODAS LAS VALIDACIONES PASARON');
  console.log('🎉 El código está listo para producción');
} else {
  console.log('⚠️  ALGUNAS VALIDACIONES FALLARON');
  console.log('📝 Revisa los elementos marcados con ✗');
}
console.log('='.repeat(50) + '\n');

process.exit(allPassed ? 0 : 1);

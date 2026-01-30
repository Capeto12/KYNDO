#!/bin/bash

# Script para iniciar el backend de KYNDO
# =========================================

echo "🎮 KYNDO Backend - Script de Inicio"
echo "===================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Este script debe ejecutarse desde el directorio backend/"
    exit 1
fi

# Función para verificar si un servicio está corriendo
check_service() {
    if docker compose ps | grep -q "$1.*healthy"; then
        echo "✅ $1 está corriendo"
        return 0
    else
        return 1
    fi
}

# 1. Verificar Docker
echo "🔍 Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi
echo "✅ Docker encontrado"
echo ""

# 2. Verificar archivo .env
echo "🔍 Verificando configuración..."
if [ ! -f ".env" ]; then
    echo "⚠️  Archivo .env no encontrado. Creando desde .env.example..."
    cp .env.example .env
    echo "✅ Archivo .env creado. Revisa la configuración si es necesario."
else
    echo "✅ Archivo .env encontrado"
fi
echo ""

# 3. Verificar dependencias
echo "🔍 Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias npm..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error al instalar dependencias"
        exit 1
    fi
else
    echo "✅ Dependencias npm instaladas"
fi
echo ""

# 4. Iniciar servicios Docker
echo "🐳 Iniciando servicios Docker (PostgreSQL y Redis)..."
docker compose up -d
if [ $? -ne 0 ]; then
    echo "❌ Error al iniciar servicios Docker"
    exit 1
fi

# Esperar a que los servicios estén saludables
echo "⏳ Esperando a que los servicios estén listos..."
for i in {1..30}; do
    if check_service "postgres" && check_service "redis"; then
        break
    fi
    sleep 1
done

if ! check_service "postgres" || ! check_service "redis"; then
    echo "❌ Los servicios no iniciaron correctamente. Verifica con: docker compose ps"
    exit 1
fi
echo "✅ PostgreSQL y Redis están corriendo"
echo ""

# 5. Generar cliente Prisma
echo "🔧 Generando cliente Prisma..."
npm run prisma:generate > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Error al generar cliente Prisma"
    exit 1
fi
echo "✅ Cliente Prisma generado"
echo ""

# 6. Verificar si la base de datos necesita migraciones
echo "🗄️  Verificando migraciones de base de datos..."
if ! npm run prisma:migrate > /dev/null 2>&1; then
    echo "⚠️  Ejecutando migraciones de base de datos..."
    npm run prisma:migrate
fi
echo "✅ Base de datos sincronizada"
echo ""

# 7. Verificar si hay datos en la base de datos
echo "🌱 Verificando datos en la base de datos..."
CARD_COUNT=$(docker exec backend-postgres-1 psql -U kyndo -d kyndo -t -c "SELECT COUNT(*) FROM cards;" 2>/dev/null | tr -d ' ')
if [ "$CARD_COUNT" = "0" ] || [ -z "$CARD_COUNT" ]; then
    echo "📦 Base de datos vacía. Cargando datos de ejemplo..."
    npm run seed
    if [ $? -ne 0 ]; then
        echo "❌ Error al cargar datos de ejemplo"
        exit 1
    fi
    echo "✅ Datos de ejemplo cargados"
else
    echo "✅ La base de datos ya tiene $CARD_COUNT cartas"
fi
echo ""

# 8. Iniciar el servidor
echo "🚀 Iniciando servidor API..."
echo ""
echo "==============================================="
echo "🎯 Backend KYNDO iniciado correctamente!"
echo "==============================================="
echo ""
echo "📍 URL API: http://localhost:3000"
echo "🏥 Health check: http://localhost:3000/health"
echo "📖 Ejemplo: http://localhost:3000/api/cards/guacamaya-roja/presentation"
echo ""
echo "🔑 Para endpoints admin, usa el header:"
echo "   x-admin-key: dev-admin-key-change-in-production"
echo ""
echo "📝 Para detener el backend:"
echo "   - Presiona Ctrl+C"
echo "   - Luego ejecuta: docker compose down"
echo ""
echo "🔧 Para iniciar el worker en otra terminal:"
echo "   npm run worker"
echo ""
echo "==============================================="
echo ""

# Iniciar el servidor (esto bloqueará hasta Ctrl+C)
npm run dev

#!/bin/bash
set -e

echo "=== Configurando Red Ethereum con Proof of Stake ==="

# Detener contenedores previos
echo "Deteniendo contenedores anteriores..."
docker-compose down

# Limpiar datos anteriores 
echo "Limpiando datos anteriores..."
rm -rf data/node*/geth

# Generar cuentas
echo "Generando cuentas..."
npm run generate-accounts

# Generar JWT secreto
echo "Generando JWT secreto..."
./scripts/generate-jwt.sh

# Configurar la red
echo "Configurando la red..."
npm run setup-network

# Generar claves del validador
echo "Generando claves del validador..."
./scripts/generate-validator-keys.sh

# Exportar cuentas para Hardhat
echo "Exportando cuentas para Hardhat..."
npm run export-accounts

# Iniciar la red
echo "Iniciando la red..."
docker-compose up -d

# Esperar a que los nodos estén en funcionamiento
echo "Esperando a que los nodos estén en funcionamiento..."
sleep 10

# Conectar los nodos
echo "Conectando los nodos..."
./scripts/init-nodes.sh

echo "=== Red Ethereum con Proof of Stake configurada correctamente ==="
echo "Beacon Node API: http://localhost:5052"
echo "Execution Node API: http://localhost:8645" 
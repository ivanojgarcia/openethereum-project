#!/bin/bash
set -e

# Crear directorios si no existen
mkdir -p bootnode
mkdir -p data/node0
mkdir -p data/node1
mkdir -p data/node2
mkdir -p data/node3

# Generar clave para el bootnode si no existe
if [ ! -f bootnode/boot.key ]; then
  echo "Generando clave para el bootnode..."
  docker run --rm -v $PWD/bootnode:/data ethereum/client-go:stable --datadir=/data account new --password=/dev/null | grep -oP '0x\w+' > bootnode/address.txt
  echo "" > bootnode/password.txt
  docker run --rm -v $PWD/bootnode:/data ethereum/client-go:stable bootnode -genkey /data/boot.key
fi

# Obtener el ID del bootnode
BOOTNODE_KEY=$(cat bootnode/boot.key)
BOOTNODE_ID=$(docker run --rm -v $PWD/bootnode:/data ethereum/client-go:stable bootnode -nodekey /data/boot.key -writeaddress)

# Crear o actualizar archivo .env
echo "BOOTNODE_ID=$BOOTNODE_ID" > .env

# Configurar cuenta del validador para node0 si no existe
if [ ! -f data/node0/keystore ]; then
  echo "Generando cuenta para el nodo validador..."
  echo "password" > data/node0/password.txt
  VALIDATOR_ADDRESS=$(docker run --rm -v $PWD/data/node0:/data ethereum/client-go:stable --datadir=/data account new --password=/data/password.txt | grep -oP '0x\w+')
  echo "VALIDATOR_ADDRESS=$VALIDATOR_ADDRESS" >> .env
fi

echo "Inicialización completada. Variables de entorno guardadas en .env"
echo "Para iniciar la red, ejecuta: docker-compose up -d" 
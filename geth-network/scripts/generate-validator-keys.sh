#!/bin/bash
set -e

mkdir -p consensus-data/validator_keys

# Crear un archivo de contraseña para el validador
echo "password" > consensus-data/validator_password.txt

# Generar la clave del validador usando el cliente lighthouse
docker run --rm -v $(pwd)/consensus-data:/data sigp/lighthouse:latest \
  lighthouse \
  account validator create \
  --count 1 \
  --base-dir=/data \
  --password-file=/data/validator_password.txt

# Mostrar las claves generadas
echo "Claves de validador generadas en consensus-data/validator_keys"
ls -la consensus-data/validators || echo "No se encontraron claves, verifica el directorio." 
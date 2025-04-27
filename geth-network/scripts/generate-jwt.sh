#!/bin/bash
set -e

# Generar JWT secreto aleatorio de 32 bytes
JWT_SECRET=$(openssl rand -hex 32)
echo $JWT_SECRET > data/node0/jwtsecret

echo "JWT secret generated in data/node0/jwtsecret: $JWT_SECRET" 
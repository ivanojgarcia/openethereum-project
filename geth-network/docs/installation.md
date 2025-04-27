# Guía de Instalación de la Red Ethereum Privada

Esta guía detalla los pasos necesarios para desplegar y configurar una red Ethereum privada basada en Geth utilizando Docker, con soporte para Proof of Stake (PoS).

## Requisitos Previos

- Docker (versión 20.10.0 o superior)
- Docker Compose (versión 2.0.0 o superior)
- Node.js (v16.0.0 o superior)
- Git
- 8GB de RAM mínimo (16GB recomendado para configuración completa con cliente de consenso)
- 50GB de espacio libre en disco (SSD recomendado)

## Modos de Instalación

Esta red Ethereum privada puede configurarse en dos modos principales:

1. **Modo PoS sin cliente de consenso**: Ideal para desarrollo y pruebas. No genera nuevos bloques, pero permite interactuar con smart contracts en el bloque génesis.

2. **Modo PoS completo con cliente de consenso**: Configuración completa con Lighthouse como cliente de consenso y validadores. Genera bloques nuevos periódicamente.

## Instalación Rápida

### Modo PoS sin Cliente de Consenso (Recomendado para Desarrollo)

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/tokio-school-final-project.git
cd tokio-school-final-project/geth-network

# 2. Instalar dependencias
npm install

# 3. Configuración completa automatizada
npm run full-setup

# 4. Verificar que la red está funcionando
curl -X POST http://localhost:8645 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Modo PoS Completo con Cliente de Consenso

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/tokio-school-final-project.git
cd tokio-school-final-project/geth-network

# 2. Instalar dependencias
npm install

# 3. Configuración completa con cliente de consenso
npm run pos-setup

# 4. Verificar que la red está funcionando
curl -X POST http://localhost:8645 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## Instalación Manual Paso a Paso

Para entender mejor el proceso o personalizar la instalación, sigue estos pasos:

### 1. Preparación del Entorno

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/tokio-school-final-project.git
cd tokio-school-final-project/geth-network

# Instalar dependencias
npm install

# Limpiar cualquier configuración anterior
npm run clean
```

### 2. Generar Cuentas y JWT Secret

```bash
# Generar cuentas para los nodos
npm run generate-accounts

# Generar JWT secret para la comunicación entre cliente de ejecución y consenso
./scripts/generate-jwt.sh
```

### 3. Configurar el Archivo Genesis

El archivo genesis.template.json ya está configurado para PoS, pero puedes revisarlo:

```bash
# Ver la plantilla del genesis
cat genesis.template.json

# Generar el archivo genesis final con las cuentas generadas
npm run setup-network
```

### 4. Configurar Cliente de Consenso (opcional)

Para el modo PoS completo, necesitas generar claves de validador:

```bash
# Generar claves para validadores
./scripts/generate-validator-keys.sh
```

### 5. Exportar Cuentas para Hardhat

```bash
# Exportar cuentas y claves privadas para usar con herramientas de desarrollo
npm run export-accounts
```

### 6. Iniciar la Red

```bash
# Arrancar todos los servicios
npm run start

# Verificar que los servicios están en funcionamiento
docker ps
```

### 7. Conectar los Nodos

```bash
# Conectar los nodos entre sí
npm run connect-nodes
```

### 8. Verificar la Instalación

```bash
# Comprobar los balances de las cuentas predefinidas
npm run check-balances

# Ver los logs de los nodos
npm run logs
```

## Estructura de Directorios

Tras la instalación, se crearán los siguientes directorios:

```
geth-network/
├── bootnode/             # Datos del bootnode
│   ├── boot.key          # Clave privada del bootnode
│   └── boot.id           # ID del bootnode
├── data/                 # Datos de los nodos
│   ├── node0/            # Nodo principal/validador
│   │   └── keystore/     # Claves de las cuentas
│   ├── node1/            # Nodo adicional
│   ├── node2/            # Nodo adicional
│   └── rpc/              # Nodo con API RPC habilitada
├── consensus-data/       # Datos para el cliente de consenso (si está habilitado)
│   ├── validator_keys/   # Claves del validador
│   └── jwtsecret         # JWT secret para comunicación Engine API
└── .env                  # Variables de entorno generadas
```

## Personalización

### Configurar Parámetros del Genesis

El bloque génesis puede personalizarse editando `genesis.template.json` antes de ejecutar `npm run setup-network`. Los principales parámetros son:

- `chainId`: ID de la cadena (predeterminado: 1337)
- `gasLimit`: Límite de gas por bloque
- Balances iniciales en la sección `alloc`

### Ajustar Docker Compose

Para modificar la configuración de los contenedores, edita `docker-compose.yml`. Puedes:

- Cambiar la versión de Geth
- Modificar los parámetros de red (puertos, volúmenes)
- Ajustar los recursos asignados a cada contenedor

## Solución de Problemas

### Los Nodos No Se Conectan

1. Verifica que el bootnode esté funcionando correctamente:
   ```bash
   docker logs bootnode
   ```

2. Comprueba la conectividad entre nodos:
   ```bash
   docker exec eth-node0 geth --exec "admin.peers" attach /data/geth.ipc
   ```

### Error en el JWT Secret

Si hay problemas de comunicación con el cliente de consenso:

1. Verifica que el JWT secret sea idéntico en ambos clientes:
   ```bash
   cat ./data/node0/jwtsecret
   cat ./consensus-data/jwtsecret
   ```

2. Regenera el JWT secret si es necesario:
   ```bash
   ./scripts/generate-jwt.sh
   ```

### El Cliente de Consenso No Sincroniza

Si el cliente Lighthouse no sincroniza con el cliente de ejecución:

1. Verifica que el Engine API esté habilitado y accesible:
   ```bash
   curl -X POST http://localhost:8551 \
     -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}'
   ```

2. Revisa los logs del cliente beacon:
   ```bash
   docker logs beacon
   ```

## Interacción con la Red

### Conectar Metamask

1. Abrir Metamask y añadir una nueva red:
   - **Nombre de red**: Tokio School PoS
   - **URL de RPC**: http://localhost:8645
   - **Chain ID**: 1337
   - **Símbolo**: ETH

2. Importar una de las cuentas predefinidas usando su clave privada (disponible en el archivo generado por `npm run export-accounts`).

### Usar con Hardhat

Configura tu proyecto Hardhat para conectarse a la red local:

```typescript
// hardhat.config.ts
require('dotenv').config({ path: './.env.keys' });

module.exports = {
  networks: {
    local: {
      url: "http://localhost:8645",
      accounts: process.env.PRIVATE_KEYS.split(','),
      chainId: 1337
    }
  }
};
```

## Mantenimiento

### Detener la Red

```bash
npm run stop
```

### Reiniciar la Red

```bash
npm run restart
```

### Limpiar Todos los Datos

```bash
npm run clean
```

## Próximos Pasos

- Consulta la [Guía de Configuración](./configuration.md) para más opciones avanzadas
- Explora la [Arquitectura de Red](./network-architecture.md) para entender los componentes
- Revisa los [Comandos Útiles](./commands.md) para interactuar con la red
- Integra la red con el proyecto [Hero Tokio School DApp](../hero-tokio-school-dapp/) 
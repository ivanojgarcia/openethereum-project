# Red Privada Ethereum con Geth

Este proyecto configura una red privada Ethereum utilizando varios nodos Geth en contenedores Docker, con soporte para configuración en modo Proof of Stake (PoS).

## Componentes

- **Bootnode**: Nodo de descubrimiento para bootstrap
- **Node0**: Nodo validador/ejecución principal
- **Node1**: Nodo regular
- **Node2**: Nodo regular
- **RPC**: Nodo con API RPC/WS habilitada
- **Beacon** (opcional): Cliente de consenso Lighthouse para PoS
- **Validator** (opcional): Validador Lighthouse para PoS

## Requisitos

- Docker y Docker Compose
- Node.js
- Bash shell

## Modos de la Red

Este proyecto soporta dos modos de funcionamiento:

### 1. Modo PoS sin cliente de consenso activo (recomendado para desarrollo)

En este modo, la red está configurada en modo PoS pero no genera nuevos bloques. Es ideal para desarrollo y prueba de contratos inteligentes, ya que las transacciones se pueden enviar y ejecutar en el bloque génesis.

### 2. Modo PoS completo con cliente de consenso (experimental)

En este modo, se utiliza Lighthouse como cliente de consenso para generar bloques. Este modo está en desarrollo y puede requerir ajustes adicionales.

## Instrucciones de configuración rápida

Para configurar rápidamente la red en modo PoS sin cliente de consenso:

```bash
npm install
npm run clean
npm run full-setup
```

Para configurar la red en modo PoS con cliente de consenso (experimental):

```bash
npm install
npm run pos-setup
```

## Configuración paso a paso

Si prefieres ejecutar los pasos individualmente:

1. Primero, limpia cualquier configuración anterior:

```bash
npm run clean
```

2. Genera las cuentas para los nodos:

```bash
npm run generate-accounts
```

3. Genera el JWT secret necesario para la comunicación entre clientes de ejecución y consenso:

```bash
./scripts/generate-jwt.sh
```

4. Configura la red (crea el genesis.json y prepara los nodos):

```bash
npm run setup-network
```

5. Para PoS completo, genera las claves del validador (paso opcional):

```bash
./scripts/generate-validator-keys.sh
```

6. Exporta las cuentas para usar con Hardhat:

```bash
npm run export-accounts
```

7. Inicia la red:

```bash
npm run start
```

8. Conecta los nodos entre sí:

```bash
npm run connect-nodes
```

## Interacción con la red

La API JSON-RPC está disponible en:
- HTTP: http://localhost:8645
- WebSocket: ws://localhost:8646

Ejemplos para interactuar con la red usando curl:

```bash
# Obtener las cuentas disponibles
curl -X POST http://localhost:8645 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_accounts","params":[],"id":1}'

# Obtener el balance de una cuenta (formato hexadecimal de wei)
curl -X POST http://localhost:8645 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x8151b3D3aFca2ed904d55cA8dDD552404e1c36d0", "latest"],"id":1}'

# Obtener el número de bloque actual
curl -X POST http://localhost:8645 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

Ejemplo usando Web3.js:

```javascript
const Web3 = require('web3');
const web3 = new Web3('http://localhost:8645');

async function getAccounts() {
  const accounts = await web3.eth.getAccounts();
  console.log('Accounts:', accounts);
  
  const balance = await web3.eth.getBalance(accounts[0]);
  console.log('Balance of account 0:', web3.utils.fromWei(balance, 'ether'), 'ETH');
  
  const blockNumber = await web3.eth.getBlockNumber();
  console.log('Current block number:', blockNumber);
}

getAccounts();
```

## Verificación del estado de la red

Para comprobar que los nodos están conectados:

```bash
# Ver el número de peers conectados
docker exec eth-node0 geth --exec "admin.peers.length" attach /data/geth.ipc

# Ver información detallada de los peers
docker exec eth-node0 geth --exec "admin.peers" attach /data/geth.ipc
```

## Personalización del Bloque Génesis

El archivo `genesis.template.json` sirve como plantilla para configurar la cadena. Este proyecto utiliza un bloque génesis configurado para PoS con los siguientes parámetros importantes:

```json
{
  "config": {
    "chainId": 1337,
    "homesteadBlock": 0,
    ...
    "clique": {
      "period": 5,
      "epoch": 30000
    },
    "terminalTotalDifficulty": 0,
    "terminalTotalDifficultyPassed": true,
    "shanghaiTime": 0
  },
  ...
}
```

Los parámetros `terminalTotalDifficulty`, `terminalTotalDifficultyPassed` y `shanghaiTime` son necesarios para la compatibilidad con la versión actual de Geth que solo soporta redes PoS.

## Estructura de archivos

```
.
├── bootnode/                   # Datos del bootnode
│   ├── boot.key                # Clave privada del bootnode
│   └── boot.id                 # ID del bootnode
├── consensus-data/             # Datos para el cliente de consenso
│   ├── genesis.json            # Configuración del cliente de consenso
│   ├── validator_keys/         # Claves del validador
│   └── validator_password.txt  # Contraseña del validador
├── data/                       # Datos de los nodos de ejecución
│   ├── node0/                  # Datos del nodo validador
│   │   └── jwtsecret           # JWT secreto para comunicación con el cliente de consenso
│   ├── node1/                  # Datos del nodo 1
│   ├── node2/                  # Datos del nodo 2
│   └── node3/                  # Datos del nodo RPC
├── scripts/                    # Scripts de configuración
│   ├── generate-accounts.ts    # Genera cuentas para los nodos
│   ├── setup-network.ts        # Configura la red
│   ├── init-nodes.sh           # Conecta los nodos entre sí
│   ├── generate-jwt.sh         # Genera el JWT secreto
│   ├── generate-validator-keys.sh # Genera claves para el validador
│   └── setup-pos-network.sh    # Script completo para configurar en modo PoS
├── docker-compose.yml          # Configuración de Docker Compose
├── genesis.template.json       # Plantilla para el bloque génesis
└── .env                        # Variables de entorno (generado automáticamente)
```

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run generate-accounts` | Genera cuentas para los nodos |
| `npm run setup-network` | Configura la red (genesis, inicialización) |
| `npm run export-accounts` | Exporta las cuentas para usar con Hardhat |
| `npm run check-balances` | Verifica los balances de las cuentas |
| `npm run start` | Inicia los contenedores Docker |
| `npm run connect-nodes` | Conecta los nodos entre sí |
| `npm run stop` | Detiene los contenedores |
| `npm run restart` | Reinicia los contenedores |
| `npm run logs` | Muestra los logs de los contenedores |
| `npm run clean` | Limpia todos los datos y detiene los contenedores |
| `npm run full-setup` | Configuración completa en modo PoS sin cliente de consenso |
| `npm run pos-setup` | Configuración completa en modo PoS con cliente de consenso (experimental) |

## Notas importantes

1. La versión actual de Geth (v1.15.x) solo soporta redes PoS, por lo que el archivo genesis incluye los parámetros necesarios para este modo.
2. Para desarrollo y pruebas, la red funciona perfectamente en modo PoS sin cliente de consenso activo. En este modo, se pueden enviar transacciones y desplegar/interactuar con contratos, pero no se generan nuevos bloques.
3. Si necesitas una red que genere bloques, puedes:
   - Completar la configuración del cliente de consenso (Lighthouse)
   - O usar una versión anterior de Geth (v1.13.x) que aún soporta Clique (PoA)

## Documentación

Este proyecto incluye documentación detallada en el directorio `/docs`:

- [**Guía de Instalación**](docs/installation.md): Instrucciones detalladas para instalar y configurar la red Ethereum privada desde cero.
- [**Guía de Configuración**](docs/configuration.md): Descripción completa de todas las opciones de configuración disponibles para personalizar la red.
- [**Arquitectura de Red**](docs/network-architecture.md): Explicación detallada de los componentes y la arquitectura de la red Ethereum privada.
- [**Comandos Útiles**](docs/commands.md): Referencia de comandos para interactuar con la red, administrar nodos, monitorizar y resolver problemas.

## Integración con Hardhat

Para usar las cuentas de la red privada en tus proyectos Hardhat:

```bash
# Asegúrate de que la red esté en ejecución (docker-compose up -d)
npx ts-node scripts/export-accounts-for-hardhat.ts
```

Este script genera un archivo `.env.keys` con las claves privadas que puedes usar en tu configuración de Hardhat. 
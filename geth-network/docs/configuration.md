# Guía de Configuración de la Red Ethereum Privada

Este documento describe las opciones de configuración disponibles para personalizar la red Ethereum privada basada en Geth y cliente de consenso Lighthouse.

## Configuración del Genesis Block

El archivo `genesis.json` en la raíz del proyecto define la configuración inicial de la blockchain. Este archivo es crítico y debe configurarse correctamente antes de iniciar la red por primera vez.

### Parámetros Principales para Geth en Modo PoS

```json
{
  "config": {
    "chainId": 1337,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "berlinBlock": 0,
    "londonBlock": 0,
    "shanghaiTime": 0,
    "terminalTotalDifficulty": 0,
    "terminalTotalDifficultyPassed": true
  },
  "difficulty": "1",
  "gasLimit": "30000000",
  "extradata": "0x0000000000000000000000000000000000000000000000000000000000000000<VALIDATOR_ADDRESS>0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "alloc": {
    "<PREFUNDED_ADDRESS>": {
      "balance": "100000000000000000000"
    }
  }
}
```

### Parámetros PoS Específicos

| Parámetro | Descripción | Valores Recomendados |
|-----------|-------------|----------------------|
| `terminalTotalDifficulty` | Dificultad total en la que ocurre la fusión (The Merge) | 0 para empezar directamente en PoS |
| `terminalTotalDifficultyPassed` | Indica si ya se superó TTD | true para comenzar directamente en PoS |
| `shanghaiTime` | Timestamp para activar Shanghai | 0 para activar inmediatamente |

### Configuración para Clientes de Consenso

Para configuraciones que incluyen cliente de consenso (Lighthouse), se requiere un archivo de configuración de genesis adicional:

```json
{
  "config": {
    "chainId": 1337,
    "forkConfig": {
      "genesisTime": UNIX_TIMESTAMP,
      "genesisForkVersion": "0x00000000",
      "genesisValidatorsRoot": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    "depositContract": {
      "address": "0x0000000000000000000000000000000000000000",
      "chainId": 1337
    }
  }
}
```

## JWT Secret

Las actuales implementaciones de Ethereum requieren un JWT secret compartido entre el cliente de ejecución (Geth) y el cliente de consenso (Lighthouse). Este secreto debe ser idéntico en ambos clientes:

```bash
# Generar JWT secret
openssl rand -hex 32 > jwtsecret
```

## Configuración de Nodos

Cada nodo en la red puede personalizarse editando su sección correspondiente en el archivo `docker-compose.yml`.

### Bootnode

```yaml
bootnode:
  image: ethereum/client-go:v1.15.0
  command: >
    --nodekeyhex=<NODE_KEY_HEX>
    --netrestrict=172.16.254.0/24
    --nat=extip:172.16.254.100
    --verbosity=3
    --nodiscover
    --maxpeers=50
    --networkid=1337
```

| Parámetro | Descripción | Valores Recomendados |
|-----------|-------------|----------------------|
| `nodekeyhex` | Clave hexadecimal del nodo (para identidad estable) | Generar con `openssl rand -hex 32` |
| `netrestrict` | Restringe conexiones a rango de IPs específico | CIDR de la red Docker |
| `nat` | Configuración NAT | extip para especificar IP externa |
| `verbosity` | Nivel de detalle de logs | 1-5 (3 recomendado) |
| `nodiscover` | Deshabilita descubrimiento automático | true para redes privadas |
| `maxpeers` | Número máximo de conexiones | 25-100 dependiendo de la escala |

### Execution Node (Geth)

```yaml
node0:
  image: ethereum/client-go:v1.15.0
  command: >
    --datadir=/data
    --port=30303
    --bootnodes=enode://<BOOTNODE_ENODE>@bootnode:30301
    --networkid=1337
    --http
    --http.addr=0.0.0.0
    --http.port=8545
    --http.corsdomain=*
    --http.vhosts=*
    --ws
    --ws.addr=0.0.0.0
    --ws.port=8546
    --ws.origins=*
    --http.api=eth,net,web3,txpool,debug,personal,admin
    --ws.api=eth,net,web3,txpool,debug
    --syncmode=full
    --verbosity=3
    --authrpc.addr=0.0.0.0
    --authrpc.port=8551
    --authrpc.vhosts=*
    --authrpc.jwtsecret=/data/jwtsecret
```

| Parámetro | Descripción | Valores Recomendados |
|-----------|-------------|----------------------|
| `authrpc.addr` | Dirección para el Engine API | 0.0.0.0 para todos, 127.0.0.1 para local |
| `authrpc.port` | Puerto para el Engine API | 8551 (por defecto) |
| `authrpc.jwtsecret` | Ruta al archivo JWT secret | Debe coincidir con el cliente de consenso |

### Consensus Client (Lighthouse)

```yaml
beacon:
  image: sigp/lighthouse:latest
  command: >
    lighthouse bn
    --datadir=/data
    --network=custom
    --execution-endpoint=http://node0:8551
    --execution-jwt=/data/jwtsecret
    --discovery-port=9000
    --http
    --http-address=0.0.0.0
    --http-port=5052
    --eth1-endpoints=http://node0:8545
    --testnet-dir=/config
    --disable-deposit-contract-sync
```

| Parámetro | Descripción | Valores Recomendados |
|-----------|-------------|----------------------|
| `network` | Red a usar | custom para redes privadas |
| `execution-endpoint` | URL del nodo de ejecución | http://nombre-del-nodo:8551 |
| `execution-jwt` | Ruta al JWT secret | Debe coincidir con el nodo de ejecución |
| `testnet-dir` | Directorio de configuración de la testnet | Donde se encuentra genesis y configs |

### Validator Client (Lighthouse)

```yaml
validator:
  image: sigp/lighthouse:latest
  command: >
    lighthouse vc
    --datadir=/data
    --beacon-nodes=http://beacon:5052
    --graffiti="tokio-school"
    --testnet-dir=/config
    --suggested-fee-recipient=<FEE_RECIPIENT_ADDRESS>
```

| Parámetro | Descripción | Valores Recomendados |
|-----------|-------------|----------------------|
| `beacon-nodes` | URL del nodo beacon | http://beacon:5052 |
| `suggested-fee-recipient` | Dirección que recibirá las tarifas | Dirección ETH del beneficiario |

## Configuración del Docker Compose

El archivo `docker-compose.yml` define la configuración de los contenedores Docker y sus relaciones. Parámetros ajustables:

### Volúmenes

```yaml
volumes:
  - ./data/node0:/data
  - ./data/node1:/data
  - ./data/node2:/data
  - ./data/rpc:/data
  - ./consensus-data:/config:ro
```

Los volúmenes mapean directorios del host a directorios dentro de los contenedores, permitiendo persistencia de datos.

### Red Docker

```yaml
networks:
  ethereum_net:
    driver: bridge
    ipam:
      config:
        - subnet: 172.16.254.0/24
```

| Parámetro | Descripción | Valores Recomendados |
|-----------|-------------|----------------------|
| `driver` | Tipo de red Docker | bridge para la mayoría de casos |
| `subnet` | Rango de IPs para la red | Cualquier CIDR privado no utilizado |

### Recursos de Contenedores

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 1G
```

Añadir esta sección a cualquier servicio para limitar su uso de recursos.

## Scripts de Configuración Avanzados

### 1. Generación del JWT Secret

El script `scripts/generate-jwt.sh` genera el secreto JWT compartido:

```bash
#!/bin/bash

# Generar secreto JWT
SECRET=$(openssl rand -hex 32)
echo "$SECRET" > ./data/node0/jwtsecret
echo "$SECRET" > ./consensus-data/jwtsecret

echo "JWT secret generado y copiado a ambos directorios"
```

### 2. Generación de Claves de Validador

El script `scripts/generate-validator-keys.sh` facilita la creación de claves para validadores:

```bash
#!/bin/bash

# Configurar directorio y contraseña
mkdir -p ./consensus-data/validator_keys
echo "validatorpassword" > ./consensus-data/validator_password.txt

# Generar claves de depósito y validador
docker run --rm -it \
  -v $(pwd)/consensus-data:/data \
  sigp/lighthouse:latest \
  lighthouse account validator new \
  --testnet-dir=/data \
  --datadir=/data \
  --password-file=/data/validator_password.txt \
  --count=4
```

## Configuración para Desarrollo sin Cliente de Consenso

Para un entorno de desarrollo simplificado, puede usar Geth en modo PoS pero sin ejecutar un cliente de consenso:

```yaml
node0:
  image: ethereum/client-go:v1.15.0
  command: >
    --datadir=/data
    --port=30303
    --networkid=1337
    --http
    --http.addr=0.0.0.0
    --http.port=8545
    --http.corsdomain=*
    --http.vhosts=*
    --http.api=eth,net,web3,txpool,debug,personal,admin
    --syncmode=full
    --verbosity=3
    --authrpc.addr=0.0.0.0
    --authrpc.port=8551
    --authrpc.vhosts=*
    --authrpc.jwtsecret=/data/jwtsecret
    --allow-insecure-unlock
```

Esta configuración permite un nodo Geth en modo PoS sin producción activa de bloques, ideal para pruebas de contratos inteligentes en el bloque génesis.

## Consideraciones de Rendimiento

### Almacenamiento

- **SSD recomendado**: Para mejorar el rendimiento de I/O en la base de datos de estado
- **Espacio mínimo**: 20GB para pruebas, 100GB+ para producción
- **Ubicación de volúmenes**: Preferiblemente en discos locales, no en NFS o almacenamiento en red

### Memoria

- **Mínimo**: 4GB por nodo
- **Recomendado**: 8GB+ para nodos ejecutores y 6GB+ para nodos de consenso
- **Cache de Geth**: Ajustar `--cache` según RAM disponible (25% de la RAM total)

### CPU

- **Mínimo**: 2 cores por nodo
- **Recomendado**: 4+ cores para validadores y nodos beacon

## Resolución de Problemas

### Problemas Comunes en Configuración PoS

| Problema | Posible Causa | Solución |
|----------|--------------|----------|
| Error de JWT | JWT secreto incorrecto o no accesible | Verificar que el mismo JWT secret está en ambos clientes |
| Cliente de ejecución no sincroniza | Ausencia de cliente de consenso | Iniciar el cliente de consenso o configurar para desarrollo sin consenso |
| El cliente Beacon no se conecta | Error en Engine API | Verificar que authrpc esté correctamente configurado en Geth |
| No se producen bloques | Validadores no configurados | Verificar claves de validador y estado de activación |

## Referencia Rápida para la Red Tokio School

Para la red Ethereum de Tokio School, se recomienda:

- **ChainID**: 1337
- **Configuración Genesis**: Incluir todos los parámetros PoS necesarios
- **JWT Secret**: Compartido entre nodos de ejecución y consenso
- **Modo de Desarrollo**: Configurar la red sin cliente de consenso para facilitar pruebas

## Compatibilidad con Herramientas de Desarrollo

### Hardhat

Para configurar Hardhat con nuestra red privada:

```typescript
// hardhat.config.ts
export default {
  networks: {
    local: {
      url: "http://localhost:8545",
      accounts: [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Cuentas predefinidas
        // ... otras claves privadas
      ],
      chainId: 1337
    }
  }
};
```

### Metamask

Para conectar Metamask a la red privada:

1. Abrir Metamask
2. Añadir Red
   - Nombre: Tokio School PoS
   - URL RPC: http://localhost:8545
   - ChainID: 1337
   - Símbolo: ETH 
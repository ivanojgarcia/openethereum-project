# Guía de Configuración de la Red Ethereum Privada

Este documento describe las opciones de configuración disponibles para personalizar la red Ethereum privada basada en Geth.

## Configuración del Genesis Block

El archivo `genesis.json` en la raíz del proyecto define la configuración inicial de la blockchain. Este archivo es crítico y debe configurarse antes de iniciar la red por primera vez.

### Parámetros Principales

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
    "clique": {
      "period": 5,
      "epoch": 30000
    }
  },
  "difficulty": "1",
  "gasLimit": "8000000",
  "extradata": "0x0000000000000000000000000000000000000000000000000000000000000000<VALIDATOR_ADDRESS>0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "alloc": {
    "<PREFUNDED_ADDRESS>": {
      "balance": "100000000000000000000"
    }
  }
}
```

### Explicación de los Parámetros

| Parámetro | Descripción | Valores Recomendados |
|-----------|-------------|----------------------|
| `chainId` | Identificador único de la red | 1337 para desarrollo, cualquier valor no utilizado por redes públicas |
| `period` | Tiempo objetivo entre bloques (segundos) | 5-15 para desarrollo, >5 para producción |
| `epoch` | Número de bloques tras los cuales se aplican reglas de votación | 30000 (valor por defecto) |
| `gasLimit` | Límite máximo de gas por bloque | 8000000 - 30000000 |
| `extradata` | Dirección del validador inicial (con padding) | Formato: 0x + 32 bytes zeros + dirección validador de 20 bytes + 65 bytes zeros |
| `alloc` | Cuentas pre-financiadas y sus balances | Direcciones de prueba con balances en wei |

## Configuración de Nodos

Cada nodo en la red puede personalizarse editando su sección correspondiente en el archivo `docker-compose.yml`.

### Bootnode

```yaml
bootnode:
  image: ethereum/client-go:stable
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

### Validator Node

```yaml
validator:
  image: ethereum/client-go:stable
  command: >
    --datadir=/data
    --port=30303
    --bootnodes=enode://<BOOTNODE_ENODE>@bootnode:30301
    --networkid=1337
    --unlock=<VALIDATOR_ADDRESS>
    --password=/data/password.txt
    --mine
    --miner.etherbase=<VALIDATOR_ADDRESS>
    --allow-insecure-unlock
    --syncmode=full
    --gcmode=archive
    --verbosity=3
```

| Parámetro | Descripción | Valores Recomendados |
|-----------|-------------|----------------------|
| `unlock` | Dirección de la cuenta a desbloquear | Dirección del validador |
| `password` | Archivo con la contraseña para desbloquear | Ruta al archivo de contraseña |
| `mine` | Activa la validación (minado) | Requerido para validadores |
| `miner.etherbase` | Cuenta que recibirá recompensas | Misma que `unlock` |
| `syncmode` | Modo de sincronización | full o archive |
| `gcmode` | Modo de recolección de basura | archive para histórico completo |

### RPC Node

```yaml
rpc:
  image: ethereum/client-go:stable
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
```

| Parámetro | Descripción | Valores Recomendados |
|-----------|-------------|----------------------|
| `http` | Habilita servidor HTTP-RPC | Requerido para API HTTP |
| `http.addr` | Dirección de escucha HTTP-RPC | 0.0.0.0 para todos, 127.0.0.1 para local |
| `http.corsdomain` | Dominios permitidos para CORS | * para desarrollo, lista específica para producción |
| `http.vhosts` | Hosts virtuales permitidos | * para desarrollo, lista específica para producción |
| `http.api` | Módulos API habilitados | eth,net,web3 mínimo, añadir más según necesidad |
| `ws` | Habilita servidor WebSocket | Requerido para eventos |
| `ws.origins` | Orígenes permitidos para WebSocket | * para desarrollo, lista específica para producción |

## Configuración del Docker Compose

El archivo `docker-compose.yml` define la configuración de los contenedores Docker y sus relaciones. Parámetros ajustables:

### Volúmenes

```yaml
volumes:
  - ./bootnode:/data
  - ./validator:/data
  - ./node1:/data
  - ./node2:/data
  - ./rpc:/data
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

## Variables de Entorno

El archivo `.env` (que debe crearse) puede contener variables utilizadas en el `docker-compose.yml`:

```
GETH_VERSION=stable
NETWORK_ID=1337
BOOTNODE_KEY=<GENERATED_KEY>
VALIDATOR_ADDRESS=<VALIDATOR_ETH_ADDRESS>
```

## Scripts de Configuración

### 1. Generador de Genesis

El script `scripts/generate-genesis.sh` puede personalizar el archivo genesis:

```bash
#!/bin/bash
# Uso: ./generate-genesis.sh <chain_id> <periodo_bloques> <direccion_validador>

CHAIN_ID=${1:-1337}
BLOCK_PERIOD=${2:-5}
VALIDATOR_ADDR=${3:-"0x0000000000000000000000000000000000000000"}

# Strip '0x' prefix if present
VALIDATOR_ADDR=$(echo $VALIDATOR_ADDR | sed 's/^0x//')

cat > genesis.json << EOF
{
  "config": {
    "chainId": $CHAIN_ID,
    ...
```

### 2. Creador de Cuentas

El script `scripts/create-account.sh` para generar nuevas cuentas:

```bash
#!/bin/bash
# Uso: ./create-account.sh <nodo> <contraseña>

NODE_DIR=${1:-"validator"}
PASSWORD=${2:-"password"}

# Crea directorio si no existe
mkdir -p $NODE_DIR/keystore

# Crea archivo de contraseña
echo $PASSWORD > $NODE_DIR/password.txt

# Genera nueva cuenta
docker run --rm -v $(pwd)/$NODE_DIR:/data ethereum/client-go:stable \
  account new --datadir=/data --password=/data/password.txt
```

## Consideraciones de Rendimiento

### Almacenamiento

- **SSD recomendado**: Para mejorar el rendimiento de I/O en la base de datos de estado
- **Espacio mínimo**: 20GB para pruebas, 100GB+ para producción
- **Ubicación de volúmenes**: Preferiblemente en discos locales, no en NFS o almacenamiento en red

### Memoria

- **Mínimo**: 4GB por nodo
- **Recomendado**: 8GB+ para nodos validadores y RPC
- **Cache de Geth**: Ajustar `--cache` según RAM disponible (25% de la RAM total)

### CPU

- **Mínimo**: 2 cores por nodo
- **Recomendado**: 4+ cores para validadores

## Configuración para Producción

Para entornos de producción, se recomienda ajustar estos parámetros adicionales:

### Seguridad

```yaml
rpc:
  command: >
    # Configuración base...
    --http.addr=127.0.0.1
    --http.vhosts=yourdomain.com
    --http.corsdomain=https://yourdapp.com
    --ws.origins=https://yourdapp.com
    --authrpc.addr=127.0.0.1
    --authrpc.port=8551
    --authrpc.vhosts=localhost
    --ipcdisable
```

### Alta Disponibilidad

Para configuraciones de alta disponibilidad, considere:

1. **Múltiples nodos RPC** detrás de un balanceador de carga
2. **Múltiples validadores** con configuración adecuada en el genesis
3. **Monitorización** con herramientas como Prometheus/Grafana

## Resolución de Problemas

### Problemas Comunes de Configuración

| Problema | Posible Causa | Solución |
|----------|--------------|----------|
| Nodos no se conectan | Bootnode inaccesible | Verificar enode correcto y puertos abiertos |
| Error de genesis | Genesis diferente entre nodos | Reinicializar todos los nodos con el mismo genesis |
| Validador no mina | Cuenta no desbloqueada | Verificar path de password y dirección correcta |
| RPC inaccesible | Configuración de firewall | Verificar http.addr y puertos expuestos |

## Configuración Recomendada por Caso de Uso

### Desarrollo y Pruebas

```yaml
validator:
  command: >
    # Configuración base...
    --dev.period=1
    --miner.gasprice=0
    --txpool.pricelimit=0
```

### Red Privada Corporativa

```yaml
validator:
  command: >
    # Configuración base...
    --identity="CompanyValidator"
    --gcmode=archive
    --miner.recommit=2s
    --metrics
    --metrics.addr=0.0.0.0
    --metrics.port=6060
```

### Red de Demostración

```yaml
validator:
  command: >
    # Configuración base...
    --miner.gastarget=6000000
    --miner.gasprice=1
    --txpool.accountslots=16
    --txpool.globalslots=10000
``` 
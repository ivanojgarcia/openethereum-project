# Arquitectura de la Red Ethereum Privada

Este documento describe la arquitectura y componentes de nuestra red Ethereum privada basada en Geth (Go Ethereum).

## Visión General

La red está diseñada como una implementación Proof of Authority (PoA) de Ethereum, optimizada para entornos de desarrollo y pruebas. Utiliza el algoritmo de consenso Clique, que permite una generación de bloques más rápida y eficiente energéticamente que el Proof of Work (PoW) tradicional.

![Arquitectura de la Red](../assets/network-architecture.png)

## Componentes Principales

### 1. Bootnode
- **Propósito**: Facilita el descubrimiento de nodos en la red
- **Especificaciones**:
  - No participa en el consenso o validación
  - No almacena la blockchain completa
  - Mantiene una tabla de descubrimiento de nodos (DHT)
- **Configuración**:
  - Puerto UDP: 30301 (para descubrimiento)

### 2. Nodos Validadores
- **Propósito**: Validan transacciones y producen nuevos bloques
- **Especificaciones**:
  - Ejecutan el algoritmo de consenso Clique PoA
  - Almacenan la blockchain completa
  - Procesan transacciones y ejecutan contratos inteligentes
- **Configuración**:
  - Puerto TCP/UDP: 30303 (para comunicación P2P)
  - Cuenta Ethereum autorizada para sellar bloques
  - Configuración especial en el bloque genesis (`extraData`)

### 3. Nodos Completos (Full Nodes)
- **Propósito**: Participan en la red y mantienen una copia completa de la blockchain
- **Especificaciones**:
  - Verifican todas las transacciones y bloques
  - No participan en la validación (minado)
  - Proporcionan redundancia y resiliencia a la red
- **Configuración**:
  - Puerto TCP/UDP: 30303 (para comunicación P2P)
  - Sincronización completa de la blockchain

### 4. Nodo RPC
- **Propósito**: Proporciona una interfaz JSON-RPC para aplicaciones externas
- **Especificaciones**:
  - Expone APIs para interactuar con la blockchain
  - Permite la integración con DApps, wallets y otras herramientas
  - Gestiona cuentas locales y firma transacciones
- **Configuración**:
  - Puerto HTTP: 8545 (para solicitudes JSON-RPC)
  - Puerto WebSocket: 8546 (para suscripciones y eventos)
  - APIs habilitadas: eth, net, web3, personal, admin, miner, txpool

## Flujo de Datos

1. **Descubrimiento de Nodos**:
   - Los nodos se conectan inicialmente al bootnode
   - El bootnode proporciona información sobre otros nodos en la red
   - Los nodos establecen conexiones P2P directas entre sí

2. **Propagación de Transacciones**:
   - Las transacciones se envían inicialmente al nodo RPC
   - El nodo RPC las verifica y las propaga a la red P2P
   - Todos los nodos mantienen un mempool de transacciones pendientes

3. **Consenso y Creación de Bloques**:
   - Los nodos validadores seleccionan transacciones del mempool
   - Crean nuevos bloques según el algoritmo de rotación de Clique
   - Firman los bloques con su clave privada
   - Propagan los bloques sellados a toda la red

4. **Validación y Sincronización**:
   - Todos los nodos verifican la validez de los bloques recibidos
   - Verifican la firma del validador y las transacciones incluidas
   - Actualizan su estado local y procesan los contratos inteligentes
   - Propagan los bloques validados a sus pares

## Estructura de Directorios

```
geth-network/
├── bootnode/            # Datos y configuración del bootnode
├── validator/           # Datos y configuración del nodo validador
├── node1/               # Datos y configuración del primer nodo completo
├── node2/               # Datos y configuración del segundo nodo completo
├── rpc/                 # Datos y configuración del nodo RPC
├── docker-compose.yml   # Configuración de contenedores Docker
├── genesis.json         # Configuración del bloque génesis
└── scripts/             # Scripts de utilidad y automatización
```

## Configuración del Bloque Génesis

El archivo `genesis.json` define el estado inicial de la blockchain, incluyendo:

- **chainId**: Identificador único de la red (1337)
- **consensusType**: Algoritmo de consenso (Clique PoA)
- **period**: Tiempo objetivo entre bloques (5 segundos)
- **extraData**: Lista de validadores iniciales
- **alloc**: Cuentas pre-financiadas y sus saldos iniciales

## Seguridad

- **Nodos Autorizados**: Solo los nodos validadores pueden crear bloques
- **Firewalls**: Los contenedores Docker exponen solo los puertos necesarios
- **RPC Seguro**: El nodo RPC solo acepta conexiones desde hosts específicos
- **Separación de Responsabilidades**: Diferentes nodos para diferentes funciones

## Escalabilidad

La arquitectura permite escalar horizontalmente añadiendo:

1. **Más nodos completos**: Para aumentar la resiliencia y capacidad de servicio
2. **Más nodos validadores**: Para mejorar la descentralización del consenso
3. **Nodos RPC adicionales**: Para balancear la carga de solicitudes externas

## Limitaciones

- **Rendimiento**: El tiempo entre bloques está limitado a 5 segundos
- **Centralización**: Un número limitado de validadores controla la red
- **Carga**: El procesamiento de contratos inteligentes está limitado por los recursos de los nodos

## Consideraciones para Producción

Para entornos de producción, considerar:

1. **Autenticación RPC**: Implementar JWT o autenticación TLS para endpoints RPC
2. **Monitorización**: Añadir herramientas como Prometheus y Grafana
3. **Backups**: Configurar copias de seguridad periódicas de los datos de los nodos
4. **Alta Disponibilidad**: Implementar redundancia a nivel de hosts y contenedores 
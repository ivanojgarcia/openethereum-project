# Configuración de Red Geth Local

Este documento describe la configuración de la red Geth local utilizada en el proyecto Hero Tokio School DApp, así como las mejores prácticas para interactuar con ella.

## Estructura de la Red

La red Geth local está configurada con múltiples nodos en Docker:

```
docker ps
CONTAINER ID   IMAGE                       COMMAND                  CREATED          STATUS          PORTS                                                                  NAMES
ad14023d43d8   ethereum/client-go:stable   "geth --datadir=/dat…"   39 minutes ago   Up 39 minutes   30303/tcp, 30303/udp, 0.0.0.0:8645->8545/tcp, 0.0.0.0:8646->8546/tcp   eth-rpc
4c346977d273   ethereum/client-go:stable   "geth --datadir=/dat…"   39 minutes ago   Up 39 minutes   8545-8546/tcp, 30303/tcp, 30303/udp                                    eth-node2
386bea3fe02d   ethereum/client-go:stable   "geth --datadir=/dat…"   39 minutes ago   Up 39 minutes   8545-8546/tcp, 30303/tcp, 30303/udp                                    eth-node1
5be43b2d0b5f   ethereum/client-go:stable   "geth --datadir=/dat…"   39 minutes ago   Up 39 minutes   8545-8546/tcp, 30303/udp, 0.0.0.0:30303->30303/tcp                     eth-node0
79ee95ac5eb6   ethereum/client-go:stable   "geth --datadir=/dat…"   39 minutes ago   Up 39 minutes   8545-8546/tcp, 30303/tcp, 30303/udp
```

### Componentes de la Red

- **eth-rpc**: Nodo RPC principal que expone los puertos 8645 (HTTP) y 8646 (WebSocket) para interactuar con la red.
- **eth-node0, eth-node1, eth-node2**: Nodos validadores que participan en el consenso de la red.
- **Puertos**: El puerto principal para RPC es 8645 (mapeado desde el puerto 8545 interno del contenedor).

### Parámetros de Red

- **ChainID**: 1337 (estándar para redes de desarrollo locales)
- **Moneda**: ETH (18 decimales)
- **Algoritmo de Consenso**: PoA (Proof of Authority)

## Configuración en Hardhat

La configuración de Hardhat para interactuar con esta red está definida en `hardhat.config.ts`:

```typescript
export const gethChain = defineChain({
  id: 1337,
  name: 'Geth Local Network',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8645'] },
    ws: { http: ['http://127.0.0.1:8646'] },
  },
});

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    gethNetwork: {
      url: "http://127.0.0.1:8645",
      chainId: 1337,
      accounts,
      timeout: 60000,
      gas: 5000000,
      gasPrice: 1000000000, // 1 gwei
      gasMultiplier: 1.5,
      blockGasLimit: 30000000
    },
    hardhat: {
      chainId: 31337,
    }
  }
};
```

## Cuentas Predefinidas

La red se inicializa con varias cuentas que tienen un saldo inicial de 300 ETH cada una:

```
Account balances:
0x9b5fcbf8fb6ebda17f1bd4076639d844077c8c83: 300 ETH
0xefdbcf94db292238b237b71e9729cd1829328685: 300 ETH
0x6a49525f1711e55c923a69ed0e1f646097fe1929: 300 ETH
0x82fef923be23dbc27aad94bea947da068a364c10: 300 ETH
```

Estas cuentas están definidas por sus claves privadas en el archivo `.env`:

```
NODE0_PK=...
NODE1_PK=...
NODE2_PK=...
RPC_PK=...
```

## Interacción con la Red

### Usando Hardhat

```bash
# Compilar contratos
npx hardhat compile

# Desplegar contratos usando Ignition
npx hardhat ignition deploy ignition/modules/Lock.ts --network gethNetwork --deployment-id [deployment-id]

# Verificar balances de cuentas
npx hardhat balances --network gethNetwork

# Listar cuentas disponibles
npx hardhat accounts --network gethNetwork
```

### Usando RPC Directamente

También se puede interactuar con la red directamente a través de la API JSON-RPC:

```bash
# Obtener balance de una cuenta
curl -X POST http://127.0.0.1:8645 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x9b5fcbf8fb6ebda17f1bd4076639d844077c8c83", "latest"],"id":1}'

# Obtener número de bloque actual
curl -X POST http://127.0.0.1:8645 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## Mejores Prácticas

### Gestión de la Red

1. **Monitoreo de nodos**: Verificar periódicamente el estado de los nodos para asegurar que la red está funcionando correctamente.
   ```bash
   docker ps
   docker logs eth-rpc
   ```

2. **Reinicio de nodos**: Si un nodo presenta problemas, puede ser reiniciado sin afectar al resto de la red:
   ```bash
   docker restart eth-rpc
   ```

3. **Respaldo de datos**: Realizar respaldos periódicos de los directorios de datos si se requiere persistencia.

### Desarrollo

1. **Prueba local antes de testnet**: Siempre probar los contratos en la red local antes de desplegarlos en testnets o mainnet.

2. **Gestión de Gas**: Utilizar configuraciones de gas apropiadas para la red local:
   ```typescript
   {
     gas: 5000000,
     gasPrice: 1000000000, // 1 gwei
     gasMultiplier: 1.5
   }
   ```

3. **Separación de despliegues**: Utilizar IDs de despliegue diferentes para cada versión o entorno:
   ```bash
   npx hardhat ignition deploy ... --deployment-id dev-v1
   npx hardhat ignition deploy ... --deployment-id test-v1
   ```

4. **Documentación de despliegues**: Mantener un registro de todos los contratos desplegados, sus direcciones y parámetros.

## Solución de Problemas Comunes

### Error de Conexión RPC

Si se experimenta un error de conexión RPC, verificar:
- El estado del contenedor `eth-rpc`
- La correcta configuración de puertos
- Posibles conflictos de puertos con otras aplicaciones

### Errores de Estimación de Gas

Para resolver errores de estimación de gas:
- Incrementar el valor de `gas` y `gasMultiplier` en la configuración
- Verificar que la cuenta tiene suficiente ETH
- Simplificar el contrato o la transacción si es muy compleja

### Problemas de Nonce

Si hay errores relacionados con nonces de transacciones:
- Reiniciar la cuenta en Metamask (si se usa para pruebas)
- Verificar que no haya transacciones pendientes

## Referencias

- [Documentación oficial de Geth](https://geth.ethereum.org/docs/)
- [Hardhat Ignition](https://hardhat.org/ignition/docs/overview)
- [API JSON-RPC de Ethereum](https://eth.wiki/json-rpc/API) 
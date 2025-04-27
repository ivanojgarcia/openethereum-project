# Bitácora de Resolución de Errores - Hero Tokio School DApp

Este documento registra los errores encontrados durante el desarrollo del proyecto, sus causas y las soluciones implementadas. Sirve como referencia para futuros desarrolladores o para situaciones similares que puedan surgir.

## Índice

- [Configuración de la Red Geth Local](#configuración-de-la-red-geth-local)
- [Problemas con Hardhat Ignition](#problemas-con-hardhat-ignition)
- [Errores de Estimación de Gas](#errores-de-estimación-de-gas)
- [Problemas de Conectividad entre Nodos en Red Privada](#problemas-de-conectividad-entre-nodos-en-red-privada)

## Configuración de la Red Geth Local

### Problema

La configuración inicial de Hardhat no estaba correctamente alineada con la red Geth local que se ejecuta en Docker:

```
docker ps
CONTAINER ID   IMAGE                       COMMAND                  CREATED          STATUS          PORTS                                                                  NAMES
ad14023d43d8   ethereum/client-go:stable   "geth --datadir=/dat…"   39 minutes ago   Up 39 minutes   30303/tcp, 30303/udp, 0.0.0.0:8645->8545/tcp, 0.0.0.0:8646->8546/tcp   eth-rpc
4c346977d273   ethereum/client-go:stable   "geth --datadir=/dat…"   39 minutes ago   Up 39 minutes   8545-8546/tcp, 30303/tcp, 30303/udp                                    eth-node2
386bea3fe02d   ethereum/client-go:stable   "geth --datadir=/dat…"   39 minutes ago   Up 39 minutes   8545-8546/tcp, 30303/tcp, 30303/udp                                    eth-node1
5be43b2d0b5f   ethereum/client-go:stable   "geth --datadir=/dat…"   39 minutes ago   Up 39 minutes   8545-8546/tcp, 30303/udp, 0.0.0.0:30303->30303/tcp                     eth-node0
79ee95ac5eb6   ethereum/client-go:stable   "geth --datadir=/dat…"   39 minutes ago   Up 39 minutes   8545-8546/tcp, 30303/tcp, 30303/udp
```

Los puertos mapeados en los contenedores no coincidían con los configurados en `hardhat.config.ts`.

### Solución

Actualizamos la configuración de Hardhat para reflejar correctamente los puertos y la configuración de la red Geth:

```typescript
// hardhat.config.ts
export const gethChain = defineChain({
  id: 1337,  // Actualizado de 17 a 1337 para coincidir con la red Geth
  name: 'Geth Local Network',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8645'] },  // Puerto actualizado de 8545 a 8645
    ws: { http: ['http://127.0.0.1:8646'] },       // WebSocket en puerto 8646
  },
});

// Configuración de la red
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
  }
}
```

### Mejores Prácticas

- **Verificar la configuración de los contenedores Docker**: Siempre verificar los puertos mapeados y la configuración de red en los contenedores Docker antes de configurar la conexión en Hardhat.
- **Consistencia en chainId**: Asegurarse de que el chainId en la configuración de Hardhat coincida con el chainId de la red Geth.
- **Documentar la configuración**: Mantener documentada la configuración de red, especialmente cuando se utilizan múltiples nodos.

## Problemas con Hardhat Ignition

### Problema

Al intentar desplegar un contrato con Hardhat Ignition, se presentó el siguiente error:

```
npx hardhat ignition deploy ignition/modules/Lock.ts --network gethNetwork --deployment-id gethNetwork-deployment
✔ Confirm deploy to network gethNetwork (1337)? … yes
[ LockModule ] reconciliation failed ⛔

The module contains changes to executed futures:

LockModule#Lock:
 - From account has been changed from 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 to 0x9b5fcbf8fb6ebda17f1bd4076639d844077c8c83

Consider modifying your module to remove the inconsistencies with deployed futures.
```

Este error ocurre porque Ignition detecta que estamos intentando redesplegar un módulo con la misma ID de despliegue pero desde una cuenta diferente.

### Solución

Existen varias opciones para solucionar este problema:

1. **Usar una ID de despliegue diferente**:
   ```bash
   npx hardhat ignition deploy ignition/modules/Lock.ts --network gethNetwork --deployment-id nuevo-despliegue
   ```

2. **Limpiar el estado del futuro específico**:
   ```bash
   npx hardhat ignition wipe gethNetwork-v1 LockModule#Lock
   ```
   Esto limpia el estado del futuro específico, permitiendo redesplegar el módulo.

3. **Forzar el despliegue** (no recomendado para producción, sólo para desarrollo):
   ```bash
   npx hardhat ignition deploy ignition/modules/Lock.ts --network gethNetwork --deployment-id gethNetwork-deployment --force
   ```

### Mejores Prácticas

- **Usar IDs de despliegue significativos**: Estructurar las IDs de despliegue para incluir información sobre el entorno, versión o propósito.
- **Gestionar despliegues por entorno**: Utilizar diferentes IDs de despliegue para diferentes entornos (desarrollo, prueba, producción).
- **Registrar despliegues**: Mantener un registro de los despliegues realizados con sus respectivas IDs y estado.

## Errores de Estimación de Gas

### Problema

Al intentar desplegar el contrato Lock usando Ignition, se encontró un error de estimación de gas:

```
npx hardhat ignition deploy ignition/modules/Lock.ts --network gethNetwork --deployment-id gethNetwork-v1
✔ Confirm deploy to network gethNetwork (1337)? … yes
Hardhat Ignition 🚀

Deploying [ LockModule ]

Batch #1
  Executing LockModule#Lock...

An unexpected error occurred:

IgnitionError: IGN410: Gas estimation failed: method handler crashed
```

Esto puede ocurrir debido a varias razones: configuración incorrecta de gas, problemas con el nodo Geth, o incompatibilidades en la configuración.

### Solución

Se implementaron varias mejoras para resolver el problema:

1. **Actualización de configuración de gas en hardhat.config.ts**:
   ```typescript
   networks: {
     gethNetwork: {
       url: "http://127.0.0.1:8645",
       chainId: 1337,
       accounts,
       timeout: 60000,
       gas: 5000000,            // Valor explícito de gas
       gasPrice: 1000000000,    // 1 gwei
       gasMultiplier: 1.5,      // Multiplicador para evitar subestimaciones
       blockGasLimit: 30000000  // Límite máximo de gas por bloque
     }
   }
   ```

2. **Limpieza del estado del despliegue**:
   ```bash
   npx hardhat ignition wipe gethNetwork-v1 LockModule#Lock
   ```

3. **Simplificación del módulo de Ignition**:
   Mantuvimos el módulo lo más simple posible, evitando configuraciones de gas adicionales que pudieran entrar en conflicto:
   ```typescript
   const lock = m.contract("Lock", [unlockTime], {
     value: lockedAmount
   });
   ```

### Mejores Prácticas

- **Configuración explícita de gas**: Especificar valores explícitos para gas, gasPrice y otros parámetros relacionados con el gas.
- **Incrementar timeout para redes de desarrollo**: Aumentar los timeouts para redes locales o de desarrollo donde el tiempo de minado puede ser variable.
- **Monitor de gas**: Implementar monitoreo de gas para detectar problemas de estimación o costos elevados.
- **Gestión de versiones de los contratos**: Mantener un sistema de versionado claro para los contratos y sus despliegues.

## Problemas de Conectividad entre Nodos en Red Privada

### Problema

El problema principal consistía en errores de conectividad entre los nodos de la red Ethereum privada:

- **Mensajes de error**: "Bootstrap node filtered by netrestrict" en los logs de los nodos.
- **Conexión fallida**: Los nodos no lograban conectarse entre sí debido a la restricción de red (`--netrestrict=172.16.239.0/24`).
- **Fallo en la inicialización**: Durante la ejecución de `init-nodes.sh`, los contenedores no estaban listos o en ejecución.

### Solución

La solución se implementó en tres partes clave:

1. **Configuración de bootnode**:
   - Agregamos la variable `BOOTNODE_ID` al archivo `.env`.
   - Utilizamos un ID estático de bootnode válido en `setup-network.ts`.
   - Configuramos cada nodo con el parámetro `--bootnodes=enode://${BOOTNODE_ID}@172.16.239.10:30301`.

2. **Mejora en el script de inicialización**:
   - Modificamos `init-nodes.sh` para verificar que cada nodo esté realmente en ejecución.
   - Implementamos comprobaciones tanto para el estado del contenedor como para la disponibilidad de IPC.
   - Añadimos reintentos con un número máximo de intentos.

3. **Conexión entre nodos**:
   - Configuramos conexiones explícitas entre los nodos y el bootnode.
   - Establecimos conexiones adicionales entre el nodo validador y los demás nodos.
   - Verificamos las conexiones entre pares después de la inicialización.

Como resultado, los nodos ahora establecen conexiones correctamente dentro de la red privada Ethereum, permitiendo que funcione el consenso y la sincronización entre los nodos.

### Mejores Prácticas

- **Uso de IDs de bootnode estáticos**: Garantiza que las direcciones enode sean consistentes entre reinicios.
- **Verificación de estado de nodos**: Implementar comprobaciones robustas para confirmar que los nodos estén operativos antes de intentar conexiones.
- **Monitoreo de conexiones**: Agregar herramientas para monitorear el estado de las conexiones entre nodos en tiempo real.
- **Documentación de topología**: Mantener documentación actualizada sobre la topología de la red y las funciones de cada nodo.

## Comandos Útiles para Diagnóstico

### Verificar Balances de Cuentas
```bash
npx hardhat balances --network gethNetwork
```

### Listar Despliegues Existentes
```bash
npx hardhat ignition deployments
```

### Limpiar Estado de Despliegue
```bash
npx hardhat ignition wipe [deployment-id] [future-id]
```

### Comprobar Estado de Despliegue
```bash
npx hardhat ignition status [deployment-id]
```

---

Esta bitácora será actualizada a medida que se encuentren y resuelvan nuevos errores en el proyecto.
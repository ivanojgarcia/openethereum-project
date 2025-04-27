# Comandos Útiles para la Red Ethereum Privada

Este documento proporciona una referencia de los comandos más útiles para interactuar con la red Ethereum privada basada en Geth.

## Comandos de Docker

### Iniciar la red completa
```bash
docker-compose up -d
```

### Detener la red completa
```bash
docker-compose down
```

### Ver logs de un nodo específico
```bash
docker-compose logs -f eth-bootnode
docker-compose logs -f eth-node0
docker-compose logs -f eth-rpc
```

### Reiniciar un nodo específico
```bash
docker-compose restart eth-node0
```

### Ver el estado de los contenedores
```bash
docker-compose ps
```

## Comandos de Geth

### Conectar a la consola JavaScript de un nodo
```bash
docker-compose exec eth-rpc geth attach /data/geth.ipc
```

### Comprobar estado de sincronización
```bash
# Desde la consola Geth
eth.syncing

# O directamente desde la terminal
docker-compose exec eth-rpc geth attach --exec 'eth.syncing' /data/geth.ipc
```

### Verificar peers conectados
```bash
# Desde la consola Geth
admin.peers

# O directamente desde la terminal
docker-compose exec eth-rpc geth attach --exec 'admin.peers.length' /data/geth.ipc
```

### Obtener información del nodo
```bash
# Desde la consola Geth
admin.nodeInfo

# O directamente desde la terminal
docker-compose exec eth-rpc geth attach --exec 'admin.nodeInfo' /data/geth.ipc
```

### Verificar balance de una cuenta
```bash
# Desde la consola Geth
eth.getBalance("0xYOUR_ADDRESS")

# Convertir de wei a ether
web3.fromWei(eth.getBalance("0xYOUR_ADDRESS"), "ether")

# O directamente desde la terminal
docker-compose exec eth-rpc geth attach --exec 'web3.fromWei(eth.getBalance("0xYOUR_ADDRESS"), "ether")' /data/geth.ipc
```

### Crear una nueva cuenta
```bash
# Desde la consola Geth
personal.newAccount("password")

# O directamente desde la terminal
docker-compose exec eth-rpc geth account new --password /path/to/password.txt --datadir /data
```

### Desbloquear una cuenta
```bash
# Desde la consola Geth (desbloquear por 300 segundos)
personal.unlockAccount("0xYOUR_ADDRESS", "password", 300)

# O directamente desde la terminal
docker-compose exec eth-rpc geth attach --exec 'personal.unlockAccount("0xYOUR_ADDRESS", "password", 300)' /data/geth.ipc
```

### Enviar una transacción
```bash
# Desde la consola Geth
eth.sendTransaction({
  from: "0xSENDER_ADDRESS",
  to: "0xRECEIVER_ADDRESS",
  value: web3.toWei(1, "ether")
})

# O directamente desde la terminal
docker-compose exec eth-rpc geth attach --exec 'eth.sendTransaction({from: "0xSENDER_ADDRESS", to: "0xRECEIVER_ADDRESS", value: web3.toWei(1, "ether")})' /data/geth.ipc
```

### Verificar estado del validador
```bash
# Desde la consola Geth
clique.status()

# O directamente desde la terminal
docker-compose exec eth-node0 geth attach --exec 'clique.status()' /data/geth.ipc
```

### Verificar validadores activos
```bash
# Desde la consola Geth
clique.getSigners()

# O directamente desde la terminal
docker-compose exec eth-node0 geth attach --exec 'clique.getSigners()' /data/geth.ipc
```

### Proponer un nuevo validador
```bash
# Desde la consola Geth (true para añadir, false para eliminar)
clique.propose("0xNEW_VALIDATOR_ADDRESS", true)

# O directamente desde la terminal
docker-compose exec eth-node0 geth attach --exec 'clique.propose("0xNEW_VALIDATOR_ADDRESS", true)' /data/geth.ipc
```

## Comandos de Gestión de Red

### Obtener el enode URL del bootnode
```bash
docker-compose exec eth-bootnode geth --exec 'admin.nodeInfo.enode' attach /data/geth.ipc
```

### Añadir peer manualmente
```bash
# Desde la consola Geth
admin.addPeer("enode://ENODE_ID@IP:PORT")

# O directamente desde la terminal
docker-compose exec eth-rpc geth attach --exec 'admin.addPeer("enode://ENODE_ID@IP:PORT")' /data/geth.ipc
```

### Exportar el bloque génesis actual
```bash
docker-compose exec eth-rpc geth dumpgenesis --datadir /data > current_genesis.json
```

### Ver estadísticas del nodo
```bash
docker-compose exec eth-rpc geth --exec 'debug.metrics()' attach /data/geth.ipc
```

## Herramientas de Exploración de Blockchain

### Ver información del último bloque
```bash
# Desde la consola Geth
eth.getBlock("latest")

# O directamente desde la terminal
docker-compose exec eth-rpc geth attach --exec 'eth.getBlock("latest")' /data/geth.ipc
```

### Ver una transacción específica
```bash
# Desde la consola Geth
eth.getTransaction("0xTRANSACTION_HASH")

# O directamente desde la terminal
docker-compose exec eth-rpc geth attach --exec 'eth.getTransaction("0xTRANSACTION_HASH")' /data/geth.ipc
```

### Ver recibo de una transacción
```bash
# Desde la consola Geth
eth.getTransactionReceipt("0xTRANSACTION_HASH")

# O directamente desde la terminal
docker-compose exec eth-rpc geth attach --exec 'eth.getTransactionReceipt("0xTRANSACTION_HASH")' /data/geth.ipc
```

### Ver confirmaciones de un bloque
```bash
# Desde la consola Geth (diferencia entre bloque actual y bloque específico)
eth.blockNumber - eth.getTransaction("0xTRANSACTION_HASH").blockNumber

# O directamente desde la terminal
docker-compose exec eth-rpc geth attach --exec 'eth.blockNumber - eth.getTransaction("0xTRANSACTION_HASH").blockNumber' /data/geth.ipc
```

## Comandos de Mantenimiento

### Limpiar y reinicializar un nodo
```bash
# Detener el nodo
docker-compose stop eth-node0

# Eliminar los datos (precaución: esto borrará la blockchain)
sudo rm -rf ./node0/*

# Reinicializar con el genesis
docker-compose run --rm eth-node0 geth init --datadir=/data /path/to/genesis.json

# Reiniciar el nodo
docker-compose start eth-node0
```

### Realizar una copia de seguridad de un nodo
```bash
# Crear un directorio para la copia
mkdir -p backups/node0-$(date +%Y%m%d)

# Detener el nodo para garantizar consistencia
docker-compose stop eth-node0

# Copiar los datos
cp -r ./node0/* backups/node0-$(date +%Y%m%d)/

# Reiniciar el nodo
docker-compose start eth-node0
```

### Comprobar el uso de disco de los nodos
```bash
du -sh ./bootnode ./node0 ./node1 ./node2 ./rpc
```

### Comprobar la integridad de la base de datos
```bash
docker-compose exec eth-node0 geth --datadir /data removedb
docker-compose exec eth-node0 geth --datadir /data init /path/to/genesis.json
```

## Comandos de Monitorización

### Supervisar el uso de recursos de los contenedores
```bash
docker stats $(docker ps --format "{{.Names}}" | grep eth-)
```

### Ver tasa de generación de bloques
```bash
# Script para contar bloques en los últimos 60 segundos
COUNT1=$(docker-compose exec eth-rpc geth attach --exec 'eth.blockNumber' /data/geth.ipc)
sleep 60
COUNT2=$(docker-compose exec eth-rpc geth attach --exec 'eth.blockNumber' /data/geth.ipc)
echo "Bloques en el último minuto: $(($COUNT2 - $COUNT1))"
```

### Ver transacciones pendientes
```bash
docker-compose exec eth-rpc geth attach --exec 'eth.pendingTransactions' /data/geth.ipc
```

### Ver estadísticas de red
```bash
docker-compose exec eth-rpc geth attach --exec 'net.peerCount' /data/geth.ipc
docker-compose exec eth-rpc geth attach --exec 'admin.peers.forEach(function(p) { console.log(p.name + ": " + p.caps); })' /data/geth.ipc
```

## Comandos HTTP RPC

Los siguientes comandos utilizan `curl` para interactuar con el nodo RPC a través de su API HTTP:

### Obtener el número del último bloque
```bash
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -H "Content-Type: application/json" http://localhost:8645
```

### Obtener balance de una cuenta
```bash
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xYOUR_ADDRESS", "latest"],"id":1}' -H "Content-Type: application/json" http://localhost:8645
```

### Enviar una transacción firmada
```bash
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":["0xSIGNED_TRANSACTION_DATA"],"id":1}' -H "Content-Type: application/json" http://localhost:8645
```

### Obtener información de un bloque
```bash
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["latest", true],"id":1}' -H "Content-Type: application/json" http://localhost:8645
```

### Obtener el precio del gas
```bash
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}' -H "Content-Type: application/json" http://localhost:8645
```

## Comandos de Recuperación en caso de Error

### Reiniciar la red completa desde cero
```bash
# Detener todos los contenedores
docker-compose down

# Eliminar todos los datos (¡PRECAUCIÓN: esto borrará TODA la blockchain!)
sudo rm -rf ./bootnode/* ./node0/* ./node1/* ./node2/* ./rpc/*

# Reconstruir la red desde el inicio
./scripts/setup-network.sh
docker-compose up -d
```

### Recuperar de una bifurcación (fork)
```bash
# Identificar el nodo con la cadena correcta
docker-compose exec eth-rpc geth attach --exec 'eth.blockNumber' /data/geth.ipc

# Detener el nodo con la cadena incorrecta
docker-compose stop eth-node0

# Limpiar sus datos
sudo rm -rf ./node0/*

# Copiar datos del nodo con la cadena correcta
cp -r ./rpc/* ./node0/

# Reiniciar el nodo
docker-compose start eth-node0
``` 
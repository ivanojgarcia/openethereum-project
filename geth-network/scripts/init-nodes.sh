#!/bin/bash

# This script is executed after the nodes are running
# to ensure they connect to each other

echo "Waiting for nodes to be running..."

# Función para verificar si un contenedor está en ejecución
check_container() {
  local container=$1
  local status=$(docker inspect -f '{{.State.Running}}' eth-$container 2>/dev/null)
  
  if [ "$status" == "true" ]; then
    return 0
  else
    return 1
  fi
}

# Función para verificar si un nodo está listo (IPC disponible)
check_node_ready() {
  local node=$1
  docker exec eth-$node geth --exec "eth.blockNumber" attach /data/geth.ipc &>/dev/null
  return $?
}

# Esperar a que todos los nodos estén en ejecución
MAX_ATTEMPTS=10
for NODE in bootnode node0 node1 node2 rpc; do
  echo "Esperando a que el nodo $NODE esté en ejecución..."
  
  ATTEMPTS=0
  while ! check_container $NODE; do
    ATTEMPTS=$((ATTEMPTS+1))
    if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
      echo "ERROR: El nodo $NODE no está en ejecución después de $MAX_ATTEMPTS intentos"
      echo "Verifica el estado de los contenedores con: docker-compose ps"
      exit 1
    fi
    echo "Esperando a que el contenedor $NODE se inicie... ($ATTEMPTS/$MAX_ATTEMPTS)"
    sleep 2
  done
  
  echo "Contenedor $NODE en ejecución, esperando a que esté listo..."
  ATTEMPTS=0
  while ! check_node_ready $NODE; do
    ATTEMPTS=$((ATTEMPTS+1))
    if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
      echo "ADVERTENCIA: No se pudo verificar que el nodo $NODE esté listo después de $MAX_ATTEMPTS intentos"
      break
    fi
    echo "Esperando a que el nodo $NODE esté listo... ($ATTEMPTS/$MAX_ATTEMPTS)"
    sleep 2
  done
done

echo "Todos los nodos están en ejecución"

# Get the enode of the bootnode
BOOTNODE_ENODE=$(docker exec eth-bootnode geth --exec "admin.nodeInfo.enode" attach /data/geth.ipc)
echo "Bootnode enode: $BOOTNODE_ENODE"

# Connect nodes to the bootnode
for NODE in node0 node1 node2 rpc; do
  echo "Connecting $NODE to the bootnode..."
  docker exec eth-$NODE geth --exec "admin.addPeer($BOOTNODE_ENODE)" attach /data/geth.ipc
done

# Connect nodes to each other
NODE0_ENODE=$(docker exec eth-node0 geth --exec "admin.nodeInfo.enode" attach /data/geth.ipc)

for NODE in node1 node2 rpc; do
  echo "Connecting $NODE to the validator node..."
  docker exec eth-$NODE geth --exec "admin.addPeer($NODE0_ENODE)" attach /data/geth.ipc
done

echo "Verifying node connections..."
for NODE in bootnode node0 node1 node2 rpc; do
  echo "Peers connected to $NODE:"
  docker exec eth-$NODE geth --exec "admin.peers.length" attach /data/geth.ipc
done

echo "Initialization completed." 
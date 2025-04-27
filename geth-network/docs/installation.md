# Guía de Instalación de la Red Ethereum Privada

Esta guía detalla los pasos necesarios para desplegar y configurar una red Ethereum privada basada en Geth utilizando Docker.

## Requisitos Previos

- Docker (versión 20.10.0 o superior)
- Docker Compose (versión 1.29.0 o superior)
- Git
- 4GB de RAM mínimo (8GB recomendado)
- 20GB de espacio libre en disco

## Instalación Rápida

Para una instalación rápida utilizando la configuración predeterminada:

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/geth-network.git
cd geth-network

# 2. Ejecutar el script de despliegue
./setup.sh
```

## Instalación Manual Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/geth-network.git
cd geth-network
```

### 2. Configurar el Archivo Genesis

El archivo genesis.json ya está preconfigurado, pero puedes revisarlo y ajustarlo según tus necesidades:

```bash
cat genesis.json
```

### 3. Generar el Archivo de Configuración del Bootnode

```bash
# Genera una clave para el bootnode 
docker run --rm -v $PWD/bootnode:/data ethereum/client-go:alltools-stable bootnode -genkey /data/boot.key

# Obtén el enode URL (lo necesitarás para la configuración de otros nodos)
docker run --rm -v $PWD/bootnode:/data ethereum/client-go:alltools-stable bootnode -nodekey /data/boot.key -writeaddress
```

### 4. Inicializar los Nodos

```bash
# Inicializar los directorios de datos para cada nodo con el bloque genesis
for node in node1 node2 validator rpc; do
  mkdir -p $node
  docker run --rm -v $PWD/$node:/data -v $PWD/genesis.json:/genesis.json \
    ethereum/client-go:stable --datadir /data init /genesis.json
done
```

### 5. Configurar los Nodos Validadores

```bash
# Crear cuenta para el validador
docker run --rm -v $PWD/validator:/data ethereum/client-go:stable \
  --datadir /data account new --password /dev/null
```

Toma nota de la dirección generada y agrégala al archivo `static-nodes.json` que utilizarás en el siguiente paso.

### 6. Crear el Archivo de Configuración de Nodos Estáticos

Crea un archivo `static-nodes.json` en cada directorio de nodo:

```bash
for node in node1 node2 validator rpc; do
  cat > $node/static-nodes.json << EOL
[
  "enode://BOOTNODE_ENODE_ID@bootnode:30301",
  "enode://NODE1_ENODE_ID@node1:30303",
  "enode://NODE2_ENODE_ID@node2:30303",
  "enode://VALIDATOR_ENODE_ID@validator:30303"
]
EOL
done
```

Reemplaza los ID de enode con los valores reales generados para cada nodo.

### 7. Configurar Docker Compose

El archivo `docker-compose.yml` ya está configurado, pero puedes revisarlo para asegurarte de que se ajusta a tus necesidades:

```bash
cat docker-compose.yml
```

### 8. Iniciar la Red

```bash
docker-compose up -d
```

### 9. Verificar el Funcionamiento

```bash
# Comprobar que todos los contenedores están en ejecución
docker-compose ps

# Verificar los logs de algún nodo
docker logs -f geth-node1
```

### 10. Configurar la Cuenta Principal

```bash
# Crear una cuenta con fondos iniciales (en el nodo RPC)
docker exec -it geth-rpc geth --exec "personal.newAccount('password')" attach /data/geth.ipc
```

## Configuración Personalizada

### Modificar el Bloque Genesis

Si deseas personalizar la configuración del bloque genesis:

1. Edita el archivo `genesis.json` según tus necesidades
2. Detén todos los nodos: `docker-compose down`
3. Elimina los datos existentes: `rm -rf node*/geth`
4. Vuelve a inicializar los nodos con el nuevo genesis (paso 4 de la instalación manual)
5. Reinicia la red: `docker-compose up -d`

### Ajustar Parámetros de Red

Para modificar los parámetros de red, edita el archivo `docker-compose.yml` y ajusta los comandos de inicio de los nodos. Puedes modificar:

- `--networkid`: El ID de la red (predeterminado: 1337)
- `--targetgaslimit`: El límite objetivo de gas por bloque
- `--gasprice`: El precio mínimo de gas aceptado
- `--txpool.pricelimit`: El precio mínimo para la admisión de transacciones en el pool
- `--txpool.accountslots`: Número máximo de transacciones ejecutables por cuenta

### Configurar Límites de Recursos

Para limitar los recursos asignados a cada contenedor, agrega secciones de `deploy` y `resources` al archivo `docker-compose.yml`:

```yaml
services:
  geth-node1:
    # ... configuración existente ...
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

## Solución de Problemas

### Los Nodos No Se Conectan Entre Sí

1. Verifica que los enodes en `static-nodes.json` sean correctos
2. Comprueba que el bootnode esté funcionando: `docker logs geth-bootnode`
3. Asegúrate de que los puertos estén correctamente mapeados en `docker-compose.yml`

### Errores de Genesis

Si aparecen errores relacionados con el bloque genesis:

1. Asegúrate de que todos los nodos utilizan exactamente el mismo archivo `genesis.json`
2. Reinicia desde cero eliminando todos los datos: `rm -rf node*/geth`

### Problemas con el Consenso PoA

Si el consenso no funciona correctamente:

1. Verifica que la dirección del validador esté correctamente incluida en el arreglo `extradata` del archivo `genesis.json`
2. Comprueba que el nodo validador esté minando: `docker exec -it geth-validator geth --exec "eth.mining" attach /data/geth.ipc`

## Actualización de la Red

Para actualizar la versión de Geth:

1. Modifica la versión en `docker-compose.yml` (por ejemplo, cambia `ethereum/client-go:stable` a `ethereum/client-go:v1.10.13`)
2. Reconstruye y reinicia los contenedores:

```bash
docker-compose down
docker-compose pull
docker-compose up -d
```

## Próximos Pasos

- Conectar [MetaMask](./commands.md#integración-con-metamask) a la red privada
- Desplegar [contratos inteligentes de prueba](./commands.md#desplegar-un-contrato-inteligente-sencillo)
- Explorar la [arquitectura de la red](./network-architecture.md) en detalle
- Consultar [comandos útiles](./commands.md) para interactuar con la red 
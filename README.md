# Tokio School Proyecto Final Blockchain

Un sistema académico descentralizado construido sobre la tecnología blockchain Ethereum, permitiendo la gestión transparente e inmutable de matrículas, cursos y certificaciones académicas.

## Componentes Principales

### 1. Red Privada Ethereum (Geth)
Red Ethereum privada con múltiples nodos utilizando Geth en contenedores Docker, configurada en modo Proof of Stake (PoS).

- **Bootnode** para descubrimiento de nodos
- **Validadores y nodos de ejecución** para procesamiento de transacciones
- **Nodo RPC** dedicado para interacción con aplicaciones
- Soporte para configuración PoS completa con cliente de consenso Lighthouse (experimental)

### 2. DApp Académica (Smart Contracts)
Aplicación descentralizada para gestión académica mediante contratos inteligentes Solidity.

- **AcademyRegistry**: Sistema completo de gestión para estudiantes, cursos y matrículas
- **SimpleAcademy**: Lógica de negocio académica complementaria
- **Pagos en criptomonedas**: Integración de pagos en ETH y tokens ERC20

## Características Técnicas

- **Arquitectura Multi-nodo**: Red privada Ethereum con 4+ nodos
- **Smart Contracts en Solidity 0.8.x**: Implementación robusta con patrones de seguridad
- **Hardhat + Ignition**: Framework completo de desarrollo y despliegue
- **Dockerización completa**: Entorno de desarrollo replicable y escalable
- **Generación automática de claves**: Setup simplificado para nuevas instancias

## Requisitos

- Docker y Docker Compose
- Node.js (v16+)
- Git

## Configuración Rápida

### 1. Red Ethereum Privada

```bash
cd geth-network
npm install
npm run full-setup  # Configura red PoS sin cliente de consenso (recomendado)
```

### 2. DApp Académica

```bash
cd hero-tokio-school-dapp
npm install
npx hardhat compile
npx hardhat ignition deploy ./ignition/modules/deploy.ts --network localhost
```

## Documentación

### Red Ethereum
- [Instalación Detallada](geth-network/docs/installation.md)
- [Configuración](geth-network/docs/configuration.md)
- [Arquitectura de Red](geth-network/docs/network-architecture.md)
- [Comandos Útiles](geth-network/docs/commands.md)

### Contratos Inteligentes
- [AcademyRegistry](hero-tokio-school-dapp/docs/academy-registry.md)
- [Resolución de Problemas](hero-tokio-school-dapp/docs/troubleshooting.md)
- [Compatibilidad Ethereum](hero-tokio-school-dapp/docs/ethereum-version-compatibility.md)
- [Configuración Geth](hero-tokio-school-dapp/docs/geth-configuration.md)

## Autor

Desarrollado como proyecto final para Tokio School por Ivano Junior Garcia

## Licencia

MIT License
# Hero Tokio School DApp

## Descripción del Proyecto

Hero Tokio School DApp es una aplicación descentralizada (DApp) desarrollada como proyecto final para Tokio School. Esta plataforma blockchain permite gestionar un registro académico descentralizado utilizando contratos inteligentes en la red Ethereum, ofreciendo transparencia, inmutabilidad y seguridad para los datos académicos.

El sistema implementa funcionalidades completas para la gestión de cursos y estudiantes, con mecanismos de pago integrados a través de criptomonedas.

## Características Principales

- **Registro Descentralizado**: Almacenamiento inmutable de información académica en blockchain
- **Gestión de Matrículas**: Sistema automatizado para inscripción y seguimiento de estudiantes
- **Catálogo de Cursos**: Administración de cursos con precios y capacidades configurables
- **Pagos en Cripto**: Integración de pagos mediante tokens ERC20 y ether nativo
- **Panel Administrativo**: Interfaz para la gestión académica y seguimiento de transacciones
- **Arquitectura Multi-nodo**: Implementación de red Ethereum privada con múltiples nodos validadores

## Tecnologías Utilizadas

- **Blockchain**: Ethereum (Geth)
- **Smart Contracts**: Solidity 0.8.x
- **Frameworks**: Hardhat, Hardhat Ignition
- **Contenedores**: Docker y Docker Compose para entorno de desarrollo
- **Testing**: Mocha, Chai, Ethers.js
- **Bibliotecas**: OpenZeppelin para patrones de seguridad estándar

## Estructura del Proyecto

El proyecto está organizado siguiendo las mejores prácticas de desarrollo de aplicaciones descentralizadas:

```
hero-tokio-school-dapp/
├── contracts/         # Contratos inteligentes en Solidity
│   ├── SimpleAcademy.sol     # Contrato principal de la academia
│   └── AcademyRegistry.sol   # Sistema de matrícula y gestión de alumnos
├── ignition/          # Módulos de despliegue de Hardhat Ignition
├── test/              # Pruebas automatizadas
├── docs/              # Documentación técnica
├── hardhat.config.ts  # Configuración de Hardhat
└── ... otros archivos de configuración
```

## Contratos Implementados

### AcademyRegistry

Contrato principal que implementa el sistema completo de gestión académica:
- Registro y autenticación de estudiantes
- Catálogo de cursos con precios dinámicos
- Sistema de matrículas con validación automatizada
- Emisión de certificados mediante eventos de blockchain
- Funciones administrativas para gestión de usuarios y cursos

### SimpleAcademy

Contrato auxiliar que proporciona lógica adicional para la gestión académica:
- Implementación de lógica de negocio para asignación de cursos
- Gestión de eventos académicos
- Interfaz para interacción con otros contratos

## Documentación

Consulta la carpeta [docs](docs/) para documentación detallada, incluyendo:

- [Bitácora de Resolución de Errores](docs/troubleshooting.md)
- [Compatibilidad entre Versiones de Ethereum](docs/ethereum-version-compatibility.md)

## Configuración y Despliegue

### Requisitos Previos
- Node.js v16.x o superior
- Docker y Docker Compose
- Cuenta Ethereum con fondos para despliegue

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/hero-tokio-school-dapp.git
cd hero-tokio-school-dapp

# Instalar dependencias
npm install

# Configurar entorno
cp .env.example .env
# Editar .env con tus variables de entorno

# Iniciar red local Ethereum
npm run network:start

# Desplegar contratos
npm run deploy:local
```

## Pruebas

```bash
# Ejecutar suite completa de pruebas
npm test

# Pruebas específicas
npm run test:contracts
```

## Referencias y Enlaces Útiles

- [Documentación de Hardhat](https://hardhat.org/docs)
- [Documentación de Solidity](https://docs.soliditylang.org/)
- [Estándares ERC](https://eips.ethereum.org/erc)
- [Documentación de OpenZeppelin](https://docs.openzeppelin.com/)
- [Documentación de Geth](https://geth.ethereum.org/docs/)

## Licencia

Este proyecto está licenciado bajo [MIT License](LICENSE). 
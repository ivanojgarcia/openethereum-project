# AcademyRegistry: Sistema de Matrícula de Alumnos

Este documento describe el contrato AcademyRegistry, que implementa un sistema completo para la gestión de matrículas de alumnos en cuatro cursos diferentes, explicando su funcionalidad, arquitectura y cómo interactuar con él.

## Descripción General

AcademyRegistry es un contrato inteligente que gestiona la matrícula de alumnos en cuatro cursos predefinidos:
- Seguridad Informática
- Programación
- Redes Informáticas
- Blockchain

El sistema permite:
- Registro de alumnos
- Matrícula en cursos mediante pago en ETH
- Consulta de matrículas y estado
- Administración de cursos y alumnos

## Arquitectura del Contrato

### Modelos de Datos

El contrato utiliza las siguientes estructuras para almacenar la información:

#### Enum `Course`
Define los cuatro cursos disponibles:
```solidity
enum Course {
    SECURITY,       // Seguridad Informática
    PROGRAMMING,    // Programación
    NETWORKING,     // Redes Informáticas
    BLOCKCHAIN      // Blockchain
}
```

#### Struct `Student`
Almacena la información de cada estudiante:
```solidity
struct Student {
    string name;
    string email;
    uint256 registrationDate;
    bool active;
    mapping(uint8 => bool) enrolledCourses; // Cursos matriculados
    uint256 lastPaymentDate;
}
```

#### Struct `CourseInfo`
Contiene los detalles de cada curso:
```solidity
struct CourseInfo {
    string name;
    uint256 price;
    uint256 duration; // en días
    uint256 capacity;
    uint256 enrolled;
    bool active;
}
```

### Mapeos y Almacenamiento

- `mapping(address => Student) private students`: Mapeo de direcciones a estudiantes
- `mapping(uint8 => CourseInfo) private courses`: Mapeo de IDs de cursos a información del curso
- `address[] private registeredStudents`: Array con todas las direcciones de estudiantes registrados

### Eventos

El contrato emite los siguientes eventos para facilitar el seguimiento de las acciones:

- `StudentRegistered`: Cuando un estudiante se registra
- `CourseEnrollment`: Cuando un estudiante se matricula en un curso
- `CourseCreated`: Cuando se crea un nuevo curso
- `CourseUpdated`: Cuando se actualiza la información de un curso
- `CourseStatusChanged`: Cuando cambia el estado de activación de un curso
- `StudentStatusChanged`: Cuando cambia el estado de activación de un estudiante
- `PaymentReceived`: Cuando se recibe un pago por matrícula

## Funcionalidades Principales

### Para Estudiantes

#### Registro de Estudiantes
```solidity
function registerStudent(string calldata name, string calldata email) external
```
Permite a cualquier usuario registrarse como estudiante proporcionando su nombre y email.

#### Matrícula en Cursos
```solidity
function enrollInCourse(uint8 courseId) external payable nonReentrant
```
Permite a un estudiante registrado matricularse en un curso específico pagando el precio del curso en ETH.

#### Consultas
```solidity
function isEnrolledInCourse(address studentAddress, uint8 courseId) external view returns (bool)
function getEnrolledCourses(address studentAddress) external view returns (uint8[] memory)
```
Funciones para consultar las matrículas de un estudiante.

### Para Administradores

#### Gestión de Cursos
```solidity
function updateCourse(uint8 courseId, string calldata name, uint256 price, uint256 duration, uint256 capacity) external onlyOwner
function setCourseStatus(uint8 courseId, bool active) external onlyOwner
```
Permiten al administrador actualizar la información de los cursos y cambiar su estado de activación.

#### Gestión de Estudiantes
```solidity
function setStudentStatus(address studentAddress, bool active) external onlyOwner
```
Permite al administrador activar o desactivar la cuenta de un estudiante.

#### Gestión Financiera
```solidity
function withdrawFunds() external onlyOwner nonReentrant
```
Permite al administrador retirar los fondos acumulados por las matrículas.

### Consultas Generales

```solidity
function getStudentInfo(address studentAddress) external view
function getCourseInfo(uint8 courseId) external view
function getAllStudents() external view
```
Funciones para obtener información detallada sobre estudiantes, cursos y listar todos los estudiantes registrados.

## Patrones de Seguridad Implementados

El contrato AcademyRegistry implementa varios patrones de seguridad:

1. **Ownable**: Control de acceso para funciones administrativas
2. **ReentrancyGuard**: Protección contra ataques de reentrada en funciones que manejan ETH
3. **Checks-Effects-Interactions**: Patrón implementado en `enrollInCourse` y `withdrawFunds`
4. **Validaciones exhaustivas**: Cada función valida todos los parámetros y condiciones
5. **Eventos para auditoría**: Emisión de eventos para todas las acciones importantes

## Cómo Interactuar con el Contrato

### Despliegue

El contrato se puede desplegar usando Hardhat Ignition:

```bash
npx hardhat ignition deploy ignition/modules/AcademyRegistry.ts --network gethNetwork --deployment-id academy-v1
```

### Interacción mediante Scripts

#### Registro de un Estudiante

```typescript
const AcademyRegistry = await ethers.getContractFactory("AcademyRegistry");
const academy = await AcademyRegistry.attach("DIRECCIÓN_DEL_CONTRATO_DESPLEGADO");

// Registrar un estudiante
const registerTx = await academy.registerStudent("Juan Pérez", "juan@example.com");
await registerTx.wait();
console.log("Estudiante registrado");
```

#### Matrícula en un Curso

```typescript
// Curso IDs:
// 0: Seguridad Informática
// 1: Programación
// 2: Redes Informáticas
// 3: Blockchain

// Obtener información del curso
const courseInfo = await academy.getCourseInfo(1); // Programación
console.log(`Precio del curso: ${ethers.utils.formatEther(courseInfo.price)} ETH`);

// Matricularse en el curso
const enrollTx = await academy.enrollInCourse(1, { value: courseInfo.price });
await enrollTx.wait();
console.log("Matriculado en Programación");
```

#### Consultar Matrículas

```typescript
// Obtener los cursos en los que está matriculado un estudiante
const address = "0x..."; // Dirección del estudiante
const enrolledCourses = await academy.getEnrolledCourses(address);
console.log("Cursos matriculados:", enrolledCourses);

// Nombres de los cursos
const courseNames = ["Seguridad Informática", "Programación", "Redes Informáticas", "Blockchain"];
for (const courseId of enrolledCourses) {
  console.log(`- ${courseNames[courseId]}`);
}
```

### Funciones Administrativas

```typescript
// Actualizar un curso
await academy.updateCourse(0, "Seguridad Informática Avanzada", ethers.utils.parseEther("0.06"), 100, 35);

// Desactivar un curso
await academy.setCourseStatus(2, false);

// Retirar fondos
await academy.withdrawFunds();
```

## Consideraciones de Escalabilidad

Para un sistema en producción, podrían considerarse estas mejoras:

1. **Patrón de Proxy Actualizable**: Permitir actualizaciones del contrato manteniendo los datos
2. **Roles más granulares**: Implementar un sistema de roles con diferentes niveles de acceso
3. **Integración con Oráculos**: Para precios dinámicos basados en el valor de ETH
4. **Sistema de calificaciones y certificados**: Ampliar el sistema para incluir calificaciones y emisión de certificados
5. **Tokenización de credenciales**: Implementar NFTs para representar certificados de finalización

## Próximos Pasos

1. Desarrollo de una interfaz de usuario para interactuar con el contrato
2. Implementación de pruebas automatizadas
3. Auditoría de seguridad del contrato
4. Expansión del sistema para incluir más funcionalidades como calificaciones y certificados

---

Este documento forma parte de la documentación técnica del proyecto Hero Tokio School DApp. 
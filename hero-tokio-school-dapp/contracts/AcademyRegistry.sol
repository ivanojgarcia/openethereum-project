// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AcademyRegistry
 * @dev Contrato para gestionar la matrícula de alumnos en diferentes cursos
 */
contract AcademyRegistry is Ownable, ReentrancyGuard {
    // Definición de cursos usando enum para garantizar tipos consistentes
    enum Course {
        SECURITY,       // Seguridad Informática
        PROGRAMMING,    // Programación
        NETWORKING,     // Redes Informáticas
        BLOCKCHAIN      // Blockchain
    }
    
    // Estructura para almacenar información de estudiantes
    struct Student {
        string name;
        string email;
        uint256 registrationDate;
        bool active;
        mapping(uint8 => bool) enrolledCourses; // Mapeo de Course (como uint8) a estado de inscripción
        uint256 lastPaymentDate;
    }
    
    // Estructura para almacenar información de cursos
    struct CourseInfo {
        string name;
        uint256 price;
        uint256 duration; // en días
        uint256 capacity;
        uint256 enrolled;
        bool active;
    }
    
    // Mapeo de direcciones a estudiantes
    mapping(address => Student) private students;
    
    // Mapeo de cursos a información del curso
    mapping(uint8 => CourseInfo) private courses;
    
    // Direcciones registradas como estudiantes
    address[] private registeredStudents;
    
    // Eventos
    event StudentRegistered(address indexed studentAddress, string name, string email);
    event CourseEnrollment(address indexed studentAddress, uint8 courseId, uint256 timestamp);
    event CourseCreated(uint8 courseId, string name, uint256 price);
    event CourseUpdated(uint8 courseId, string name, uint256 price);
    event CourseStatusChanged(uint8 courseId, bool isActive);
    event StudentStatusChanged(address indexed studentAddress, bool isActive);
    event PaymentReceived(address indexed studentAddress, uint8 courseId, uint256 amount);
    
    constructor() Ownable(msg.sender) {
        // Inicializar los cursos predefinidos
        initializeCourses();
    }
    
    /**
     * @dev Inicializa los cuatro cursos predefinidos
     */
    function initializeCourses() private {
        courses[uint8(Course.SECURITY)] = CourseInfo({
            name: "Seguridad Informatica",
            price: 0.05 ether,
            duration: 90, // 90 días
            capacity: 30,
            enrolled: 0,
            active: true
        });
        
        courses[uint8(Course.PROGRAMMING)] = CourseInfo({
            name: "Programacion",
            price: 0.08 ether,
            duration: 120, // 120 días
            capacity: 25,
            enrolled: 0,
            active: true
        });
        
        courses[uint8(Course.NETWORKING)] = CourseInfo({
            name: "Redes Informaticas",
            price: 0.06 ether,
            duration: 60, // 60 días
            capacity: 20,
            enrolled: 0,
            active: true
        });
        
        courses[uint8(Course.BLOCKCHAIN)] = CourseInfo({
            name: "Blockchain",
            price: 0.1 ether,
            duration: 180, // 180 días
            capacity: 15,
            enrolled: 0,
            active: true
        });
        
        // Emitir eventos para cada curso creado
        emit CourseCreated(uint8(Course.SECURITY), "Seguridad Informatica", 0.05 ether);
        emit CourseCreated(uint8(Course.PROGRAMMING), "Programacion", 0.08 ether);
        emit CourseCreated(uint8(Course.NETWORKING), "Redes Informaticas", 0.06 ether);
        emit CourseCreated(uint8(Course.BLOCKCHAIN), "Blockchain", 0.1 ether);
    }
    
    /**
     * @dev Permite a un usuario registrarse como estudiante
     * @param name Nombre del estudiante
     * @param email Email del estudiante
     */
    function registerStudent(string calldata name, string calldata email) external {
        require(bytes(name).length > 0, "El nombre no puede estar vacio");
        require(bytes(email).length > 0, "El email no puede estar vacio");
        require(!isStudentRegistered(msg.sender), "Estudiante ya registrado");
        
        // Inicializar el estudiante
        Student storage newStudent = students[msg.sender];
        newStudent.name = name;
        newStudent.email = email;
        newStudent.registrationDate = block.timestamp;
        newStudent.active = true;
        
        // Añadir a la lista de estudiantes registrados
        registeredStudents.push(msg.sender);
        
        emit StudentRegistered(msg.sender, name, email);
    }
    
    /**
     * @dev Permite a un estudiante matricularse en un curso específico
     * @param courseId ID del curso (según enum Course)
     */
    function enrollInCourse(uint8 courseId) external payable nonReentrant {
        require(isValidCourse(courseId), "Curso no valido");
        require(isStudentRegistered(msg.sender), "Estudiante no registrado");
        require(students[msg.sender].active, "Estudiante no activo");
        require(courses[courseId].active, "Curso no disponible");
        require(!students[msg.sender].enrolledCourses[courseId], "Ya matriculado en este curso");
        require(courses[courseId].enrolled < courses[courseId].capacity, "Curso sin plazas disponibles");
        require(msg.value >= courses[courseId].price, "Pago insuficiente");
        
        // Actualizar estado - guardamos antes de hacer transferencias (patrón CEI)
        students[msg.sender].enrolledCourses[courseId] = true;
        students[msg.sender].lastPaymentDate = block.timestamp;
        courses[courseId].enrolled++;
        
        emit CourseEnrollment(msg.sender, courseId, block.timestamp);
        emit PaymentReceived(msg.sender, courseId, msg.value);
        
        // Devolver exceso de pago si es necesario
        uint256 excess = msg.value - courses[courseId].price;
        if (excess > 0) {
            (bool success, ) = payable(msg.sender).call{value: excess}("");
            require(success, "Fallo al devolver exceso de pago");
        }
    }
    
    /**
     * @dev Verifica si un curso es válido
     * @param courseId ID del curso a verificar
     * @return bool indicando si el curso existe
     */
    function isValidCourse(uint8 courseId) public view returns (bool) {
        return courseId <= uint8(Course.BLOCKCHAIN) && 
               bytes(courses[courseId].name).length > 0;
    }
    
    /**
     * @dev Verifica si una dirección está registrada como estudiante
     * @param studentAddress Dirección a verificar
     * @return bool indicando si el estudiante está registrado
     */
    function isStudentRegistered(address studentAddress) public view returns (bool) {
        return bytes(students[studentAddress].name).length > 0;
    }
    
    /**
     * @dev Verifica si un estudiante está matriculado en un curso específico
     * @param studentAddress Dirección del estudiante
     * @param courseId ID del curso
     * @return bool indicando si el estudiante está matriculado
     */
    function isEnrolledInCourse(address studentAddress, uint8 courseId) external view returns (bool) {
        require(isStudentRegistered(studentAddress), "Estudiante no registrado");
        require(isValidCourse(courseId), "Curso no valido");
        
        return students[studentAddress].enrolledCourses[courseId];
    }
    
    /**
     * @dev Obtiene información básica de un estudiante
     * @param studentAddress Dirección del estudiante
     * @return name Nombre del estudiante
     * @return email Email del estudiante
     * @return registrationDate Fecha de registro
     * @return active Estado de actividad
     */
    function getStudentInfo(address studentAddress) external view returns (
        string memory name,
        string memory email,
        uint256 registrationDate,
        bool active
    ) {
        require(isStudentRegistered(studentAddress), "Estudiante no registrado");
        
        Student storage student = students[studentAddress];
        return (
            student.name,
            student.email,
            student.registrationDate,
            student.active
        );
    }
    
    /**
     * @dev Obtiene información de un curso
     * @param courseId ID del curso
     * @return name Nombre del curso
     * @return price Precio del curso
     * @return duration Duración en días
     * @return capacity Capacidad máxima
     * @return enrolled Número de estudiantes matriculados
     * @return active Estado de actividad
     */
    function getCourseInfo(uint8 courseId) external view returns (
        string memory name,
        uint256 price,
        uint256 duration,
        uint256 capacity,
        uint256 enrolled,
        bool active
    ) {
        require(isValidCourse(courseId), "Curso no valido");
        
        CourseInfo storage course = courses[courseId];
        return (
            course.name,
            course.price,
            course.duration,
            course.capacity,
            course.enrolled,
            course.active
        );
    }
    
    /**
     * @dev Obtiene la lista completa de estudiantes registrados
     * @return Array de direcciones de estudiantes
     */
    function getAllStudents() external view returns (address[] memory) {
        return registeredStudents;
    }
    
    /**
     * @dev Actualiza la información de un curso (solo admin)
     * @param courseId ID del curso
     * @param name Nuevo nombre
     * @param price Nuevo precio
     * @param duration Nueva duración
     * @param capacity Nueva capacidad
     */
    function updateCourse(
        uint8 courseId, 
        string calldata name, 
        uint256 price, 
        uint256 duration, 
        uint256 capacity
    ) external onlyOwner {
        require(isValidCourse(courseId), "Curso no valido");
        require(capacity >= courses[courseId].enrolled, "Capacidad no puede ser menor que los matriculados actuales");
        
        CourseInfo storage course = courses[courseId];
        course.name = name;
        course.price = price;
        course.duration = duration;
        course.capacity = capacity;
        
        emit CourseUpdated(courseId, name, price);
    }
    
    /**
     * @dev Cambia el estado de actividad de un curso (solo admin)
     * @param courseId ID del curso
     * @param active Nuevo estado
     */
    function setCourseStatus(uint8 courseId, bool active) external onlyOwner {
        require(isValidCourse(courseId), "Curso no valido");
        
        courses[courseId].active = active;
        
        emit CourseStatusChanged(courseId, active);
    }
    
    /**
     * @dev Cambia el estado de actividad de un estudiante (solo admin)
     * @param studentAddress Dirección del estudiante
     * @param active Nuevo estado
     */
    function setStudentStatus(address studentAddress, bool active) external onlyOwner {
        require(isStudentRegistered(studentAddress), "Estudiante no registrado");
        
        students[studentAddress].active = active;
        
        emit StudentStatusChanged(studentAddress, active);
    }
    
    /**
     * @dev Permite al administrador retirar los fondos acumulados
     */
    function withdrawFunds() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No hay fondos para retirar");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Fallo al retirar fondos");
    }
    
    /**
     * @dev Retorna todos los cursos en los que un estudiante está matriculado
     * @param studentAddress Dirección del estudiante
     * @return Array de IDs de cursos
     */
    function getEnrolledCourses(address studentAddress) external view returns (uint8[] memory) {
        require(isStudentRegistered(studentAddress), "Estudiante no registrado");
        
        // Primero contamos cuántos cursos tiene el estudiante
        uint8 courseCount = 0;
        for (uint8 i = 0; i <= uint8(Course.BLOCKCHAIN); i++) {
            if (students[studentAddress].enrolledCourses[i]) {
                courseCount++;
            }
        }
        
        // Luego creamos un array del tamaño correcto y lo llenamos
        uint8[] memory enrolledCourses = new uint8[](courseCount);
        uint8 index = 0;
        for (uint8 i = 0; i <= uint8(Course.BLOCKCHAIN); i++) {
            if (students[studentAddress].enrolledCourses[i]) {
                enrolledCourses[index] = i;
                index++;
            }
        }
        
        return enrolledCourses;
    }
} 
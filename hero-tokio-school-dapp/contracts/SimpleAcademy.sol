// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleAcademy
 * @dev Versión simplificada del registro académico solo para gestionar alumnos y matrículas
 */
contract SimpleAcademy is Ownable {
    // Definición de cursos usando enum
    enum Course {
        SECURITY,       // Seguridad Informática
        PROGRAMMING,    // Programación
        NETWORKING,     // Redes Informáticas
        BLOCKCHAIN      // Blockchain
    }
    
    // Estructura simplificada para almacenar información de estudiantes
    struct Student {
        string name;
        string email;
        bool active;
    }
    
    // Estructura simplificada para almacenar matrículas
    struct Enrollment {
        address student;
        uint8 courseId;
        uint256 enrollmentDate;
    }
    
    // Mapeo de direcciones a estudiantes
    mapping(address => Student) public students;
    
    // Nombres de los cursos
    mapping(uint8 => string) public courseNames;
    
    // Registro de matrículas
    Enrollment[] public enrollments;
    
    // Mapeo para verificar matriculaciones
    mapping(address => mapping(uint8 => bool)) public isEnrolled;
    
    // Eventos
    event StudentRegistered(address indexed studentAddress, string name);
    event StudentEnrolled(address indexed studentAddress, uint8 courseId);
    
    constructor() Ownable(msg.sender) {
        // Inicializar nombres de cursos
        courseNames[uint8(Course.SECURITY)] = "Seguridad Informatica";
        courseNames[uint8(Course.PROGRAMMING)] = "Programacion";
        courseNames[uint8(Course.NETWORKING)] = "Redes Informaticas";
        courseNames[uint8(Course.BLOCKCHAIN)] = "Blockchain";
    }
    
    /**
     * @dev Permite a un usuario registrarse como estudiante
     * @param name Nombre del estudiante
     * @param email Email del estudiante
     */
    function registerStudent(string calldata name, string calldata email) external {
        require(bytes(name).length > 0, "El nombre no puede estar vacio");
        require(bytes(email).length > 0, "El email no puede estar vacio");
        require(bytes(students[msg.sender].name).length == 0, "Estudiante ya registrado");
        
        students[msg.sender] = Student({
            name: name,
            email: email,
            active: true
        });
        
        emit StudentRegistered(msg.sender, name);
    }
    
    /**
     * @dev Permite a un estudiante matricularse en un curso
     * @param courseId ID del curso (0-3)
     */
    function enrollInCourse(uint8 courseId) external {
        require(courseId <= uint8(Course.BLOCKCHAIN), "Curso invalido");
        require(bytes(students[msg.sender].name).length > 0, "Estudiante no registrado");
        require(students[msg.sender].active, "Estudiante no activo");
        require(!isEnrolled[msg.sender][courseId], "Ya matriculado en este curso");
        
        // Registrar matrícula
        enrollments.push(Enrollment({
            student: msg.sender,
            courseId: courseId,
            enrollmentDate: block.timestamp
        }));
        
        // Marcar como matriculado
        isEnrolled[msg.sender][courseId] = true;
        
        emit StudentEnrolled(msg.sender, courseId);
    }
    
    /**
     * @dev Obtiene el total de matrículas registradas
     */
    function getTotalEnrollments() external view returns (uint256) {
        return enrollments.length;
    }
    
    /**
     * @dev Verifica si un estudiante está registrado
     * @param studentAddress Dirección del estudiante
     */
    function isStudentRegistered(address studentAddress) external view returns (bool) {
        return bytes(students[studentAddress].name).length > 0;
    }
    
    /**
     * @dev Obtiene información de un estudiante
     * @param studentAddress Dirección del estudiante
     */
    function getStudentInfo(address studentAddress) external view returns (
        string memory name,
        string memory email,
        bool active
    ) {
        require(bytes(students[studentAddress].name).length > 0, "Estudiante no registrado");
        
        Student storage student = students[studentAddress];
        return (student.name, student.email, student.active);
    }
    
    /**
     * @dev Activa o desactiva un estudiante (solo admin)
     * @param studentAddress Dirección del estudiante
     * @param _active Estado de activación
     */
    function setStudentStatus(address studentAddress, bool _active) external onlyOwner {
        require(bytes(students[studentAddress].name).length > 0, "Estudiante no registrado");
        students[studentAddress].active = _active;
    }
} 
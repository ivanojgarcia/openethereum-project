// SimpleAcademy module for Hardhat Ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SimpleAcademyModule = buildModule("SimpleAcademyModule", (m) => {
  // Desplegar el contrato SimpleAcademy
  const simpleAcademy = m.contract("SimpleAcademy");

  return { simpleAcademy };
});

export default SimpleAcademyModule; 
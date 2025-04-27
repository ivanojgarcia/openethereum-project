// AcademyRegistry module for Hardhat Ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AcademyRegistryModule = buildModule("AcademyRegistryModule", (m) => {
  // Desplegar el contrato AcademyRegistry
  const academyRegistry = m.contract("AcademyRegistry");

  return { academyRegistry };
});

export default AcademyRegistryModule; 
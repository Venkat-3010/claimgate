export {
  ClaimgateConfigSchema,
  GateDefinitionSchema,
  GateTypeSchema,
  DEFAULT_CONFIG_FILENAMES,
  type ClaimgateConfig,
  type GateDefinition,
  type GateType,
} from "./schema.js";

export {
  ConfigError,
  defaultConfigYaml,
  findConfigPath,
  loadConfig,
} from "./load.js";

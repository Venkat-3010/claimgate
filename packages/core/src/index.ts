export {
  type GateAdapter,
  type GateContext,
  failResult,
  passResult,
  errorResult,
} from "./adapter.js";

export {
  runCommand,
  resolveGateCwd,
  type RunCommandOptions,
  type RunCommandResult,
} from "./command.js";

export { getGitInfo, type GitInfo } from "./git.js";

export {
  EvidencePackSchema,
  GateResultSchema,
  FindingSchema,
  GateStatusSchema,
  overallFromGates,
  type EvidencePack,
  type GateResult,
  type Finding,
  type GateStatus,
} from "./pack.js";

export { evaluatePackPolicy, type PolicyVerdict } from "./policy.js";

export { createAdapterRegistry } from "./registry.js";

export { runGates, type RunnerOptions, type RunnerResult } from "./runner.js";

export {
  ensurePackDir,
  writePack,
  readPack,
  latestPack,
  retainPacks,
} from "./store.js";

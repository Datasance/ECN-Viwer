import Ajv, { ValidateFunction } from "ajv";
import type { EcnViewerContext } from "./types";

const contextSchema = {
  type: "object",
  required: ["name", "controllerUrl"],
  properties: {
    id: { type: "string" },
    name: { type: "string", minLength: 1 },
    controllerUrl: { type: "string", minLength: 1 },
    keycloakUrl: { type: "string" },
    keycloakRealm: { type: "string" },
    keycloakClientId: { type: "string" },
    controllerCA: { type: "string" },
    refresh: { type: "number", minimum: 500 },
  },
  additionalProperties: false,
};

const ajv = new Ajv({ allErrors: true });
const validateContext: ValidateFunction<EcnViewerContext> = ajv.compile(
  contextSchema,
) as ValidateFunction<EcnViewerContext>;

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

export function validateContextData(
  data: unknown,
): { valid: true; context: EcnViewerContext } | { valid: false; errors: string[] } {
  if (!validateContext(data)) {
    const errors =
      validateContext.errors?.map(
        (e) => `${e.instancePath || "root"} ${e.message ?? ""}`.trim(),
      ) ?? ["Validation failed"];
    return { valid: false, errors };
  }
  const ctx = data as EcnViewerContext;
  if (!isValidUrl(ctx.controllerUrl)) {
    return { valid: false, errors: ["controllerUrl must be a valid URL"] };
  }
  if (ctx.keycloakUrl && !isValidUrl(ctx.keycloakUrl)) {
    return { valid: false, errors: ["keycloakUrl must be a valid URL"] };
  }
  return { valid: true, context: ctx };
}

export { contextSchema };

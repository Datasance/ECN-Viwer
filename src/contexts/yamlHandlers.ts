import yaml from "js-yaml";
import type { EcnViewerContext } from "./types";
import { validateContextData } from "./contextSchema";
import { generateContextId } from "./types";

/**
 * Serialize a single context to YAML (single-doc).
 */
export function contextToYaml(context: EcnViewerContext): string {
  return yaml.dump(context, { lineWidth: -1 });
}

/**
 * Serialize multiple contexts to YAML (multi-doc).
 */
export function contextsToYaml(contexts: EcnViewerContext[]): string {
  return contexts.map((c) => yaml.dump(c, { lineWidth: -1 })).join("---\n");
}

/**
 * Parse YAML string into one or more context objects.
 * Supports single-doc and multi-doc (--- separated).
 * Returns validated contexts and any parse/validation errors per doc.
 */
export function yamlToContexts(yamlString: string): {
  contexts: EcnViewerContext[];
  errors: string[];
} {
  const errors: string[] = [];
  const contexts: EcnViewerContext[] = [];
  let docs: unknown[];
  try {
    docs = yaml.loadAll(yamlString);
  } catch (e) {
    return {
      contexts: [],
      errors: [e instanceof Error ? e.message : "Invalid YAML"],
    };
  }
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    if (doc == null) continue;
    const result = validateContextData(doc);
    if (result.valid) {
      const ctx = result.context;
      if (!ctx.id) ctx.id = generateContextId();
      contexts.push(ctx);
    } else {
      errors.push(`Document ${i + 1}: ${result.errors.join("; ")}`);
    }
  }
  return { contexts, errors };
}

/**
 * Parse a single YAML document into one context.
 */
export function yamlToContext(yamlString: string): {
  context: EcnViewerContext | null;
  error: string | null;
} {
  let doc: unknown;
  try {
    doc = yaml.load(yamlString);
  } catch (e) {
    return {
      context: null,
      error: e instanceof Error ? e.message : "Invalid YAML",
    };
  }
  if (doc == null) {
    return { context: null, error: "Empty document" };
  }
  const result = validateContextData(doc);
  if (result.valid) {
    const ctx = result.context;
    if (!ctx.id) ctx.id = generateContextId();
    return { context: ctx, error: null };
  }
  return {
    context: null,
    error: result.errors.join("; "),
  };
}

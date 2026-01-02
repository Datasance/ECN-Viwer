import yaml from "js-yaml";
import { parseService } from "./parseServiceYaml";
import { parseSecret } from "./parseSecretYaml";
import { parseConfigMap } from "./parseConfigMapYaml";
import {
  parseCertificate,
  parseCertificateAuthority,
} from "./parseCertificateYaml";
import { parseRegistries } from "./parseRegistriesYaml";
import { parseVolumeMount } from "./parseVolumeMountsYaml";
import { parseCatalogMicroservice } from "./parseCatalogMicroservice";
import lget from "lodash/get";
import { API_VERSIONS } from "./constants";
import { parseMicroservice } from "./ApplicationParser";

export type ResourceKind =
  | "Service"
  | "Secret"
  | "ConfigMap"
  | "Certificate"
  | "CertificateAuthority"
  | "Registry"
  | "VolumeMount"
  | "CatalogItem"
  | "ApplicationTemplate"
  | "Application"
  | "Microservice"
  | "Agent";

export interface ParsedResource {
  kind: ResourceKind;
  parsed: any;
  originalDoc: any;
  identifier: string;
  error?: string;
}

export interface ParseResult {
  resources: ParsedResource[];
  errors: string[];
}

/**
 * Extract and validate the resource kind from a YAML document
 */
export function getResourceKind(doc: any): ResourceKind | null {
  if (!doc || typeof doc !== "object") {
    return null;
  }

  const kind = doc.kind;
  if (!kind || typeof kind !== "string") {
    return null;
  }

  const validKinds: ResourceKind[] = [
    "Service",
    "Secret",
    "ConfigMap",
    "Certificate",
    "CertificateAuthority",
    "Registry",
    "VolumeMount",
    "CatalogItem",
    "ApplicationTemplate",
    "Application",
    "Microservice",
    "Agent",
  ];

  if (validKinds.includes(kind as ResourceKind)) {
    return kind as ResourceKind;
  }

  return null;
}

/**
 * Extract unique identifier from a parsed resource
 */
export function getResourceIdentifier(
  kind: ResourceKind,
  parsedResource: any,
  originalDoc?: any,
): string | null {
  switch (kind) {
    case "Service":
    case "Secret":
    case "ConfigMap":
    case "Certificate":
    case "CertificateAuthority":
    case "CatalogItem":
    case "ApplicationTemplate":
    case "Application":
      return parsedResource?.name || originalDoc?.metadata?.name || null;
    case "Registry":
      return parsedResource?.url || originalDoc?.spec?.url || null;
    case "VolumeMount":
      return parsedResource?.name || null;
    case "Microservice":
      return (
        parsedResource?.name ||
        parsedResource?.uuid ||
        originalDoc?.metadata?.name ||
        null
      );
    case "Agent":
      return (
        parsedResource?.name ||
        parsedResource?.uuid ||
        originalDoc?.metadata?.name ||
        null
      );
    default:
      return null;
  }
}

/**
 * Route a document to the appropriate parser based on kind
 */
async function routeToParser(
  doc: any,
  kind: ResourceKind,
): Promise<[any, string | null]> {
  try {
    let result: any;

    switch (kind) {
      case "Service":
        result = await parseService(doc);
        break;
      case "Secret":
        result = await parseSecret(doc);
        break;
      case "ConfigMap":
        result = await parseConfigMap(doc);
        break;
      case "Certificate":
        result = await parseCertificate(doc);
        break;
      case "CertificateAuthority":
        result = await parseCertificateAuthority(doc);
        break;
      case "Registry":
        result = await parseRegistries(doc);
        break;
      case "VolumeMount":
        result = await parseVolumeMount(doc);
        break;
      case "CatalogItem":
        result = await parseCatalogMicroservice(doc);
        break;
      case "ApplicationTemplate": {
        // Inline parser from appTemplates/index.tsx
        if (doc.apiVersion !== "datasance.com/v3") {
          return [
            {},
            `Invalid API Version ${doc.apiVersion}, current version is datasance.com/v3`,
          ] as [any, string | null];
        }
        if (doc.kind !== "ApplicationTemplate") {
          return [{}, `Invalid kind ${doc.kind}`] as [any, string | null];
        }
        if (!doc.metadata || !doc.spec) {
          return [{}, "Invalid YAML format"] as [any, string | null];
        }
        // Note: This is a simplified version - full implementation would need parseApplication
        const applicationTemplate = {
          name: lget(doc, "metadata.name", lget(doc, "spec.name", undefined)),
          description: lget(doc, "spec.description", ""),
          application: lget(doc, "spec.application", {}),
          variables: lget(doc, "spec.variables", []),
        };
        return [applicationTemplate, null] as [any, string | null];
      }
      case "Application": {
        // Inline parser from Applications/index.tsx
        if (API_VERSIONS.indexOf(doc.apiVersion) === -1) {
          return [
            {},
            `Invalid API Version ${doc.apiVersion}, current version is ${API_VERSIONS.slice(-1)[0]}`,
          ] as [any, string | null];
        }
        if (doc.kind !== "Application") {
          return [{}, `Invalid kind ${doc.kind}`] as [any, string | null];
        }
        if (!doc.metadata || !doc.spec) {
          return [{}, "Invalid YAML format"] as [any, string | null];
        }
        const application = {
          name: lget(doc, "metadata.name", undefined),
          ...doc.spec,
          isActivated: true,
          microservices: await Promise.all(
            (doc.spec.microservices || []).map(async (m: any) =>
              parseMicroservice(m),
            ),
          ),
        };
        return [application, null] as [any, string | null];
      }
      case "Microservice": {
        // Inline parser from Microservices/index.tsx
        if (API_VERSIONS.indexOf(doc.apiVersion) === -1) {
          return [
            {},
            `Invalid API Version ${doc.apiVersion}, current version is ${API_VERSIONS.slice(-1)[0]}`,
          ] as [any, string | null];
        }
        if (doc.kind !== "Microservice") {
          return [{}, `Invalid kind ${doc.kind}`] as [any, string | null];
        }
        if (!doc.metadata || !doc.spec) {
          return [{}, "Invalid YAML format"] as [any, string | null];
        }
        const tempObject = await parseMicroservice(doc.spec);
        const microserviceData = {
          name: lget(doc, "metadata.name", undefined),
          ...tempObject,
        };
        return [microserviceData, null] as [any, string | null];
      }
      case "Agent": {
        // Inline parser from Nodes/List/index.tsx
        if (doc.apiVersion !== "datasance.com/v3") {
          return [
            null,
            `Invalid API Version ${doc.apiVersion}, current version is datasance.com/v3`,
          ] as [any, string | null];
        }
        if (doc.kind !== "Agent") {
          return [null, `Invalid kind ${doc.kind}, expected Agent`] as [
            any,
            string | null,
          ];
        }
        if (!doc.metadata || !doc.spec) {
          return [null, "Invalid YAML format (missing metadata or spec)"] as [
            any,
            string | null,
          ];
        }

        const spec = doc.spec ?? {};
        const metadata = doc.metadata ?? {};
        const config = spec.config ?? {};

        const agentData: any = {
          name: spec.name || metadata.name,
          host: spec.host,
          ...config,
        };

        agentData.tags = metadata.tags;

        if (config.routerConfig) {
          agentData.routerMode = config.routerConfig.routerMode;
          agentData.messagingPort = config.routerConfig.messagingPort;

          if (config.routerConfig.edgeRouterPort !== undefined) {
            agentData.edgeRouterPort = config.routerConfig.edgeRouterPort;
          }
          if (config.routerConfig.interRouterPort !== undefined) {
            agentData.interRouterPort = config.routerConfig.interRouterPort;
          }
        }

        if (config.agentType !== undefined) {
          agentData.fogType = config.agentType;
        } else if (config.fogType !== undefined) {
          const fogType =
            config.fogType === "Auto" ? 0 : config.fogType === "x86" ? 1 : 2;
          agentData.fogType = fogType;
        }

        return [agentData, null] as [any, string | null];
      }
      default:
        return [null, `Unsupported resource kind: ${kind}`] as [
          any,
          string | null,
        ];
    }

    // Normalize result to tuple format
    if (Array.isArray(result)) {
      if (result.length === 2) {
        return [result[0], result[1]] as [any, string | null];
      } else if (result.length === 1) {
        return [result[0], null] as [any, string | null];
      }
    }
    return [null, "Invalid parser result"] as [any, string | null];
  } catch (error: any) {
    return [null, error.message || "Unknown parsing error"] as [
      any,
      string | null,
    ];
  }
}

/**
 * Agent, Secret, CertificateAuthority, Certificate, ConfigMap, VolumeMount,
 * Registry, CatalogItem, Application, Microservice, Service
 */
function sortByDependencies(docs: any[]): any[] {
  // Define the order of resource kinds (matching CLI tool order)
  const kindOrder: ResourceKind[] = [
    "Agent",
    "Secret",
    "CertificateAuthority",
    "Certificate",
    "ConfigMap",
    "VolumeMount",
    "Registry",
    "CatalogItem",
    "Application",
    "Microservice",
    "Service",
  ];

  // Create a map for quick lookup of order index
  const kindOrderMap = new Map<ResourceKind, number>();
  kindOrder.forEach((kind, index) => {
    kindOrderMap.set(kind, index);
  });

  return docs.sort((a, b) => {
    const kindA = a?.kind as ResourceKind;
    const kindB = b?.kind as ResourceKind;

    const orderA = kindOrderMap.get(kindA);
    const orderB = kindOrderMap.get(kindB);

    // If both kinds are in the order list, sort by their position
    if (orderA !== undefined && orderB !== undefined) {
      return orderA - orderB;
    }

    // If only one is in the list, prioritize the one in the list
    if (orderA !== undefined) {
      return -1;
    }
    if (orderB !== undefined) {
      return 1;
    }

    // If neither is in the list, maintain original order
    return 0;
  });
}

/**
 * Main entry point: Parse unified YAML content
 */
export async function parseUnifiedYaml(content: string): Promise<ParseResult> {
  const resources: ParsedResource[] = [];
  const errors: string[] = [];

  try {
    // Parse all documents from YAML content
    const docs = yaml.loadAll(content);

    if (!Array.isArray(docs) && docs) {
      // Single document
      const docsArray = [docs];
      const sortedDocs = sortByDependencies(docsArray);

      for (const doc of sortedDocs) {
        if (!doc) {
          continue;
        }

        const kind = getResourceKind(doc);
        if (!kind) {
          errors.push(
            `Document has invalid or missing kind: ${JSON.stringify(doc.kind)}`,
          );
          continue;
        }

        const [parsed, parseError] = await routeToParser(doc, kind);
        if (parseError) {
          errors.push(`Error parsing ${kind}: ${parseError}`);
          continue;
        }

        const identifier = getResourceIdentifier(kind, parsed, doc);
        resources.push({
          kind,
          parsed,
          originalDoc: doc,
          identifier: identifier || "unknown",
        });
      }
    } else if (Array.isArray(docs)) {
      // Multiple documents
      const sortedDocs = sortByDependencies(docs);

      for (const doc of sortedDocs) {
        if (!doc) {
          continue;
        }

        const kind = getResourceKind(doc);
        if (!kind) {
          errors.push(
            `Document has invalid or missing kind: ${JSON.stringify(doc.kind)}`,
          );
          continue;
        }

        const [parsed, parseError] = await routeToParser(doc, kind);
        if (parseError) {
          errors.push(`Error parsing ${kind}: ${parseError}`);
          continue;
        }

        const identifier = getResourceIdentifier(kind, parsed, doc);
        resources.push({
          kind,
          parsed,
          originalDoc: doc,
          identifier: identifier || "unknown",
        });
      }
    } else {
      errors.push("Could not parse the file: Invalid YAML format");
    }
  } catch (e: any) {
    errors.push(`YAML parsing error: ${e.message || "Unknown error"}`);
  }

  return { resources, errors };
}

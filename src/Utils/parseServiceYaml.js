import lget from "lodash/get";

export const parseService = async (doc) => {
  if (!doc) {
    return [null, "Invalid YAML: Document is empty or null"];
  }

  if (doc.apiVersion !== "datasance.com/v3") {
    return [null, `Invalid API Version ${doc.apiVersion}, current version is datasance.com/v3`];
  }

  if (doc.kind !== "Service") {
    return [null, `Invalid kind ${doc.kind}, expected Service`];
  }

  if (!doc.metadata || !doc.spec) {
    return [null, "Invalid YAML format (missing metadata or spec)"];
  }

  const name = lget(doc, "metadata.name");
  if (!name) {
    return [null, "Invalid YAML format (missing metadata.name)"];
  }

  const spec = lget(doc, "spec", {});

  const apiObject = {
    name: name,
    type: lget(spec, "type", null),
    resource: lget(spec, "resource", null),
    defaultBridge: lget(spec, "defaultBridge", null),
    bridgePort: lget(spec, "bridgePort", 0),
    targetPort: lget(spec, "targetPort", 0),
    tags: lget(spec, "tags", []),
  };

  return [apiObject, null];
};
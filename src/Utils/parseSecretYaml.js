import lget from "lodash/get";

export const parseSecret = async (doc) => {
  if (!doc) {
    return [null, "Invalid YAML: Document is empty or null"];
  }

  if (doc.apiVersion !== "datasance.com/v3") {
    return [null, `Invalid API Version ${doc.apiVersion}, current version is datasance.com/v3`];
  }

  if (doc.kind !== "Secret") {
    return [null, `Invalid kind ${doc.kind}, expected Secret`];
  }

  if (!doc.metadata || !doc.spec || !doc.data) {
    return [null, "Invalid YAML format (missing metadata, spec, or data)"];
  }

  const name = lget(doc, "metadata.name");
  if (!name) {
    return [null, "Invalid YAML format (missing metadata.name)"];
  }

  const type = lget(doc, "spec.type", "Opaque");
  const data = lget(doc, "data", {});

  const apiObject = {
    name: name,
    type: type,
    data: data,
  };

  return [apiObject, null];
};
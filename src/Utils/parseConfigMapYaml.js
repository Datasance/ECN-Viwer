import lget from "lodash/get";

export const parseConfigMap = async (doc) => {
  if (!doc) {
    return [null, "Invalid YAML: Document is empty or null"];
  }

  if (doc.apiVersion !== "datasance.com/v3") {
    return [null, `Invalid API Version ${doc.apiVersion}, current version is datasance.com/v3`];
  }

  if (doc.kind !== "ConfigMap") {
    return [null, `Invalid kind ${doc.kind}, expected ConfigMap`];
  }

  if (!doc.metadata || !doc.data) {
    return [null, "Invalid YAML format (missing metadata or data)"];
  }

  const name = lget(doc, "metadata.name");
  if (!name) {
    return [null, "Invalid YAML format (missing metadata.name)"];
  }

  const data = lget(doc, "data", {});

  const apiObject = {
    name: name,
    data: data,
  };

  return [apiObject, null];
};
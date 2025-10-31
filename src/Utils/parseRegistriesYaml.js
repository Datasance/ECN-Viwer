import lget from "lodash/get";

export const parseRegistries = async (doc) => {
  if (!doc) {
    return [null, "Invalid YAML: Document is empty or null"];
  }

  if (doc.apiVersion !== "datasance.com/v3") {
    return [null, `Invalid API Version ${doc.apiVersion}, current version is datasance.com/v3`];
  }

  if (doc.kind !== "Registries") {
    return [null, `Invalid kind ${doc.kind}, expected Registries`];
  }

  if (!doc.metadata || !doc.data) {
    return [null, "Invalid YAML format (missing metadata or data)"];
  }

  const data = lget(doc, "data", {});
  const url = lget(data, "url");

  if (!url) {
    return [null, "Invalid YAML format (missing data.url)"];
  }

  const apiObject = {
    url: url,
    isPublic: lget(data, "isPublic", false),
    username: lget(data, "username", null),
    password: lget(data, "password", null),
    email: lget(data, "email", null),
    requiresCert: lget(data, "requiresCert", false),
    certificate: lget(data, "certificate", null),
  };

  return [apiObject, null];
};
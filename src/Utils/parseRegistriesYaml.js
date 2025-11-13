import lget from "lodash/get";

export const parseRegistries = async (doc) => {
  if (!doc) {
    return [null, "Invalid YAML: Document is empty or null"];
  }

  if (doc.apiVersion !== "datasance.com/v3") {
    return [
      null,
      `Invalid API Version ${doc.apiVersion}, current version is datasance.com/v3`,
    ];
  }

  if (doc.kind !== "Registry") {
    return [null, `Invalid kind ${doc.kind}, expected Registry`];
  }

  if (!doc.metadata || !doc.spec) {
    return [null, "Invalid YAML format (missing metadata or spec)"];
  }

  const spec = lget(doc, "spec", {});
  const url = lget(spec, "url");

  if (!url) {
    return [null, "Invalid YAML format (missing spec.url)"];
  }

  const apiObject = {
    url: url,
    isPublic: !lget(spec, "private", false),
    username: lget(spec, "username", null),
    password: lget(spec, "password", null),
    email: lget(spec, "email", null),
  };

  return [apiObject, null];
};

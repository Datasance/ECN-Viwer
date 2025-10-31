import lget from "lodash/get";

export const parseCatalogMicroservice = async (doc) => {
  if (!doc) {
    return [null, "Invalid YAML: Document is empty or null"];
  }

  if (doc.apiVersion !== "datasance.com/v3") {
    return [null, `Invalid API Version ${doc.apiVersion}, current version is datasance.com/v3`];
  }

  if (doc.kind !== "CatalogMicroservice") {
    return [null, `Invalid kind ${doc.kind}, expected CatalogMicroservice`];
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
    description: lget(spec, "description", ""),
    category: lget(spec, "category", ""),
    images: lget(spec, "images", []),
    publisher: lget(spec, "publisher", ""),
    diskRequired: lget(spec, "diskRequired", 0),
    ramRequired: lget(spec, "ramRequired", 0),
    picture: lget(spec, "picture", ""),
    isPublic: lget(spec, "isPublic", false),
    registryId: lget(spec, "registryId", 0),
    inputType: lget(spec, "inputType", {}),
    outputType: lget(spec, "outputType", {}),
    configExample: lget(spec, "configExample", ""),
  };

  return [apiObject, null];
};
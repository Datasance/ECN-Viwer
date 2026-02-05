import lget from "lodash/get";

export const parseServiceAccount = async (
  doc: any,
): Promise<[any, string | null]> => {
  if (!doc) {
    return [null, "Invalid YAML: Document is empty or null"];
  }

  if (doc.kind !== "ServiceAccount") {
    return [null, `Invalid kind ${doc.kind}, expected ServiceAccount`];
  }

  if (!doc.metadata) {
    return [null, "Invalid YAML format: metadata is required"];
  }

  const name = lget(doc, "metadata.name");
  if (!name) {
    return [null, "Invalid YAML format (missing metadata.name)"];
  }

  const roleRef = doc.roleRef;

  if (roleRef !== undefined && roleRef !== null) {
    if (!roleRef.kind || !roleRef.name) {
      return [null, "Invalid roleRef: kind and name are required"];
    }
  }

  const apiObject: any = {
    name: name,
  };

  if (roleRef !== undefined) {
    apiObject.roleRef = roleRef;
  }

  return [apiObject, null];
};

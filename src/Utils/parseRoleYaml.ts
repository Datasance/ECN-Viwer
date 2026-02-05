import lget from "lodash/get";

export const parseRole = async (doc: any): Promise<[any, string | null]> => {
  if (!doc) {
    return [null, "Invalid YAML: Document is empty or null"];
  }

  if (doc.kind !== "Role") {
    return [null, `Invalid kind ${doc.kind}, expected Role`];
  }

  if (!doc.metadata) {
    return [null, "Invalid YAML format: metadata is required"];
  }

  const name = lget(doc, "metadata.name");
  if (!name) {
    return [null, "Invalid YAML format (missing metadata.name)"];
  }

  const apiVersion = doc.apiVersion || "datasance.com/api/v3";
  const kind = doc.kind;
  const rules = doc.rules || [];

  // Validate rules structure
  if (Array.isArray(rules)) {
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (!rule.apiGroups || !Array.isArray(rule.apiGroups)) {
        return [null, `Invalid rule at index ${i}: apiGroups must be an array`];
      }
      if (!rule.resources || !Array.isArray(rule.resources)) {
        return [null, `Invalid rule at index ${i}: resources must be an array`];
      }
      if (!rule.verbs || !Array.isArray(rule.verbs)) {
        return [null, `Invalid rule at index ${i}: verbs must be an array`];
      }
      // Validate verbs enum
      const validVerbs = [
        "get",
        "list",
        "create",
        "update",
        "patch",
        "delete",
        "*",
      ];
      for (const verb of rule.verbs) {
        if (!validVerbs.includes(verb)) {
          return [
            null,
            `Invalid verb "${verb}" in rule at index ${i}. Allowed values are: ${validVerbs.join(", ")}`,
          ];
        }
      }
    }
  } else {
    return [null, "Rules must be an array"];
  }

  const apiObject = {
    name: name,
    kind: kind,
    rules: rules,
  };

  return [apiObject, null];
};

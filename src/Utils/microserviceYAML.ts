import yaml from "js-yaml";

interface Agent {
  uuid: string;
  name: string;
}

interface ReducedAgents {
  byUUID: Record<string, { name: string }>;
}

interface GetYAMLParams {
  microservice: any;
  activeAgents?: Agent[];
  reducedAgents?: ReducedAgents;
}

export const getMicroserviceYAMLFromJSON = ({
  microservice,
  activeAgents = [],
  reducedAgents = { byUUID: {} },
}: GetYAMLParams) => {
  if (!microservice) return {};

  let parsedConfig: any = {};

  try {
    parsedConfig =
      typeof microservice?.config === "string"
        ? JSON.parse(microservice.config)
        : microservice.config || {};
  } catch (e) {
    console.warn("Failed to parse microservice.config:", e);
    parsedConfig = microservice.config;
  }

  return {
    apiVersion: "datasance.com/v3",
    kind: "Microservice",
    metadata: {
      name: microservice.name,
    },
    spec: {
      uuid: microservice.uuid,
      name: microservice.name,
      agent: {
        name: activeAgents.find(
          (agent) => agent.uuid === microservice.iofogUuid,
        )?.name,
      },
      images: microservice.images.reduce(
        (acc: any, image: any) => {
          switch (image.fogTypeId) {
            case 1:
              acc.x86 = image.containerImage;
              break;
            case 2:
              acc.arm = image.containerImage;
              break;
          }
          return acc;
        },
        {
          registry: microservice.registryId,
          catalogItemId: microservice.catalogItemId,
        },
      ),
      container: {
        annotations: JSON.parse(microservice.annotations || "{}"),
        rootHostAccess: microservice.rootHostAccess,
        runAsUser: microservice?.runAsUser ?? "",
        ipcMode: microservice?.ipcMode ?? "",
        pidMode: microservice?.pidMode ?? "",
        platform: microservice?.platform ?? "",
        runtime: microservice?.runtime ?? "",
        cdiDevices: microservice?.cdiDevices ?? [],
        capAdd: microservice?.capAdd ?? [],
        capDrop: microservice?.capDrop ?? [],
        volumes: (microservice.volumeMappings || []).map((vm: any) => {
          const { id, ...rest } = vm;
          return rest;
        }),
        env: (microservice.env || []).map((env: any) => {
          const { id, ...rest } = env;
          const cleanedEnv: any = { ...rest };
          if (cleanedEnv.valueFromSecret === null) {
            delete cleanedEnv.valueFromSecret;
          }
          if (cleanedEnv.valueFromConfigMap === null) {
            delete cleanedEnv.valueFromConfigMap;
          }
          return cleanedEnv;
        }),
        extraHosts: (microservice.extraHosts || []).map((eH: any) => {
          const { id, ...rest } = eH;
          return rest;
        }),
        ports: (microservice.ports || []).map((p: any) => {
          if (p.host) {
            p.host = reducedAgents.byUUID[p.host]?.name || p.host;
          }
          return p;
        }),
        cpuSetCpus: microservice?.cpuSetCpus ?? "",
        ...(microservice?.memoryLimit !== undefined &&
          microservice?.memoryLimit !== null && {
            memoryLimit: microservice.memoryLimit,
          }),
        commands: Array.isArray(microservice.cmd) ? [...microservice.cmd] : [],
        healthCheck: microservice?.healthCheck ?? {},
      },
      schedule: microservice?.schedule ?? 50,
      msRoutes: {
        pubTags: microservice?.pubTags ?? [],
        subTags: microservice?.subTags ?? [],
      },
      config: parsedConfig,
      application: microservice?.application,
      rebuild: microservice?.rebuild,
    },
  };
};

export const dumpMicroserviceYAML = (params: GetYAMLParams) => {
  return yaml.dump(getMicroserviceYAMLFromJSON(params));
};

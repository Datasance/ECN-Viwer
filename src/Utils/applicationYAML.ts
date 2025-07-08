import yaml from 'js-yaml';

interface Agent {
  uuid: string;
  name: string;
}

interface ReducedAgents {
  byUUID: Record<string, { name: string }>;
}

interface Application {
  name: string;
  microservices: any[];
  routes: any[];
}

interface GetApplicationYAMLParams {
  application: Application;
  activeAgents?: Agent[];
  reducedAgents?: ReducedAgents;
}

export const getApplicationYAMLFromJSON = ({
  application,
  activeAgents = [],
  reducedAgents = { byUUID: {} },
}: GetApplicationYAMLParams): any => {
  if (!application) return {};

  const microservices = application.microservices?.map((ms: any) => {
    let parsedConfig: any = {};
    try {
      parsedConfig =
        typeof ms?.config === 'string' ? JSON.parse(ms.config) : ms.config || {};
    } catch (e) {
      console.warn(`Failed to parse config for ${ms.name}:`, e);
      parsedConfig = ms.config;
    }

    return {
      name: ms.name,
      agent: {
        name:
          activeAgents.find((a) => a.uuid === ms.iofogUuid)?.name ??
          reducedAgents.byUUID[ms.iofogUuid]?.name ??
          '__UNKNOWN__',
      },
      images: (ms.images || []).reduce(
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
          registry: ms.registryId ?? null,
          catalogItemId: ms.catalogItemId ?? null,
        }
      ),
      container: {
        annotations: JSON.parse(ms.annotations || '{}'),
        rootHostAccess: ms.rootHostAccess ?? false,
        runAsUser: ms.runAsUser ?? null,
        ipcMode: ms?.ipcMode ?? '',
        pidMode: ms?.pidMode ?? '',
        platform: ms.platform ?? null,
        runtime: ms.runtime ?? null,
        cdiDevices: ms.cdiDevices ?? [],
        capAdd: ms.capAdd ?? [],
        capDrop: ms.capDrop ?? [],
        volumes: (ms.volumeMappings || []).map((vm: any) => {
          const { id, ...rest } = vm;
          return rest;
        }),
        env: (ms.env || []).map((env: any) => {
          const { id, ...rest } = env;
          // Remove null values from valueFromSecret and valueFromConfigMap
          const cleanedEnv: any = { ...rest };
          // Only remove the property if it's explicitly null or undefined
          if (cleanedEnv.valueFromSecret === null || cleanedEnv.valueFromSecret === undefined) {
            delete cleanedEnv.valueFromSecret;
          }
          if (cleanedEnv.valueFromConfigMap === null || cleanedEnv.valueFromConfigMap === undefined) {
            delete cleanedEnv.valueFromConfigMap;
          }
          return cleanedEnv;
        }),
        extraHosts: (ms.extraHosts || []).map((eH: any) => {
          const { id, ...rest } = eH;
          return rest;
        }),
        ports: (ms.ports || []).map((p: any) => {
          if (p.host) {
            p.host = reducedAgents.byUUID[p.host]?.name || p.host;
          }
          return p;
        }),
        commands: Array.isArray(ms.cmd) ? [...ms.cmd] : [],
      },
      msRoutes: {
        pubTags: ms.pubTags ?? [],
        subTags: ms.subTags ?? [],
      },
      config: parsedConfig,
    };
  });

  const routes = application.routes?.map((r: any) => ({
    name: r.name,
    from: r.from,
    to: r.to,
  }));

  return {
    apiVersion: 'datasance.com/v3',
    kind: 'Application',
    metadata: {
      name: application.name,
    },
    spec: {
      microservices,
      routes,
    },
  };
};

export const dumpApplicationYAML = (params: GetApplicationYAMLParams): string => {
  return yaml.dump(getApplicationYAMLFromJSON(params), {
    noRefs: true,
    lineWidth: 0,
    quotingType: '"',
    forceQuotes: false,
  });
};

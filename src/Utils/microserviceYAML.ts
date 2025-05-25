import yaml from 'js-yaml';

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

export const getMicroserviceYAMLFromJSON = ({ microservice, activeAgents = [], reducedAgents = { byUUID: {} } }: GetYAMLParams) => {
  if (!microservice) {
    return {};
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
        name: activeAgents.find(agent => agent.uuid === microservice.iofogUuid)?.name,
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
        }
      ),
      container: {
        rootHostAccess: microservice.rootHostAccess,
        runAsUser: microservice?.runAsUser,
        platform: microservice?.platform,
        runtime: microservice?.runtime,
        cdiDevices: microservice?.cdiDevices ?? [],
        capAdd: microservice?.capAdd ?? [],
        capDrop: microservice?.capDrop ?? [],
        volumes: microservice.volumeMappings.map((vm: any) => {
          const { id, ...rest } = vm;
          return rest;
        }),
        env: microservice.env.map((env: any) => {
          const { id, ...rest } = env;
          return rest;
        }),
        extraHosts: microservice.extraHosts.map((eH: any) => {
          const { id, ...rest } = eH;
          return rest;
        }),
        ports: microservice.ports.map((p: any) => {
          if (p.host) {
            p.host = reducedAgents.byUUID[p.host]?.name || p.host;
          }
          return p;
        }),
        commands: microservice.cmd.map((cmd: any) => {
          const { id, ...rest } = cmd;
          return rest;
        }),
      },
      msRoutes: {
        pubTags: microservice?.pubTags ?? [],
        subTags: microservice?.subTags ?? [],
      },
      config: JSON.parse(microservice?.config),
      application: microservice?.application,
      rebuild: microservice?.rebuild,
    }
  };
};

export const dumpMicroserviceYAML = (params: GetYAMLParams) => {
  return yaml.dump(getMicroserviceYAMLFromJSON(params));
};

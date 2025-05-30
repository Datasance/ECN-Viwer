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
}: GetApplicationYAMLParams) => {
  if (!application) {
    return {};
  }

  return {
    apiVersion: "datasance.com/v3",
    kind: "Application",
    metadata: {
      name: application.name,
    },
    spec: {
      microservices: application.microservices?.map((ms: any) => ({
        name: ms.name,
        agent: {
          name:
            activeAgents.find((a) => a.uuid === ms.iofogUuid)?.name ??
            reducedAgents.byUUID[ms.iofogUuid]?.name ??
            '__UNKNOWN__',
        },
        images: ms.images.reduce(
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
            registry: ms.registryId,
            catalogItemId: ms.catalogItemId,
          }
        ),
        container: {
          rootHostAccess: ms.rootHostAccess,
          runAsUser: ms?.runAsUser,
          platform: ms?.platform,
          runtime: ms?.runtime,
          cdiDevices: ms?.cdiDevices ?? [],
          capAdd: ms?.capAdd ?? [],
          capDrop: ms?.capDrop ?? [],
          volumes: ms.volumeMappings.map((vm: any) => {
            const { id, ...rest } = vm;
            return rest;
          }),
          env: ms.env.map((env: any) => {
            const { id, ...rest } = env;
            return rest;
          }),
          extraHosts: ms.extraHosts.map((eH: any) => {
            const { id, ...rest } = eH;
            return rest;
          }),
          ports: ms.ports.map((p: any) => {
            if (p.host) {
              p.host = reducedAgents.byUUID[p.host]?.name || p.host;
            }
            return p;
          }),
          commands: ms.cmd.map((cmd: any) => {
            const { id, ...rest } = cmd;
            return rest;
          }),
        },
        msRoutes: {
          pubTags: ms?.pubTags ?? [],
          subTags: ms?.subTags ?? [],
        },
        config: JSON.parse(ms?.config || '{}'),
      })),
      routes: application.routes?.map((r: any) => ({
        name: r.name,
        from: r.from,
        to: r.to,
      })),
    },
  };
};

export const dumpApplicationYAML = (params: GetApplicationYAMLParams) => {
  return yaml.dump(getApplicationYAMLFromJSON(params));
};

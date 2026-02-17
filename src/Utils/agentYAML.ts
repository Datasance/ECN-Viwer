import yaml from "js-yaml";

const AGENT_API_VERSION = "datasance.com/v3";

const toFogTypeLabel = (fogTypeId: number | string | undefined) => {
  if (fogTypeId === 1 || fogTypeId === "1") {
    return "x86";
  }
  if (fogTypeId === 2 || fogTypeId === "2") {
    return "arm";
  }
  return "Auto";
};

const toFogTypeValue = (fogType: string | number | undefined) => {
  if (fogType === 1 || fogType === "1" || fogType === "x86") {
    return 1;
  }
  if (fogType === 2 || fogType === "2" || fogType === "arm") {
    return 2;
  }
  return 0;
};

export const buildAgentYamlObject = (agent: any) => {
  const config = {
    location: agent?.location,
    latitude: agent?.latitude,
    longitude: agent?.longitude,
    description: agent?.description,
    fogType: toFogTypeLabel(agent?.fogTypeId),
    networkInterface: agent?.networkInterface,
    dockerUrl: agent?.dockerUrl,
    containerEngine: agent?.containerEngine,
    deploymentType: agent?.deploymentType,
    diskLimit: agent?.diskLimit,
    diskDirectory: agent?.diskDirectory,
    memoryLimit: agent?.memoryLimit,
    cpuLimit: agent?.cpuLimit,
    logLimit: agent?.logLimit,
    logDirectory: agent?.logDirectory,
    logFileCount: agent?.logFileCount,
    statusFrequency: agent?.statusFrequency,
    changeFrequency: agent?.changeFrequency,
    deviceScanFrequency: agent?.deviceScanFrequency,
    bluetoothEnabled: agent?.bluetoothEnabled,
    watchdogEnabled: agent?.watchdogEnabled,
    gpsMode: agent?.gpsMode,
    gpsScanFrequency: agent?.gpsScanFrequency,
    gpsDevice: agent?.gpsDevice,
    edgeGuardFrequency: agent?.edgeGuardFrequency,
    abstractedHardwareEnabled: agent?.abstractedHardwareEnabled,
    upstreamRouters: agent?.upstreamRouters ?? [],
    upstreamNatsServers: agent?.upstreamNatsServers ?? [],
    routerConfig: {
      routerMode: agent?.routerMode,
      messagingPort: agent?.messagingPort,
      edgeRouterPort: agent?.edgeRouterPort,
      interRouterPort: agent?.interRouterPort,
    },
    natsConfig: {
      natsMode: agent?.natsMode,
      natsServerPort: agent?.natsServerPort,
      natsLeafPort: agent?.natsLeafPort,
      natsClusterPort: agent?.natsClusterPort,
      natsMqttPort: agent?.natsMqttPort,
      natsHttpPort: agent?.natsHttpPort,
    },
    logLevel: agent?.logLevel,
    dockerPruningFrequency: agent?.dockerPruningFrequency,
    availableDiskThreshold: agent?.availableDiskThreshold,
    timeZone: agent?.timeZone,
  };

  return {
    apiVersion: AGENT_API_VERSION,
    kind: "Agent",
    metadata: {
      name: agent?.name,
      tags: agent?.tags,
    },
    spec: {
      name: agent?.name,
      host: agent?.host,
      config,
    },
  };
};

export const dumpAgentYAML = (agent: any) =>
  yaml.dump(buildAgentYamlObject(agent), { noRefs: true, indent: 2 });

export const parseAgentYamlDocument = async (
  doc: any,
): Promise<[any, string | null]> => {
  if (doc?.apiVersion !== AGENT_API_VERSION) {
    return [
      null,
      `Invalid API Version ${doc?.apiVersion}, current version is ${AGENT_API_VERSION}`,
    ];
  }

  if (doc?.kind !== "Agent" && doc?.kind !== "AgentConfig") {
    return [null, `Invalid kind ${doc?.kind}, expected Agent`];
  }

  if (!doc?.metadata || !doc?.spec) {
    return [null, "Invalid YAML format (missing metadata or spec)"];
  }

  const metadata = doc.metadata ?? {};
  const spec = doc.spec ?? {};
  const config = spec.config ?? spec;
  const routerConfig = config.routerConfig ?? {};
  const natsConfig = config.natsConfig ?? {};

  const agentData: any = {
    name: spec.name || metadata.name,
    host: spec.host,
    ...config,
    tags: metadata.tags,
    routerMode: routerConfig.routerMode,
    messagingPort: routerConfig.messagingPort,
    edgeRouterPort: routerConfig.edgeRouterPort,
    interRouterPort: routerConfig.interRouterPort,
    natsMode: natsConfig.natsMode,
    natsServerPort: natsConfig.natsServerPort,
    natsLeafPort: natsConfig.natsLeafPort,
    natsClusterPort: natsConfig.natsClusterPort,
    natsMqttPort: natsConfig.natsMqttPort,
    natsHttpPort: natsConfig.natsHttpPort,
    upstreamRouters: config.upstreamRouters ?? [],
    upstreamNatsServers: config.upstreamNatsServers ?? [],
  };

  if (config.agentType !== undefined) {
    agentData.fogType = config.agentType;
  } else if (config.fogType !== undefined) {
    agentData.fogType = toFogTypeValue(config.fogType);
  }

  delete agentData.routerConfig;
  delete agentData.natsConfig;

  return [agentData, null];
};

export const buildAgentPatchBodyFromYamlContent = (content: string) => {
  const parsed = yaml.load(content) as any;
  const metadata = parsed?.metadata ?? {};
  const spec = parsed?.spec ?? {};
  const config = spec.config ?? spec;
  const patchBody: any = {
    ...config,
    name: spec.name ?? metadata.name,
    host: spec.host,
    tags: metadata.tags,
  };

  if (config.routerConfig) {
    patchBody.routerMode = config.routerConfig.routerMode;
    patchBody.messagingPort = config.routerConfig.messagingPort;
    if (config.routerConfig.edgeRouterPort !== undefined) {
      patchBody.edgeRouterPort = config.routerConfig.edgeRouterPort;
    }
    if (config.routerConfig.interRouterPort !== undefined) {
      patchBody.interRouterPort = config.routerConfig.interRouterPort;
    }
  }

  if (config.natsConfig) {
    patchBody.natsMode = config.natsConfig.natsMode;
    patchBody.natsServerPort = config.natsConfig.natsServerPort;
    patchBody.natsLeafPort = config.natsConfig.natsLeafPort;
    patchBody.natsClusterPort = config.natsConfig.natsClusterPort;
    patchBody.natsMqttPort = config.natsConfig.natsMqttPort;
    patchBody.natsHttpPort = config.natsConfig.natsHttpPort;
  }

  patchBody.fogType = toFogTypeValue(config.fogType);
  delete patchBody.routerConfig;
  delete patchBody.natsConfig;

  return patchBody;
};

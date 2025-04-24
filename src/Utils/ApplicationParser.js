import lget from 'lodash/get'

const mapImages = (images) => {
  const imgs = []
  if (images.x86) {
    imgs.push({
      fogTypeId: 1,
      containerImage: images.x86
    })
  }
  if (images.arm) {
    imgs.push({
      fogTypeId: 2,
      containerImage: images.arm
    })
  }
  return imgs
}

const parseMicroserviceImages = async (fileImages) => {
  if (fileImages.catalogItemId) {
    return { registryId: undefined, images: undefined, catalogItemId: fileImages.catalogItemId }
  }
  const registryByName = {
    remote: 1,
    local: 2
  }
  const images = mapImages(fileImages)
  const registryId = fileImages.registry ? registryByName[fileImages.registry] || window.parseInt(fileImages.registry) : 1
  return { registryId, catalogItemId: undefined, images }
}

const _deleteUndefinedFields = (obj) => Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key])

export const parseMicroservice = async (microservice) => {
  const { registryId, catalogItemId, images } = await parseMicroserviceImages(microservice.images)
  const microserviceData = {
    config: microservice.config ? JSON.stringify(microservice.config) : undefined,
    name: microservice.name,
    logSize: microservice.logSize,
    catalogItemId,
    agentName: lget(microservice, 'agent.name'),
    registryId,
    ...microservice.container,
    annotations: microservice.container.annotations ? JSON.stringify(microservice.container.annotations) : undefined,
    ports: lget(microservice, 'container.ports', []).map(p => ({ ...p, publicPort: p.public })),
    volumeMappings: lget(microservice, 'container.volumes', []),
    cmd: lget(microservice, 'container.commands', []),
    env: lget(microservice, 'container.env', []).map(e => ({ key: e.key.toString(), value: e.value.toString() })),
    images,
    extraHosts: lget(microservice, 'container.extraHosts', []),
    rebuild: microservice.rebuild,
    runAsUser: microservice.runAsUser !== null || microservice?.container?.runAsUser !== null ? microservice.runAsUser !== undefined ? microservice.runAsUser : microservice?.container?.runAsUser : "",
    platform: microservice.platform !== null || microservice?.container?.platform !== null ? microservice.platform !== undefined ? microservice.platform : microservice?.container?.platform : "",
    runtime: microservice.runtime !== null || microservice?.container?.runtime !== null ? microservice.runtime !== undefined ? microservice.runtime : microservice?.container?.runtime : "",
    cdiDevices: microservice.cdiDevices !== null || microservice?.container?.cdiDevices !== null ? microservice.cdiDevices !== undefined ? microservice.cdiDevices : microservice?.container?.cdiDevices : "",
    capAdd: microservice.capAdd !== null || microservice?.container?.capAdd !== null ? microservice.capAdd !== undefined ? microservice.capAdd : microservice?.container?.capAdd : "",
    capDrop: microservice.capDrop !== null || microservice?.container?.capDrop !== null ? microservice.capDrop !== undefined ? microservice.capDrop : microservice?.container?.capDrop : "",
    ...microservice.msroutes,
    pubTags: microservice.pubTags !== null || microservice?.msRoutes?.pubTags !== null ? microservice.pubTags !== undefined ? microservice.pubTags : microservice?.msRoutes?.pubTags : "",
    subTags: microservice.subTags !== null || microservice?.msRoutes?.subTags !== null ? microservice.subTags !== undefined ? microservice.subTags : microservice?.msRoutes?.subTags : "",
  }
  _deleteUndefinedFields(microserviceData)
  return microserviceData
}

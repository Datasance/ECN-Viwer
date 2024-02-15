const deleteAgent = (request) => async (agent) => {
  return request('/api/v1/iofog/' + agent.uuid, { method: 'DELETE' })
}

const listAgents = (request) => async () => {
  const agentsResponse = await request('/api/v1/iofog-list')
  if (!agentsResponse.ok) {
    throw new Error({ message: agentsResponse.statusText })
  }
  return (await agentsResponse.json()).fogs
}

export default {
  deleteAgent,
  listAgents
}

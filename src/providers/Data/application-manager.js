/* eslint-disable import/no-anonymous-default-export */
const deleteApplication = (request) => async (app) => {
  return request("/api/v3/application/" + app.name, { method: "DELETE" });
};

const listApplications = (request) => async () => {
  const agentsResponse = await request("/api/v3/application");
  if (!agentsResponse.ok) {
    throw new Error({ message: agentsResponse.statusText });
  }
  return (await agentsResponse.json()).applications;
};

const listSystemApplications = (request) => async () => {
  const agentsResponse = await request("/api/v3/application/system");
  if (!agentsResponse.ok) {
    throw new Error({ message: agentsResponse.statusText });
  }
  return (await agentsResponse.json()).applications;
};

const toggleApplication = (request) => async (app) => {
  const agentsResponse = await request(`/api/v3/application/${app.name}`, {
    method: "PATCH",
    body: {
      isActivated: !app.isActivated,
    },
  });
  if (!agentsResponse.ok) {
    throw new Error({ message: agentsResponse.statusText });
  }
  return agentsResponse;
};

export default {
  deleteApplication,
  listApplications,
  toggleApplication,
  listSystemApplications,
};

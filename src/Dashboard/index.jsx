import { useData } from '../providers/Data';
import AgentDashboard from './component/AgentDashboard';
import { useEffect } from 'react';
import ApplicationDashboard from './component/ApplicationsDashboard';
import MicroservicesDashboard from './component/MicroservicesDashboard';
import SystemMicroservicesDashboard from './component/SystemMicroservicesDashboard';

const Dashboard = () => {
  const { data } = useData();
  useEffect(() => {
    console.log(data)
  }, [data])


  return (
    <div className="max-h-[90.8vh] min-h-[90.8vh] bg-gray-900 text-white overflow-auto p-2">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1 md:col-span-2">
          <AgentDashboard
            agentData={Object.values(data?.reducedAgents?.byName || [])}
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <ApplicationDashboard
            applications={data?.applications}
            title={"Application"}
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <ApplicationDashboard
            applications={data?.systemApplications}
            title={"System Application"}
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <MicroservicesDashboard
            activeMsvcs={data?.activeMsvcs}
            title={"Microservice"}
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <SystemMicroservicesDashboard
            systemApplications={data?.systemApplications}
            title={"System Microservice"}
          />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;

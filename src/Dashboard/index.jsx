import { useData } from '../providers/Data';
import AgentDashboard from './component/AgentDashboard';
import { useEffect } from 'react';
import ApplicationDashboard from './component/ApplicationsDashboard';
import MicroservicesDashboard from './component/MicroservicesDashboard';

const Dashboard = () => {
  const { data } = useData();
  useEffect(() => {
  }, [data])


  return (
    <div className="max-h-[88vh] min-h-[88vh]  bg-gray-900 text-white p-6 overflow-auto">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1 md:col-span-2">
          <AgentDashboard
            agentData={data?.activeAgents}
          />
        </div>
        <ApplicationDashboard
          applications={data?.applications}
          title={"Application"}
        />
        <ApplicationDashboard
          applications={data?.systemApplications}
          title={"System Application"}
        />
        <MicroservicesDashboard
          activeMsvcs={data?.activeMsvcs}
          title={"Microservice"}
        />
      </div>

    </div>
  );
};

export default Dashboard;

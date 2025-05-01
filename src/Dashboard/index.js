import { useData } from '../providers/Data';
import AgentDashboard from './component/AgentDashboard';
import { useEffect } from 'react';
import ApplicationDashboard from './component/ApplicationsDashboard';

const Dashboard = () => {
  const { data } = useData();
  useEffect(() => {
    console.log(data)
  }, [data])


  return (
    <div className="min-h-screen max-h-screen  bg-gray-900 text-white p-6 space-y-8 overflow-auto">
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
      </div>

    </div>
  );
};

export default Dashboard;

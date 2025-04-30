import React, { useEffect, useState } from 'react';
import { useData } from '../providers/Data';
import CustomProgressBar from '../CustomComponent/CustomProgressBar';
import CustomAgentsCard from '../CustomComponent/CustomAgentsCard';
import CustomStatusBadge from '../CustomComponent/CustomStatusBadge';
import CustomApplicationsCard from '../CustomComponent/CustomApplicationsCard';
import CustomSystemApplicationsCard from '../CustomComponent/CustomSystemApplicationsCard';
import CustomDataTable from '../CustomComponent/CustomDataTable';

const Dashboard = () => {
  const { data } = useData();
  const [activeTab, setActiveTab] = useState('Agents');
  const [agentRows, setAgentRows] = useState([]);
  const [applicationsRows, setApplicationsRows] = useState([]);

  useEffect(() => {
    if (!data?.activeAgents) return;
    debugger
    const rows = data.activeAgents.map(agent => ({
      ipAddress: agent.ipAddress,
      uuid: agent.uuid,
      name: agent.name,
      status: agent.daemonStatus,
      cpu: (agent.cpuUsage * 100).toFixed(2),
      cpuLimit: 100,
      memory: (agent.memoryUsage / 1024 / 1024).toFixed(1),
      memoryLimit: agent.memoryLimit || 0,
      disk: (agent.systemAvailableDisk / 1024 ** 3).toFixed(1),
      version: agent.version,
      uptime: Math.floor(agent.daemonOperatingDuration / 1000 / 60) + ' min',
      microservices: (data.activeMsvcs || []).filter(msvc => msvc.iofogUuid === agent.uuid)
    }));
    setAgentRows(rows);

    const applicationRows = data.applications.map(app => ({
      name: app.name,
      uuid: app.uuid,
      microservices: app.microservices || [],
      agents: app.agents || [],
      createdAt: app.createdAt ? new Date(app.createdAt).toLocaleString() : 'N/A',
      updatedAt: app.updatedAt ? new Date(app.updatedAt).toLocaleString() : 'N/A',
      status: app.status || 'Unknown',
    }));
    setApplicationsRows(applicationRows)

  }, [data]);

  const agentColumns = [
    { key: 'ipAddress', header: 'IP Address' },
    { key: 'name', header: 'Name' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <CustomStatusBadge status={row.status} />
          <span className="font-bold">{row.status}</span>
        </div>
      ),
    },
    {
      key: 'cpu',
      header: 'CPU',
      render: (row) => (
        <CustomProgressBar value={parseFloat(row.cpu)} max={100} unit="%" />
      ),
    },
    {
      key: 'memory',
      header: 'Memory',
      render: (row) => (
        <CustomProgressBar value={parseFloat(row.memory)} max={row.memoryLimit} unit="MB" />
      ),
    },
    { key: 'disk', header: 'Disk (GB)' },
    { key: 'uptime', header: 'Uptime' },
    { key: 'version', header: 'Version' },
  ];

  const applicationColumns = [
    { key: 'name', header: 'Name' },
    { key: 'uuid', header: 'UUID' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <CustomStatusBadge status={row.status} />
          <span className="font-bold">{row.status}</span>
        </div>
      ),
    },
    {
      key: 'cpu',
      header: 'CPU',
      render: (row) => (
        <CustomProgressBar value={parseFloat(row.cpu)} max={100} unit="%" />
      ),
    },
    {
      key: 'memory',
      header: 'Memory',
      render: (row) => (
        <CustomProgressBar value={parseFloat(row.memory)} max={512} unit="MB" />
      ),
    },
  ];
  

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Agents', value: data?.activeAgents?.length || 0 },
          { title: 'Applications', value: data?.applications?.length || 0 },
          { title: 'System Applications', value: data?.systemApplications?.length || 0 }
        ].map(tab => (
          <div
            key={tab.title}
            onClick={() => setActiveTab(tab.title)}
            className={`cursor-pointer rounded-2xl transition-all ${activeTab === tab.title
              ? 'border-2 border-white bg-gray-800'
              : 'hover:bg-gray-700'
              }`}
          >
            {tab.title === "Agents" && <CustomAgentsCard
              cardTitle={tab.title}
              dataArray={data?.activeAgents}
            />}
            {tab.title === "Applications" && <CustomApplicationsCard
              cardTitle={tab.title}
              applications={data?.applications}
            />}
            {tab.title === "System Applications" && <CustomSystemApplicationsCard
              cardTitle={tab.title}
              activeAgents={data?.activeAgents}
              systemApplications={data?.systemApplications}
            />}
          </div>
        ))}
      </div>
      


      <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
        {activeTab === 'Agents' && (
          <CustomDataTable
            columns={agentColumns}
            data={agentRows}
            getRowKey={(row) => row.uuid}
            expandableRowRender={(row) =>
              row.microservices?.length > 0 ? (
                <>
                  <h3 className="text-lg font-normal mb-2 text-start">
                    Microservices for <span className="font-bold">{row.name}</span>
                  </h3>
                  <table className="w-full text-sm text-gray-200 text-center">
                    <thead>
                      <tr className="bg-gray-800">
                        {['Name', 'Status', 'CPU', 'Memory'].map(h => (
                          <th key={h} className="px-3 py-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {row.microservices.map(msvc => (
                        <tr key={msvc.uuid} className="border-b border-gray-600 hover:bg-gray-600/50">
                          <td className="px-3 py-2">{msvc.name}</td>
                          <td className="px-3 py-2 flex items-center justify-center gap-1">
                            <CustomStatusBadge status={msvc.status.status} />
                            <span>{msvc.status.status}</span>
                          </td>
                          <td className="px-3 py-2">
                            <CustomProgressBar
                              value={(msvc.status.cpuUsage * 100).toFixed(2)}
                              max={100}
                              unit="%"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <CustomProgressBar
                              value={(msvc.status.memoryUsage / 1024 / 1024).toFixed(1)}
                              max={512}
                              unit="MB"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className="text-center text-gray-400">No microservices available.</div>
              )
            }
          />
        )}
        {activeTab === 'Applications' && (
          <CustomDataTable
            columns={applicationColumns}
            data={applicationsRows}
            getRowKey={(row) => row.uuid}
            expandableRowRender={(row) =>
              row.microservices?.length > 0 ? (
                <>
                  <h3 className="text-lg font-normal mb-2 text-start">
                    Microservices for <span className="font-bold">{row.name}</span>
                  </h3>
                  <table className="w-full text-sm text-gray-200 text-center">
                    <thead>
                      <tr className="bg-gray-800">
                        {['Name', 'Status', 'CPU', 'Memory'].map(h => (
                          <th key={h} className="px-3 py-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {row.microservices.map(msvc => (
                        <tr key={msvc.uuid} className="border-b border-gray-600 hover:bg-gray-600/50">
                          <td className="px-3 py-2">{msvc.name}</td>
                          <td className="px-3 py-2 flex items-center justify-center gap-1">
                            <CustomStatusBadge status={msvc.status?.status || 'Unknown'} />
                            <span>{msvc.status?.status || 'Unknown'}</span>
                          </td>
                          <td className="px-3 py-2">
                            <CustomProgressBar
                              value={((msvc.status?.cpuUsage || 0) * 100).toFixed(2)}
                              max={100}
                              unit="%"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <CustomProgressBar
                              value={((msvc.status?.memoryUsage || 0) / 1024 / 1024).toFixed(1)}
                              max={512}
                              unit="MB"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className="text-center text-gray-400">No microservices available.</div>
              )
            }
          />
        )}

        {activeTab === 'System Applications' && (
          <div className="text-center text-gray-400">System Applications tab content coming soon...</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

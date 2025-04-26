import React, { useEffect, useState } from 'react';
import { useData } from '../providers/Data';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import CustomProgressBar from '../CustomComponent/CustomProgressBar';
import CustomAgentsCard from '../CustomComponent/CustomAgentsCard';
import CustomStatusBadge from '../CustomComponent/CustomStatusBadge';

const Dashboard = () => {
  const { data } = useData();
  const [agentRows, setAgentRows] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [activeTab, setActiveTab] = useState('Agents');

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
  }, [data]);

  const toggleRow = uuid => {
    const copy = new Set(expandedRows);
    if (copy.has(uuid)) copy.delete(uuid);
    else copy.add(uuid);
    setExpandedRows(copy);
  };

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
          </div>
        ))}
      </div>


      <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
        {activeTab === 'Agents' && (
          <>
            <h2 className="text-2xl font-semibold mb-4">Agents Overview</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-300">
                <thead className="bg-gray-700 text-xs uppercase">
                  <tr>
                    {['IP Adress', 'Name', 'Status', 'CPU', 'Memory', 'Disk (GB)', 'Uptime', 'Version', ''].map(header => (
                      <th key={header} className="px-4 py-2 text-center">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agentRows.map(row => (
                    <React.Fragment key={row.uuid}>
                      <tr
                        className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer"
                        onClick={() => toggleRow(row.uuid)}
                      >
                        <td className="px-4 py-2 font-medium text-center">{row.ipAddress}</td>
                        <td className="px-4 py-2 font-medium text-center">{row.name}</td>
                        <td className="px-4 py-2 flex items-center justify-center gap-1">
                          <CustomStatusBadge status={row.status} />
                          <span className="font-bold">{row.status}</span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <CustomProgressBar value={parseFloat(row.cpu)} max={100} unit="%" />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <CustomProgressBar value={parseFloat(row.memory)} max={row.memoryLimit} unit="MB" />
                        </td>
                        <td className="px-4 py-2 text-center">{row.disk} GB</td>
                        <td className="px-4 py-2 text-center">{row.uptime}</td>
                        <td className="px-4 py-2 text-center">{row.version}</td>
                        <td className="px-4 py-2 text-center">
                          {row.microservices?.length > 0 ? (
                            expandedRows.has(row.uuid) ? (
                              <ExpandLessIcon className="text-gray-300" />
                            ) : (
                              <ExpandMoreIcon className="text-gray-300" />
                            )
                          ) : null}
                        </td>
                      </tr>

                      {row.microservices?.length > 0 && expandedRows.has(row.uuid) && (
                        <tr>
                          <td colSpan={8} className="bg-gray-700 p-4">
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
                                  <tr
                                    key={msvc.uuid}
                                    className="border-b border-gray-600 hover:bg-gray-600/50"
                                  >
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
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {activeTab === 'Applications' && (
          <div className="text-center text-gray-400">Applications tab content coming soon...</div>
        )}
        {activeTab === 'System Applications' && (
          <div className="text-center text-gray-400">System Applications tab content coming soon...</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

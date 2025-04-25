import React, { useEffect, useState } from 'react';
import { useData } from '../providers/Data';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';

// Reusable ProgressBar component
const ProgressBar = ({ value, max = 100, unit }) => {
  const percent = Math.min((value / max) * 100, 100).toFixed(1);
  return (
    <div className="space-y-1">
      <div className="w-full bg-gray-600 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-green-400 h-2.5"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-xs text-gray-400">
        {unit === '%' ? `${percent}%` : `${value}${unit}`}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const color = status === 'RUNNING' ? 'bg-green-400' : status === 'ERROR' ? 'bg-red-400' : 'bg-yellow-400';
  return <span className={`${color} inline-block w-2 h-2 rounded-full mr-2`} />;
};

const Dashboard = () => {
  const { data } = useData();
  const [agentRows, setAgentRows] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    if (!data?.activeAgents) return;

    const rows = data.activeAgents.map(agent => ({
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
      <h1 className="text-3xl font-bold">System Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Agents" value={data?.activeAgents?.length || 0} />
        <StatCard title="Applications" value={data?.applications?.length || 0} />
        <StatCard title="Microservices" value={data?.activeMsvcs?.length || 0} />
        <StatCard title="System Apps" value={data?.systemApplications?.length || 0} />
      </div>

      <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Agents Overview</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-300">
            <thead className="bg-gray-700 text-xs uppercase">
              <tr>
                {['Name', 'Status', 'CPU', 'Memory', 'Disk (GB)', 'Uptime', 'Version', ''].map(header => (
                  <th key={header} className="px-4 py-2 text-left">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agentRows.map(row => (
                <React.Fragment key={row.uuid}>
                  <tr className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-medium">{row.name}</td>
                    <td className="px-4 py-2 flex items-center">
                      <StatusBadge status={row.status} />
                      <span className="font-bold">{row.status}</span>
                    </td>
                    <td className="px-4 py-2">
                      <ProgressBar value={parseFloat(row.cpu)} max={100} unit="%" />
                    </td>
                    <td className="px-4 py-2">
                      <ProgressBar value={parseFloat(row.memory)} max={row.memoryLimit} unit="MB" />
                    </td>
                    <td className="px-4 py-2">{row.disk} GB</td>
                    <td className="px-4 py-2">{row.uptime}</td>
                    <td className="px-4 py-2">{row.version}</td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => toggleRow(row.uuid)}>
                        {expandedRows.has(row.uuid) ? <ExpandLessIcon className="text-gray-300" /> : <ExpandMoreIcon className="text-gray-300" />}
                      </button>
                    </td>
                  </tr>
                  {expandedRows.has(row.uuid) && (
                    <tr>
                      <td colSpan={8} className="bg-gray-700 p-4">
                        <h3 className="text-lg font-semibold mb-2">Microservices for {row.name}</h3>
                        <table className="w-full text-sm text-gray-300">
                          <thead>
                            <tr className="bg-gray-800">
                              {['Name', 'Status', 'CPU', 'Memory'].map(h => (
                                <th key={h} className="px-3 py-2 text-left">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {row.microservices.map(msvc => (
                              <tr key={msvc.uuid} className="border-b border-gray-600 hover:bg-gray-600/50">
                                <td className="px-3 py-2">{msvc.name}</td>
                                <td className="px-3 py-2 flex items-center">
                                  <StatusBadge status={msvc.status.status} />
                                  <span>{msvc.status.status}</span>
                                </td>
                                <td className="px-3 py-2">
                                  <ProgressBar value={(msvc.status.cpuUsage * 100).toFixed(2)} max={100} unit="%" />
                                </td>
                                <td className="px-3 py-2">
                                  <ProgressBar value={((msvc.status.memoryUsage / 1024 / 1024).toFixed(1))} max={512} unit="MB" />
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
      </div>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-center shadow-lg">
    <div className="text-4xl font-bold">{value}</div>
    <div className="text-sm text-gray-200">{title}</div>
  </div>
);

export default Dashboard;
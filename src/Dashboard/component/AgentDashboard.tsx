import React from 'react';
import ApexCharts from 'react-apexcharts';
import { StatusColor, StatusType } from '../../Utils/Enums/StatusColor';
import { MiBFactor, prettyBytes } from '../../ECNViewer/utils';

interface AgentData {
  uuid: string;
  name: string;
  daemonStatus: string;
  memoryUsage: number;
  diskUsage: number;
  cpuUsage: number;
}

interface AgentDashboardProps {
  agentData: Record<string, AgentData> | undefined;
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({ agentData }) => {
  if (!agentData) return <div>Loading...</div>;

  const agentArray = Object.values(agentData);

  const runningCount = agentArray.filter(agent => agent.daemonStatus === StatusType.RUNNING).length;
  const notRunningCount = agentArray.filter(agent => agent.daemonStatus !== StatusType.RUNNING).length;

  const daemonStatusChartSeries = [runningCount, notRunningCount];

  const daemonStatusLabels = [StatusType.RUNNING, StatusType.STOPPED];
  const daemonStatusColors = [StatusColor[StatusType.RUNNING], StatusColor[StatusType.STOPPED]];

  const daemonStatusChartOptions = {
    chart: { type: 'donut' as const, background: '#333' },
    labels: daemonStatusLabels,
    colors: daemonStatusColors,
    dataLabels: { enabled: true },
    tooltip: {
      y: {
        formatter: function (_val: number, opts: any) {
          const isRunning = opts.seriesIndex === 0;
          const agentNames = agentArray
            .filter(agent => (isRunning ? agent.daemonStatus === StatusType.RUNNING : agent.daemonStatus !== StatusType.RUNNING))
            .map(agent => `- ${agent.name}`)
            .join('<br />');
          return agentNames || 'No agents';
        },
      },
    },
    legend: {
      labels: { colors: '#fff' },
      position: 'bottom' as const,
      horizontalAlign: 'center' as const,
    },
    theme: { mode: 'dark' as const },
  };

  const statusGroups: Record<string, typeof agentArray> = {};
  agentArray.forEach(agent => {
    if (!statusGroups[agent.daemonStatus]) {
      statusGroups[agent.daemonStatus] = [];
    }
    statusGroups[agent.daemonStatus].push(agent);
  });

  const bubbleSeries = Object.keys(statusGroups).map(status => ({
    name: status,
    color: StatusColor[status as keyof typeof StatusColor] || '#FFFFFF',
    data: statusGroups[status].map(agent => ({
      x: agent.cpuUsage || 0,
      y: agent.memoryUsage ? (agent.memoryUsage * MiBFactor) / (1024 * 1024) : 0,
      z: agent.diskUsage ? (agent.diskUsage * MiBFactor) / (1024 * 1024) : 0,
      daemonStatus: agent.daemonStatus,
      name: agent.name,
    })),
  }));

  const memoryValues = agentArray.map(agent =>
    agent.memoryUsage ? (agent.memoryUsage * MiBFactor) / (1024 * 1024) : 0
  );
  const maxMemory = Math.max(...memoryValues);
  const dynamicYMax = maxMemory > 0 ? Math.ceil(maxMemory * 1.2) : 1000;

  const cpuValues = agentArray.map(agent =>
    agent.cpuUsage ? Number(agent.cpuUsage) : 0
  );
  const maxCpu = Math.max(...cpuValues);
  const dynamicXMax = maxCpu > 0 ? Math.max(Math.ceil(maxCpu * 1.2), 20) : 100;

  const bubbleChartOptions = {
    chart: {
      type: 'bubble' as const,
      background: '#333',
      toolbar: { show: false },
    },
    legend: { show: true },
    dataLabels: { enabled: false },
    fill: { opacity: 0.8 },
    plotOptions: {
      bubble: {
        minBubbleRadius: 4,
        maxBubbleRadius: 20,
      },
    },
    tooltip: {
      custom: function ({ seriesIndex, dataPointIndex }: { seriesIndex: number; dataPointIndex: number }) {
        const point = bubbleSeries[seriesIndex].data[dataPointIndex];
        if (!point) return '<div style="padding:8px; color:#fff;">No data available</div>';

        const memoryPretty = prettyBytes(point.y * MiBFactor);
        const diskPretty = prettyBytes(point.z * MiBFactor);

        return `
              <div style="padding:8px; color:#fff;">
                <strong>${point.name}</strong><br/>
                Status: ${point.daemonStatus}<br/>
                CPU: ${point.x?.toFixed(2)}%<br/>
                Memory: ${memoryPretty}<br/>
                Disk: ${diskPretty}
              </div>
            `;
      },
    },
    xaxis: {
      min: -5,
      max: dynamicXMax,
      tickAmount: 5,
      title: { text: 'CPU Usage (%)', style: { color: '#fff' }, offsetY: -10 },
      labels: { style: { colors: '#fff' } },
    },
    yaxis: {
      min: 0,
      max: dynamicYMax,
      tickAmount: 5,
      title: { text: 'Memory Usage (MB)', style: { color: '#fff' } },
      labels: {
        style: { colors: '#fff' },
        formatter: (val: number) => val?.toFixed(0),
      },
    },
    theme: { mode: 'dark' as const },
  };


  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 shadow-md w-full h-full flex flex-col">
      <h1 className="text-3xl font-bold text-white mb-6 text-start">{` Agents (${agentArray.length})`}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="w-full">
          <h2 className="text-white text-xl mb-4">Daemon Status</h2>
          <div className="aspect-w-1 aspect-h-1 min-h-[250px] max-h-[400px]">
            <ApexCharts
              options={daemonStatusChartOptions}
              series={daemonStatusChartSeries}
              type="donut"
              height="100%"
              width="100%"
            />
          </div>
        </div>

        <div className="w-full">
          <h2 className="text-white text-xl mb-4">Agents Resource Chart</h2>
          <div className="aspect-w-2 aspect-h-1 min-h-[250px] max-h-[400px]">
            <ApexCharts
              options={bubbleChartOptions}
              series={bubbleSeries}
              type="bubble"
              height="100%"
              width="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;

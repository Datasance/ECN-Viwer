import React from 'react';
import ApexCharts from 'react-apexcharts';

interface AgentData {
    lastActive: number;
    daemonOperatingDuration: number;
    daemonLastStart: number;
    systemAvailableDisk: number;
    systemAvailableMemory: number;
    repositoryCount: number;
    systemTime: number;
    lastStatusTime: number;
    processedMessages: number;
    lastCommandTime: number;
    logFileCount: number;
    uuid: string;
    name: string;
    location: string | null;
    gpsMode: string;
    latitude: number;
    longitude: number;
    description: string | null;
    daemonStatus: string;
    memoryUsage: number;
    diskUsage: number;
    cpuUsage: number;
    memoryViolation: string;
    diskViolation: string;
    cpuViolation: string;
    systemTotalCpu: number;
    securityStatus: string;
    securityViolationInfo: string;
    catalogItemStatus: string | null;
    repositoryStatus: string;
    ipAddress: string;
    ipAddressExternal: string;
    host: string;
    catalogItemMessageCounts: string | null;
    messageSpeed: number;
    networkInterface: string;
    dockerUrl: string;
    diskLimit: number;
    diskDirectory: string;
    memoryLimit: number;
    cpuLimit: number;
    logLimit: number;
    logDirectory: string;
    bluetoothEnabled: boolean;
    abstractedHardwareEnabled: boolean;
    version: string;
    isReadyToUpgrade: boolean;
    isReadyToRollback: boolean;
    statusFrequency: number;
    changeFrequency: number;
    deviceScanFrequency: number;
    tunnel: string;
    watchdogEnabled: boolean;
    dockerPruningFrequency: number;
    availableDiskThreshold: number;
    logLevel: string;
    isSystem: boolean;
    routerId: string | null;
    timeZone: string;
    createdAt: string;
    updatedAt: string;
    fogTypeId: number;
    tags: string[];
    routerMode: string;
    messagingPort: number;
    interRouterPort: number;
    edgeRouterPort: number;
    upstreamRouters: string[];
    edgeResources: any[];
}

interface AgentDashboardProps {
    agentData: AgentData[] | undefined;
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({ agentData }) => {
    if (!agentData) return <div>Loading...</div>;

    const formatData = (data: number) => data.toFixed(2);

    const memoryUsage = agentData.map(agent => formatData(agent.memoryUsage));
    const cpuUsage = agentData.map(agent => formatData(agent.cpuUsage));
    const diskUsage = agentData.map(agent => formatData(agent.diskUsage));

    const runningCount = agentData.filter(agent => agent.daemonStatus === 'RUNNING').length;
    const notRunningCount = agentData.length - runningCount;

    const daemonStatusChartOptions = {
        chart: {
            type: 'donut' as 'donut',
            background: '#333',
        },
        labels: ['RUNNING', 'NOT RUNNING'],
        colors: ['#00E396', '#FF4560'], // RUNNING (green), UNKNOWN (red)
        dataLabels: {
            enabled: false,
        },
        tooltip: {
            y: {
              formatter: function (_val: number, opts: any) {
                const isRunning = opts.seriesIndex === 0;
          
                const agentNames = agentData
                  .filter(agent =>
                    isRunning ? agent.daemonStatus === 'RUNNING' : agent.daemonStatus !== 'RUNNING'
                  )
                  .map(agent => `- ${agent.name}`)
                  .join('<br />');
          
                return agentNames || 'No agents';
              },
            },
          },          
        legend: {
            position: 'top' as 'top',
            horizontalAlign: 'left' as 'left',
            labels: {
                colors: '#fff',
            },
        },
        theme: {
            mode: 'dark' as 'dark',
            palette: 'palette1',
        },
    };

    const daemonStatusChartSeries = [runningCount, notRunningCount];

    const barChartOptions = {
        chart: {
            type: 'bar' as 'bar',
            stacked: true,
            background: '#333',
        },
        plotOptions: {
            bar: {
                horizontal: true,
            },
        },
        dataLabels: {
            enabled: false,
        },
        xaxis: {
            categories: agentData.map(agent => agent.name),
        },
        yaxis: {
            title: {
                text: 'Usage',
            },
        },
        fill: {
            opacity: 1,
        },
        legend: {
            position: 'top' as 'top',
            horizontalAlign: 'left' as 'left',
            labels: {
                colors: '#fff',
            },
        },
        theme: {
            mode: 'dark' as 'dark',
            palette: 'palette1',
        },
    };

    const barChartSeries = [
        {
            name: 'Memory Usage',
            data: memoryUsage.map(Number),
        },
        {
            name: 'CPU Usage',
            data: cpuUsage.map(Number),
        },
        {
            name: 'Disk Usage',
            data: diskUsage.map(Number),
        },
    ];

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 shadow-md w-full h-full flex flex-col">
            <h1 className="text-3xl font-bold text-white mb-6 text-start">
                {`${agentData?.length} Agents`}
            </h1>

            <div className="flex flex-col md:flex-row justify-between w-full gap-6">
                <div className="md:basis-1/4 w-full">
                    <h2 className="text-white text-xl mb-4">Daemon Status</h2>
                    <div className="h-[200px]">
                        <ApexCharts
                            options={daemonStatusChartOptions}
                            series={daemonStatusChartSeries}
                            type="donut"
                            height={200}
                        />
                    </div>
                </div>

                <div className="md:basis-3/4 w-full">
                    <h2 className="text-white text-xl mb-4">Agents Resource Usage</h2>
                    <div className="h-[200px]">
                        <ApexCharts
                            options={barChartOptions}
                            series={barChartSeries}
                            type="bar"
                            height={200}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentDashboard;

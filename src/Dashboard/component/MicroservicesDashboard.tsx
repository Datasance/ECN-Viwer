import React from 'react';
import ApexCharts from 'react-apexcharts';
import { StatusColor, StatusType } from '../../Utils/Enums/StatusColor';
import { MiBFactor, prettyBytes } from '../../ECNViewer/utils';

interface MicroservicesDashboardProps {
    applications: any[];
    title: string;
}

const MicroservicesDashboard: React.FC<MicroservicesDashboardProps> = ({ applications, title }) => {
    if (!applications) return <div>Loading...</div>;

    const allMicroservices = applications.flatMap(app => app.microservices || []);
    const totalMicroservices = allMicroservices.length;

    const runningCount = allMicroservices.filter(
        msvc => msvc.status?.status?.toUpperCase() === StatusType.RUNNING
    ).length;
    const notRunningCount = totalMicroservices - runningCount;

    const donutLabels = [StatusType.RUNNING, StatusType.STOPPED];
    const donutColors = [StatusColor[StatusType.RUNNING], StatusColor[StatusType.STOPPED]];

    const donutChartOptions = {
        chart: { type: 'donut' as const, background: '#333' },
        labels: donutLabels,
        colors: donutColors,
        dataLabels: { enabled: true },
        tooltip: {
            y: {
                formatter: function (_val: number, opts: any) {
                    const status = donutLabels[opts.seriesIndex];
                    const names = allMicroservices
                        .filter(msvc => (msvc.status?.status?.toUpperCase() || '') === status)
                        .map(msvc => `- ${msvc.name}`)
                        .join('<br />');
                    return names || 'No microservices';
                },
            },
        },
        legend: {
            labels: { colors: '#fff' },
            position: 'bottom' as const,
        },
        theme: { mode: 'dark' as const },
    };
    const donutChartSeries = [runningCount, notRunningCount];

    const uniqueStatuses = Array.from(
        new Set(allMicroservices.map(msvc => {
            const s = (msvc.status?.status?.toUpperCase() || 'UNKNOWN');
            return Object.values(StatusType).includes(s as StatusType) ? s : 'UNKNOWN';
        }))
    );

    const bubbleSeries = uniqueStatuses.map(status => ({
        name: status,
        color: StatusColor[status as keyof typeof StatusColor] || StatusColor.UNKNOWN,
        data: allMicroservices
            .filter(msvc => {
                const s = (msvc.status?.status?.toUpperCase() || 'UNKNOWN');
                return s === status;
            })
            .map(msvc => ({
                x: msvc.status?.cpuUsage || 0,
                y: msvc.status?.memoryUsage ? msvc.status.memoryUsage / (1024 * 1024) : 0,
                z: 10,
                name: msvc.name,
            })),
    }));

    const memoryValues = allMicroservices.map(msvc =>
        msvc.status?.memoryUsage ? msvc.status.memoryUsage / (1024 * 1024) : 0
    );
    const maxMemory = Math.max(...memoryValues, 100);
    const dynamicYMax = maxMemory > 0 ? Math.ceil(maxMemory * 1.2) : 100;

    const cpuValues = allMicroservices.map(msvc =>
        msvc.status?.cpuUsage ? Number(msvc.status.cpuUsage) : 0
    );
    const maxCpu = Math.max(...cpuValues, 20);
    const dynamicXMax = maxCpu > 0 ? Math.ceil(maxCpu * 1.2) : 100;

    const bubbleChartOptions = {
        chart: { type: 'bubble' as const, background: '#333', toolbar: { show: false } },
        dataLabels: { enabled: false },
        fill: { opacity: 0.8 },
        colors: uniqueStatuses.map(status =>
            StatusColor[status as keyof typeof StatusColor] || StatusColor.UNKNOWN
        ),
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
                return `
          <div style="padding:8px; color:#fff;">
            <strong>${point.name}</strong><br/>
            Status: ${uniqueStatuses[seriesIndex]}<br/>
            CPU: ${point.x.toFixed(2)}%<br/>
            Memory: ${memoryPretty}<br/>
          </div>
        `;
            },
        },
        xaxis: {
            min: -2,
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
                formatter: (val: number) => val.toFixed(0),
            },
        },
        legend: {
            show: true,
            labels: { colors: '#fff' },
        },
        theme: { mode: 'dark' as const },
    };

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-4 md:p-6 shadow-md w-full h-full flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6 text-start">
                {` ${title}${totalMicroservices !== 1 ? 's' : ''} (${totalMicroservices})`}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="w-full">
                    <h2 className="text-white text-xl mb-4">Microservices Status</h2>
                    <ApexCharts
                        options={donutChartOptions}
                        series={donutChartSeries}
                        type="donut"
                        height={332}
                    />
                </div>
                <div className="w-full">
                    <h2 className="text-white text-xl mb-4">Microservices Resource Chart</h2>
                    <ApexCharts
                        options={bubbleChartOptions}
                        series={bubbleSeries}
                        type="bubble"
                        height={300}
                    />
                </div>
            </div>
        </div>
    );
};

export default MicroservicesDashboard;

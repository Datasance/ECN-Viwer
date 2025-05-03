import React from 'react';
import ApexCharts from 'react-apexcharts';

interface MicroservicesDashboardProps {
    activeMsvcs: any[];
    title: string;
}

const MicroservicesDashboard: React.FC<MicroservicesDashboardProps> = ({ activeMsvcs, title }) => {
    if (!activeMsvcs) return <div>Loading...</div>;

    const groupedByApplication: Record<string, any[]> = {};
    activeMsvcs.forEach(msvc => {
        const app = msvc.application || 'Unknown';
        if (!groupedByApplication[app]) {
            groupedByApplication[app] = [];
        }
        groupedByApplication[app].push(msvc);
    });

    const applicationNames = Object.keys(groupedByApplication);
    const microserviceCounts = applicationNames.map(app => groupedByApplication[app].length);

    const barChartOptions = {
        chart: {
            type: 'bar' as const,
            background: '#333',
            height: 350,
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '10%',
            },
        },
        dataLabels: {
            enabled: true,
            style: {
                colors: ['#fff'],
            },
        },
        xaxis: {
            categories: applicationNames,
            labels: {
                style: {
                    colors: '#fff',
                },
            },
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#fff',
                },
            },
            title: {
                text: 'Microservice Count',
                style: {
                    color: '#fff',
                },
            },
        },
        tooltip: {
            y: {
                formatter: (_: number, opts: any) => {
                    const appName = opts.w.globals.labels[opts.dataPointIndex];
                    const services = groupedByApplication[appName] || [];
                    const formatted = services
                        .map(msvc => {
                            const status = msvc.status?.status === 'RUNNING' ? '🟢' : '🔴';
                            return `${status} ${msvc.name}`;
                        })
                        .join('<br/>');
                    return `<strong>${appName}</strong><br/>${formatted}`;
                },
            },
        },
        fill: {
            opacity: 1,
        },
        theme: {
            mode: 'dark' as const,
        },
        legend: {
            labels: {
                colors: '#fff',
            },
        },
    };

    const barChartSeries = [
        {
            name: 'Microservices',
            data: microserviceCounts,
        },
    ];

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-4 md:p-6 shadow-md w-full h-full flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6 text-start">
                {`${activeMsvcs?.length} ${title}${activeMsvcs?.length > 1 ? 's' : ''}`}
            </h1>
            <div className="w-full overflow-x-auto">
                <ApexCharts
                    options={barChartOptions}
                    series={barChartSeries}
                    type="bar"
                    height={200}
                />
            </div>
        </div>

    );
};

export default MicroservicesDashboard;

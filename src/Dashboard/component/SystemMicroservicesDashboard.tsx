import React from 'react';
import ApexCharts from 'react-apexcharts';

interface SystemMicroservicesDashboardProps {
    systemApplications: any[];
    title: string;
}

const SystemMicroservicesDashboard: React.FC<SystemMicroservicesDashboardProps> = ({ systemApplications, title }) => {
    if (!systemApplications) return <div>Loading...</div>;

    // Uygulama adına göre microservice'leri grupla
    const groupedByApplication: Record<string, any[]> = {};
    systemApplications.forEach(app => {
        const appName = app.name || 'Unknown';
        if (!groupedByApplication[appName]) {
            groupedByApplication[appName] = [];
        }
        groupedByApplication[appName].push(...(app.microservices || []));
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
                formatter: (value: string) => {
                    return value.length > 10 ? value.substring(0, 10) + '...' : value;
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

    // Toplam microservice sayısını hesapla
    const totalMicroservices = Object.values(groupedByApplication).reduce((acc, val) => acc + val.length, 0);

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-4 md:p-6 shadow-md w-full h-full flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6 text-start">
                {`${totalMicroservices} ${title}${totalMicroservices > 1 ? 's' : ''}`}
            </h1>
            <div className="w-full">
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

export default SystemMicroservicesDashboard;

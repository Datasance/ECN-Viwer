import React from 'react';
import ApexCharts from 'react-apexcharts';

const CustomStatCard = ({ dataArray = [], cardTitle }) => {
    const firstItem = dataArray[0] || {};

    const { version } = firstItem;

    const runningNames = dataArray.filter(item => item.daemonStatus === 'RUNNING').map(item => item.name);
    const stoppedNames = dataArray.filter(item => item.daemonStatus === 'STOPPED').map(item => item.name);
    const otherNames = dataArray.filter(item => item.daemonStatus !== 'RUNNING' && item.daemonStatus !== 'STOPPED').map(item => item.name);

    const statusCounts = {
        RUNNING: runningNames.length,
        STOPPED: stoppedNames.length,
        OTHER: otherNames.length,
    };

    const chartSeries = [statusCounts.RUNNING, statusCounts.STOPPED, statusCounts.OTHER];

    const chartOptions = {
        chart: {
            type: 'donut',
            width: '100%',
        },
        labels: ['RUNNING', 'STOPPED', 'OTHER'],
        colors: ['#4CAF50', '#F44336', '#FF9800'],
        legend: {
            position: 'bottom',
            labels: {
                colors: '#fff',
            },
        },
        tooltip: {
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                const statusLabels = w.config.labels || [];
                const currentStatus = statusLabels[seriesIndex];

                const tooltipNames = dataArray
                    .filter(item => item.daemonStatus === currentStatus)
                    .map(item => item.name);

                if (tooltipNames.length === 0) {
                    return `<div style="padding:5px;"><span style="color:white;">No Data</span></div>`;
                }

                return `
                <div style="padding:5px; text-align: left;">
                  ${tooltipNames.map(name => `<div style="color:white;">${name}</div>`).join('')}
                </div>
              `;
            }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '60%',
                },
            },
        },
        dataLabels: {
            style: {
                colors: ['#fff'],
            },
        },
        responsive: [
            {
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200,
                    },
                    legend: {
                        position: 'bottom',
                    },
                },
            },
        ],
    };

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all min-h-[250px] flex flex-col justify-between">
            <div>
                <div className='flex'>
                    <div className="text-xl font-bold text-white mb-2 mr-2">{dataArray.length || ''}</div>
                    <div className="text-xl font-bold text-white mb-2">{cardTitle || 'Unknown Title'}</div>
                </div>

                {dataArray.length === 0 ? (
                    <div className="text-gray-500 text-center mt-6">No Data Available</div>
                ) : (
                    <div className="my-4">
                        <ApexCharts options={chartOptions} series={chartSeries} type="donut" height={200} />
                    </div>
                )}
            </div>

            <div className="text-xs text-gray-500 text-right mt-4">
                {version ? `v${version}` : ''}
            </div>
        </div>
    );
};

export default CustomStatCard;

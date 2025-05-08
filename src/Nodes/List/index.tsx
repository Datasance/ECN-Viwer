import React from 'react';
import { useData } from '../../providers/Data';
import CustomDataTable from '../../CustomComponent/CustomDataTable';
import CustomProgressBar from '../../CustomComponent/CustomProgressBar';

function NodesList() {
    const { data } = useData();

    const columns = [
        {
            key: 'name',
            header: 'Name',
        },
        {
            key: 'ipAddress',
            header: 'IP Address',
        },
        {
            key: 'memoryUsage',
            header: 'Memory Usage',
            render: (row: any) => (
                <CustomProgressBar value={row.memoryUsage} max={100} unit="%" />
            ),
        },
        {
            key: 'cpuUsage',
            header: 'CPU Usage',
            render: (row: any) => (
                <CustomProgressBar value={row.cpuUsage} max={100} unit="%" />
            ),
        },
        {
            key: 'diskUsage',
            header: 'Disk Usage',
            render: (row: any) => (
                <CustomProgressBar value={row.diskUsage} max={100} unit="%" />
            ),
        },
        {
            key: 'daemonStatus',
            header: 'Status',
            render: (row: any) => (
                <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${row.daemonStatus === 'RUNNING'
                            ? 'bg-green-600 text-white'
                            : 'bg-red-600 text-white'
                        }`}
                >
                    {row.daemonStatus}
                </span>
            ),
        },
    ];


    return (
        <div className="max-h-[90.8vh] min-h-[90.8vh] bg-gray-900 text-white overflow-auto p-4">
            <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
                Agent List
            </h1>
            <CustomDataTable
                columns={columns}
                data={data.activeAgents}
                getRowKey={(row) => row.uuid}
            />
        </div>
    );
}

export default NodesList;

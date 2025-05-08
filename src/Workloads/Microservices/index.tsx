import React from 'react';
import { useData } from '../../providers/Data';
import CustomDataTable from '../../CustomComponent/CustomDataTable';
import CustomProgressBar from '../../CustomComponent/CustomProgressBar';

function MicroservicesList() {
  const { data } = useData();

  const columns = [
    {
      key: 'name',
      header: 'Name',
    },
    {
      key: 'application',
      header: 'Application',
    },
    {
      key: 'cpuUsage',
      header: 'CPU Usage',
      render: (row: any) => (
        <CustomProgressBar value={row.status.cpuUsage} max={100} unit="%" />
      ),
    },
    {
      key: 'memoryUsage',
      header: 'Memory Usage',
      render: (row: any) => (
        <CustomProgressBar value={(row.status.memoryUsage / 1048576).toFixed(2)} max={1024} unit="MB" />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status.status === 'RUNNING'
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
          }`}
        >
          {row.status.status}
        </span>
      ),
    },
  ];

  return (
    <div className="max-h-[90.8vh] min-h-[90.8vh] bg-gray-900 text-white overflow-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
        Microservices List
      </h1>
      <CustomDataTable
        columns={columns}
        data={data.activeMsvcs}
        getRowKey={(row) => row.uuid}
      />
    </div>
  );
}

export default MicroservicesList;

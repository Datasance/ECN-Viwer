import React from 'react';
import { useData } from '../../providers/Data';
import CustomDataTable from '../../CustomComponent/CustomDataTable';
import CustomProgressBar from '../../CustomComponent/CustomProgressBar';

function SystemMicroserviceList() {
  const { data } = useData();

  // Flattened data: her microservice için bir satır
  const flattenedMicroservices = data.systemApplications.flatMap((app: any) =>
    app.microservices.map((ms: any) => ({
      appName: app.name,
      appDescription: app.description,
      appCreatedAt: app.createdAt,
      msName: ms.name,
      cpuUsage: ms.status?.cpuUsage || 0,
      memoryUsage: ms.status?.memoryUsage || 0,
      percentage: ms.status?.percentage || 100,
      uuid: ms.uuid,
    }))
  );

  const columns = [
    {
      key: 'appName',
      header: 'Application Name',
    },
    {
      key: 'appDescription',
      header: 'Description',
    },
    {
      key: 'appCreatedAt',
      header: 'Created At',
      render: (row: any) => <span>{new Date(row.appCreatedAt).toLocaleString()}</span>,
    },
    {
      key: 'msName',
      header: 'Microservice Name',
    },
    {
      key: 'cpuUsage',
      header: 'CPU Usage',
      render: (row: any) => (
        <CustomProgressBar
          value={row.cpuUsage.toFixed(2)}
          max={row.percentage}
          unit="%"
        />
      ),
    },
    {
      key: 'memoryUsage',
      header: 'Memory Usage',
      render: (row: any) => (
        <CustomProgressBar
          value={(row.memoryUsage / 1048576).toFixed(2)}
          max={1024}
          unit="MB"
        />
      ),
    },
  ];

  return (
    <div className="max-h-[90.8vh] min-h-[90.8vh] bg-gray-900 text-white overflow-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
        System Microservice List
      </h1>
      <CustomDataTable
        columns={columns}
        data={flattenedMicroservices}
        getRowKey={(row) => row.uuid}
      />
    </div>
  );
}

export default SystemMicroserviceList;

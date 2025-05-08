import React from 'react';
import { useData } from '../../providers/Data';
import CustomDataTable from '../../CustomComponent/CustomDataTable';
import CustomProgressBar from '../../CustomComponent/CustomProgressBar';

function SystemApplicationList() {
  const { data } = useData();

  const columns = [
    {
      key: 'name',
      header: 'Name',
    },
    {
      key: 'description',
      header: 'Description',
    },
    {
      key: 'isActivated',
      header: 'Activated',
      render: (row: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            row.isActivated ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
          }`}
        >
          {row.isActivated ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (row: any) => (
        <span>{new Date(row.createdAt).toLocaleString()}</span>
      ),
    },
  ];

  const expandedRowRender = (row: any) => (
    <div className="p-4 bg-gray-800">
      <h3 className="text-lg font-semibold mb-2">Microservices Details</h3>
      <CustomDataTable
        columns={[
          {
            key: 'name',
            header: 'Microservice Name',
          },
          {
            key: 'cpuUsage',
            header: 'CPU Usage',
            render: (ms: any) => (
              <CustomProgressBar value={ms.status.cpuUsage.toFixed(2)} max={ms.status.percentage} unit="%" />
            ),
          },
          {
            key: 'memoryUsage',
            header: 'Memory Usage',
            render: (ms: any) => (
              <CustomProgressBar value={(ms.status.memoryUsage / 1048576).toFixed(2)} max={1024} unit="MB" />
            ),
          },
        ]}
        data={row.microservices}
        getRowKey={(ms) => ms.uuid}
      />
    </div>
  );

  return (
    <div className="max-h-[90.8vh] min-h-[90.8vh] bg-gray-900 text-white overflow-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
        System Application List
      </h1>
      <CustomDataTable
        columns={columns}
        data={data.systemApplications}
        getRowKey={(row) => row.id}
        expandableRowRender={expandedRowRender}
      />
    </div>
  );
}

export default SystemApplicationList;

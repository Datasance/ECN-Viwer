import React, { useState } from 'react';
import { useData } from '../../providers/Data';
import CustomDataTable from '../../CustomComponent/CustomDataTable';
import CustomProgressBar from '../../CustomComponent/CustomProgressBar';
import SlideOver from '../../CustomComponent/SlideOver';
import { format, formatDistanceToNow } from 'date-fns';
import { useController } from '../../ControllerProvider';
import { useFeedback } from '../../Utils/FeedbackContext';

function SystemMicroserviceList() {
  const { data } = useData();
  const { request } = useController();
  const { pushFeedback } = useFeedback();

  const [selectedMs, setSelectedMs] = useState<any | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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
      createdAt: ms.createdAt,
      namespace: ms.config?.container?.namespace || 'N/A',
    }))
  );

  const handleRowClick = (row: any) => {
    setSelectedMs(row);
    setIsOpen(true);
  };

  const handleRestart = async () => {
    try {
      const res = await request(`/api/v3/microservices/${selectedMs.uuid}/restart`, {
        method: 'POST',
      });

      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: 'error' });
        return;
      }

      pushFeedback({ message: 'Microservice Restarted', type: 'success' });
    } catch (e: any) {
      pushFeedback({ message: e.message, type: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      const res = await request(`/api/v3/microservices/${selectedMs.uuid}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: 'error' });
        return;
      }

      pushFeedback({ message: 'Microservice Deleted', type: 'success' });
    } catch (e: any) {
      pushFeedback({ message: e.message, type: 'error' });
    }
  };

  const columns = [
    {
      key: 'msName',
      header: 'Microservice Name',
      render: (row: any) => (
        <div className="cursor-pointer text-blue-400 hover:underline" onClick={() => handleRowClick(row)}>
          {row.msName}
        </div>
      ),
    },
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

  const slideOverFields = [
    {
      label: 'Name',
      render: (row: any) => row.msName || 'N/A',
    },
    {
      label: 'Application Name',
      render: (row: any) => row.appName || 'N/A',
    },
    {
      label: 'Namespace',
      render: (row: any) => row.namespace || 'N/A',
    },
    {
      label: 'App',
      render: (row: any) => row.appName || 'N/A',
    },
    {
      label: 'Description',
      render: (row: any) => row.appDescription || 'N/A',
    },
    {
      label: 'Created',
      render: (row: any) => {
        if (!row.createdAt) return 'N/A';
        const date = new Date(row.createdAt);
        return `${formatDistanceToNow(date, { addSuffix: true })} (${format(date, 'PPpp')})`;
      },
    },
    {
      label: 'CPU Usage',
      render: (row: any) => `${row.cpuUsage.toFixed(2)}%`,
    },
    {
      label: 'Memory Usage',
      render: (row: any) => `${(row.memoryUsage / 1048576).toFixed(2)} MB`,
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
      <SlideOver
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={selectedMs?.msName || 'Microservice Details'}
        data={selectedMs}
        fields={slideOverFields}
        onRestart={handleRestart}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default SystemMicroserviceList;

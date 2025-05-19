import React, { useState } from 'react';
import { useData } from '../../providers/Data';
import CustomDataTable from '../../CustomComponent/CustomDataTable';
import CustomProgressBar from '../../CustomComponent/CustomProgressBar';
import SlideOver from '../../CustomComponent/SlideOver';
import { formatDistanceToNow, format } from 'date-fns';
import { useController } from '../../ControllerProvider';
import { useFeedback } from '../../Utils/FeedbackContext';

function MicroservicesList() {
  const { data } = useData();
  const { request } = useController();
  const { pushFeedback } = useFeedback();
  const [selectedMs, setSelectedMs] = useState<any | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleRowClick = (row: any) => {
    setSelectedMs(row);
    setIsOpen(true);
  };

  const handleRestart = async () => {
    try {
      const res = await request(`/api/v3/microservices/${selectedMs.uuid}/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: 'error' });
        return;
      }

      pushFeedback({ message: 'Microservice restarted', type: 'success' });
    } catch (e: any) {
      pushFeedback({ message: e.message || 'Restart failed', type: 'error' });
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

      pushFeedback({ message: 'Microservice deleted', type: 'success' });
    } catch (e: any) {
      pushFeedback({ message: e.message || 'Delete failed', type: 'error' });
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row: any) => (
        <div
          className="cursor-pointer text-blue-400 hover:underline"
          onClick={() => handleRowClick(row)}
        >
          {row.name}
        </div>
      ),
    },
    {
      key: 'application',
      header: 'Application',
    },
    {
      key: 'cpuUsage',
      header: 'CPU Usage',
      render: (row: any) => {
        const usage = Number(row?.status?.cpuUsage || 0);
        return <CustomProgressBar value={usage} max={100} unit="%" />;
      },
    },
    {
      key: 'memoryUsage',
      header: 'Memory Usage',
      render: (row: any) => {
        const usage = Number(row?.status?.memoryUsage || 0) / 1048576;
        return <CustomProgressBar value={Number(usage.toFixed(2))} max={1024} unit="MB" />;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status?.status === 'RUNNING' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
        >
          {row.status?.status || 'UNKNOWN'}
        </span>
      ),
    },
  ];

  const slideOverFields = [
    {
      label: 'Status',
      render: (row: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status?.status === 'RUNNING' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
        >
          {row.status?.status || 'UNKNOWN'}
        </span>
      ),
    },
    {
      label: 'Application',
      render: (row: any) => row.application || 'N/A',
    },
    {
      label: 'Name',
      render: (row: any) => row.name || 'N/A',
    },
    {
      label: 'Namespace',
      render: (row: any) => row.namespace || 'N/A',
    },
    {
      label: 'Created',
      render: (row: any) => {
        const created = row.created || row.creationTimestamp;
        if (!created) return 'N/A';
        const date = new Date(created);
        const formattedDate = format(date, 'PPpp');
        return `${formatDistanceToNow(date, { addSuffix: true })} (${formattedDate})`;
      },
    },
    {
      label: 'Resource Utilization',
      render: () => '',
      isSectionHeader: true,
    },
    {
      label: 'CPU Usage',
      render: (row: any) => `${(Number(row?.status?.cpuUsage) || 0).toFixed(2)}%`,
    },
    {
      label: 'Memory Usage',
      render: (row: any) => {
        const mb = Number(row?.status?.memoryUsage || 0) / 1048576;
        return `${mb.toFixed(2)} MB`;
      },
    },
  ];

  return (
    <div className="max-h-[90.8vh] min-h-[90.8vh] bg-gray-900 text-white overflow-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">Microservices List</h1>
      <CustomDataTable
        columns={columns}
        data={data?.activeMsvcs || []}
        getRowKey={(row: any) => row.uuid}
      />
      <SlideOver
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={selectedMs?.name || 'Microservice Details'}
        data={selectedMs}
        fields={slideOverFields}
        onRestart={handleRestart}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default MicroservicesList;

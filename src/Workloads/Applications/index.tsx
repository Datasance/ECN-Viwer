import React, { useState } from 'react';
import { useData } from '../../providers/Data';
import CustomDataTable from '../../CustomComponent/CustomDataTable';
import CustomProgressBar from '../../CustomComponent/CustomProgressBar';
import SlideOver from '../../CustomComponent/SlideOver';
import { format, formatDistanceToNow } from 'date-fns';
import { useController } from '../../ControllerProvider';
import { useFeedback } from '../../Utils/FeedbackContext';

function ApplicationList() {
  const { data } = useData();
  const { request } = useController();
  const { pushFeedback } = useFeedback();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);

  const handleRowClick = (row: any) => {
    setSelectedApplication(row);
    setIsOpen(true);
  };

  const handleRestart = async () => {
    try {
      const res = await request(`/api/v3/microservices/${selectedApplication.uuid}/restart`, {
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
      const res = await request(`/api/v3/microservices/${selectedApplication.uuid}`, {
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
      key: 'description',
      header: 'Description',
    },
    {
      key: 'isActivated',
      header: 'Activated',
      render: (row: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${row.isActivated ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
            }`}
        >
          {row.isActivated ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (row: any) => <span>{new Date(row.createdAt).toLocaleString()}</span>,
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

  const slideOverFields = [
    {
      label: 'Application Name',
      render: (row: any) => row.name || 'N/A',
    },
    {
      label: 'Description',
      render: (row: any) => row.description || 'N/A',
    },
    {
      label: 'Activated',
      render: (row: any) => (
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${row.isActivated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
        >
          {row.isActivated ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      label: 'System',
      render: (row: any) => (
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${row.isSystem ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'
            }`}
        >
          {row.isSystem ? 'System' : 'User'}
        </span>
      ),
    },
    {
      label: 'Created',
      render: (row: any) => {
        if (!row.createdAt) return 'N/A';
        const date = new Date(row.createdAt);
        return (
          <>
            {formatDistanceToNow(date, { addSuffix: true })} <br />
            <span className="text-xs text-gray-400">{format(date, 'PPpp')}</span>
          </>
        );
      },
    },
    {
      label: 'Updated',
      render: (row: any) => {
        if (!row.updatedAt) return 'N/A';
        const date = new Date(row.updatedAt);
        return (
          <>
            {formatDistanceToNow(date, { addSuffix: true })} <br />
            <span className="text-xs text-gray-400">{format(date, 'PPpp')}</span>
          </>
        );
      },
    },
  ];

  return (
    <div className="max-h-[90.8vh] min-h-[90.8vh] bg-gray-900 text-white overflow-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
        Application List
      </h1>
      <CustomDataTable
        columns={columns}
        data={data.applications}
        getRowKey={(row) => row.id}
        expandableRowRender={expandedRowRender}
      />
      <SlideOver
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={selectedApplication?.msName || 'Microservice Details'}
        data={selectedApplication}
        fields={slideOverFields}
        onRestart={handleRestart}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default ApplicationList;

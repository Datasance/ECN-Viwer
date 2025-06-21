import React, { useState } from 'react'
import CustomLeaflet from '../../CustomComponent/CustomLeaflet'
import { useData } from '../../providers/Data'
import SlideOver from '../../CustomComponent/SlideOver';
import CustomDataTable from '../../CustomComponent/CustomDataTable';
import { formatDistanceToNow, format } from 'date-fns';
import { useFeedback } from '../../Utils/FeedbackContext';
import { useController } from '../../ControllerProvider';
import UnsavedChangesModal from '../../CustomComponent/UnsavedChangesModal';

interface CustomLeafletProps {
  collapsed: boolean;
}

const Map: React.FC<CustomLeafletProps> = ({ collapsed }) => {
  const { data } = useData()
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { pushFeedback } = useFeedback();
  const { request } = useController();
    const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const markers = data?.reducedAgents?.byName
    ? Object.values(data.reducedAgents.byName)
      .filter((agent: any) => agent.latitude && agent.longitude)
      .map((agent: any) => ({
        id: agent.uuid,
        position: [agent.latitude, agent.longitude] as [number, number],
        color: agent.daemonStatus === 'RUNNING' ? 'green' : 'red',
        label: agent.name,
        description: agent.description,
        ip: agent.ipAddress,
        daemonStatus: agent.daemonStatus,
        createdAt: agent.createdAt,
      }))
    : [];


  const handleButtonClick = (marker: any) => {
    if(marker)
    {
      const selectedAgents = data.reducedAgents.byUUID[marker.id]
      setSelectedNode(selectedAgents)
      setIsOpen(true)
    }
  }

  const handleRestart = () => {
    rebootAgent();
  };

  const handleDelete = () => {
    deleteAgent();
  };


  const rebootAgent = async () => {
    try {
      const res = await request(`/api/v3/iofog/${selectedNode.uuid}/reboot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: "error" });
        return;
      }
      else{
        pushFeedback({ message: "Agent Rebooted", type: "success" });
        setShowResetConfirmModal(false);
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
    }
  };

  const deleteAgent = async () => {
    try {
      const res = await request(`/api/v3/iofog/${selectedNode.uuid}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        pushFeedback({ message: res.statusText || res.status, type: "error" });
        return;
      }
      else{
        pushFeedback({ message: "Agent deleted!", type: "success" });
        setShowDeleteConfirmModal(false);
      }
    } catch (e: any) {
      pushFeedback({ message: e.message || e.status, type: "error" });
    }
  };

  const slideOverFields = [
    {
      label: 'Status',
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
    {
      label: 'Last Active',
      render: (node: any) => {
        const lastActive = node.lastActive || node.updated || node.timestamp;
        if (!lastActive) return 'N/A';

        const date = new Date(lastActive);
        const timeAgo = formatDistanceToNow(date, { addSuffix: true });
        const formattedDate = format(date, 'PPpp');

        return `${timeAgo} (${formattedDate})`;
      },
    },
    {
      label: 'Description',
      render: (node: any) => { return node.description && 'N/A' },
    },
    {
      label: 'Agent Details',
      render: () => '',
      isSectionHeader: true,
    },
    {
      label: 'Version',
      render: (node: any) => node.version || 'N/A',
    },
    {
      label: 'Type',
      render: (node: any) => node.architecture || 'N/A',
    },
    {
      label: 'Address',
      render: (node: any) => node.ipAddress || 'N/A',
    },
    {
      label: 'Created',
      render: (node: any) => {
        const created = node.created || node.creationTimestamp;
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
      render: (node: any) => `${(Number(node.cpuUsage) || 0).toFixed(2)}%`,
    },
    {
      label: 'Memory Usage',
      render: (node: any) => {
        if (node.memoryUsageMB && node.memoryTotalMB) {
          const percentage = ((node.memoryUsageMB / node.memoryTotalMB) * 100).toFixed(2);
          return `${Number(node.memoryUsageMB).toFixed(2)} MB / ${Number(node.memoryTotalMB).toFixed(2)} MB (${percentage}%)`;
        }
        return `${(Number(node.memoryUsage) || 0).toFixed(2)}%`;
      },
    },
    {
      label: 'Disk Usage',
      render: (node: any) => {
        if (node.diskUsageBytes && node.diskTotalBytes) {
          const format = (bytes: number) => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
          };
          const percentage = ((node.diskUsageBytes / node.diskTotalBytes) * 100).toFixed(2);
          return `${format(node.diskUsageBytes)} / ${format(node.diskTotalBytes)} (${percentage}%)`;
        }
        return `${(Number(node.diskUsage) || 0).toFixed(2)}%`;
      },
    },
    {
      label: 'Applications',
      render: () => '',
      isSectionHeader: true,
    },
    {
      label: '',
      isFullSection: true,
      render: (node: any) => {
        const agentApplications = data?.applications?.filter(
          (app: any) =>
            app.microservices?.some((msvc: any) => msvc.iofogUuid === node.uuid)
        );

        if (!agentApplications || agentApplications.length === 0) {
          return <div className="text-sm text-gray-400">No applications found for this agent.</div>;
        }

        const localColumns = [
          {
            key: 'name',
            header: 'Application Name',
            formatter: ({ row }: any) => <span className="text-white">{row.name}</span>,
          },
        ];

        return (
          <CustomDataTable
            columns={localColumns}
            data={agentApplications}
            getRowKey={(row: any) => row.uuid}
          />
        );
      },
    },


  ];

  return (
    <div className="h-full w-full">
      <CustomLeaflet
        markers={markers}
        center={[39.9255, 32.8663]}
        zoom={3}
        onMarkerAction={handleButtonClick}
        collapsed={collapsed}
      />
      <SlideOver
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={selectedNode?.name || 'Agent Details'}
        data={selectedNode}
        fields={slideOverFields}
        onRestart={()=> setShowResetConfirmModal(true)}
        onDelete={()=> setShowDeleteConfirmModal(true)}
      />
      <UnsavedChangesModal
        open={showResetConfirmModal}
        onCancel={() => setShowResetConfirmModal(false)}
        onConfirm={handleRestart}
        title={`Restart ${selectedNode?.name}`}
        message={"This is not reversible."}
        cancelLabel={"Cancel"}
        confirmLabel={"Restart"}
        confirmColor='bg-blue'
      />
      <UnsavedChangesModal
        open={showDeleteConfirmModal}
        onCancel={() => setShowDeleteConfirmModal(false)}
        onConfirm={handleDelete}
        title={`Delete ${selectedNode?.name}`}
        message={"This is not reversible."}
        cancelLabel={"Cancel"}
        confirmLabel={"Delete"}
      />
    </div>
  )
}

export default Map

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
    if (marker) {
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
      else {
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
      else {
        pushFeedback({ message: "Agent deleted!", type: "success" });
        setShowDeleteConfirmModal(false);
      }
    } catch (e: any) {
      pushFeedback({ message: e.message || e.status, type: "error" });
    }
  };

  const slideOverFields = [
    {
      label: 'uuid',
      render: (row: any) => row.uuid || 'N/A',
    },
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
      label: 'Security Status',
      render: (row: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${row.securityStatus === 'OK'
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
            }`}
        >
          {row.securityStatus}
        </span>
      ),
    },
    {
      label: 'Security Violation Info',
      render: (node: any) => {
        return node.warningMessage ? <span className="text-white whitespace-pre-wrap break-words">{node.securityViolationInfo}</span> : 'N/A'
      },
    },
    {
      label: 'Warning Message',
      render: (node: any) => {
        return node.warningMessage ? <span className="text-white whitespace-pre-wrap break-words">{node.warningMessage}</span> : 'N/A'
      },
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
      render: (node: any) => { return node.description || 'N/A' },
    },
    {
      label: 'Up Time',
      render: (node: any) => { return node.daemonOperatingDuration || 'N/A' },
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
      label: 'Mode',
      render: (node: any) => node.isSystem ? "System" : 'Node',
    },
    {
      label: 'Deployment Type',
      render: (node: any) => node.deploymentType || 'N/A',
    },
    {
      label: 'Container Engine',
      render: (node: any) => node.containerEngine || 'N/A',
    },
    {
      label: 'Arch',
      render: (node: any) => node.fogTypeId === 0 ? "Auto" : node.fogTypeId === 1 ? "x86" : "arm",
    },
    {
      label: 'IP Address',
      render: (node: any) => node.ipAddress || 'N/A',
    },
    {
      label: 'IP Address External',
      render: (node: any) => node.ipAddressExternal || 'N/A',
    },
    {
      label: 'Tags',
      render: (node: any) => {
        return node.tags && node.tags?.length > 0 ? <span className="text-white whitespace-pre-wrap break-words">{node.tags}</span> : ""
      },
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
      label: 'System Available Disk',
      render: (node: any) => `${(Number(node.systemAvailableDisk) || 0).toFixed(2)}%`,
    },
    {
      label: 'System Available Memory',
      render: (node: any) => `${(Number(node.systemAvailableMemory) || 0).toFixed(2)}%`,
    },
    {
      label: 'System Total CPU',
      render: (node: any) => `${(Number(node.systemTotalCPU) || 0).toFixed(2)}%`,
    },
    {
      label: 'Volume Mounts',
      render: () => '',
      isSectionHeader: true,
    },
    {
      label: '',
      isFullSection: true,
      render: (node: any) => {

        if (!node.volumeMounts || node.volumeMounts === 0) {
          return <div className="text-sm text-gray-400">No volume mounts found for this agent.</div>;
        }

        const localColumns = [
          {
            key: 'name',
            header: 'Name',
            formatter: ({ row }: any) => <span className="text-white">{row.name}</span>,
          },
          {
            key: 'version',
            header: 'Version',
            formatter: ({ row }: any) => <span className="text-white">{row.version}</span>,
          },
          {
            key: 'configMapName',
            header: 'Config Map Name',
            formatter: ({ row }: any) => <span className="text-white">{row.configMapName}</span>,
          },
          {
            key: 'secretName',
            header: 'Secret Name',
            formatter: ({ row }: any) => <span className="text-white">{row.secretName}</span>,
          },
        ];

        return (
          <CustomDataTable
            columns={localColumns}
            data={node.volumeMounts}
            getRowKey={(row: any) => row.uuid}
          />
        );
      },
    },
    {
      label: 'Status',
      render: () => '',
      isSectionHeader: true,
    },
    {
      label: 'Cpu Violation',
      render: (row: any) => row.cpuViolation || 'N/A',
    },
    {
      label: 'Disk Violation',
      render: (row: any) => row.diskViolation || 'N/A',
    },
    {
      label: 'Memory Violation',
      render: (row: any) => row.memoryViolation || 'N/A',
    },
    {
      label: 'Is Ready To Rollback',
      render: (row: any) => <span>{row.isReadyToRollback.toString()}</span>,
    },
    {
      label: 'Is Ready To Upgrade',
      render: (row: any) => <span>{row.isReadyToUpgrade.toString()}</span>,
    },
    // {
    //     label: 'Last Command Time',
    //     render: (row: any) => row.lastCommandTime || 'N/A',
    // },
    {
      label: 'Last Status Time',
      render: (row: any) => <span>{new Date(row.lastStatusTime).toLocaleString()}</span>,
    },
    {
      label: 'Processed Messages',
      render: (row: any) => row.processedMessages || 'N/A',
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
    {
      label: 'Microservices',
      render: () => '',
      isSectionHeader: true,
    },
    {
      label: '',
      isFullSection: true,
      render: (node: any) => {
        const agentApplications = data?.applications?.find(
          (app: any) =>
            app.microservices?.some((msvc: any) => msvc.iofogUuid === node.uuid)
        );
        const microservices = agentApplications?.microservices || [];

        if (!Array.isArray(microservices) || microservices.length === 0) {
          return <div className="text-sm text-gray-400">No microservices available.</div>;
        }
        const tableData = microservices.map((ms: any, index: number) => ({
          key: `${ms.uuid}-${index}`,
          name: ms.name || '-',
          status: ms.status?.status || '-',
          agent: data.activeAgents?.find((a: any) => a.uuid === ms.iofogUuid)?.name ?? '-',
          ports: Array.isArray(ms.ports) ? (
            ms.ports.map((p: any, i: number) => (
              <div key={i}>
                {`${p.internal}:${p.external}/${p.protocol}`}
              </div>
            ))
          ) : (
            '-'
          )
        }));

        const columns = [
          {
            key: 'name',
            header: 'Name',
            formatter: ({ row }: any) => <span className="text-white">{row.name}</span>,
          },
          {
            key: 'status',
            header: 'Status',
            formatter: ({ row }: any) => <span className="text-white">{row.status}</span>,
          },
          {
            key: 'agent',
            header: 'Agent',
            formatter: ({ row }: any) => <span className="text-white">{row.agent}</span>,
          },
          {
            key: 'ports',
            header: 'Ports',
            formatter: ({ row }: any) => (
              <span className="text-white whitespace-pre-wrap break-words">{row.ports}</span>
            ),
          },
        ];

        return (
          <CustomDataTable
            columns={columns}
            data={tableData}
            getRowKey={(row: any) => row.key}
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
        onRestart={() => setShowResetConfirmModal(true)}
        onDelete={() => setShowDeleteConfirmModal(true)}
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

import React, { useEffect, useState } from 'react';
import { useData } from '../../providers/Data';
import CustomDataTable from '../../CustomComponent/CustomDataTable';
import CustomProgressBar from '../../CustomComponent/CustomProgressBar';
import SlideOver from '../../CustomComponent/SlideOver';
import { formatDistanceToNow, format } from 'date-fns';
import { useController } from '../../ControllerProvider';
import { useFeedback } from '../../Utils/FeedbackContext';
import ResizableBottomDrawer from '../../CustomComponent/ResizableBottomDrawer';
import AceEditor from "react-ace";
import { dumpMicroserviceYAML } from '../../Utils/microserviceYAML';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import UnsavedChangesModal from '../../CustomComponent/UnsavedChangesModal';

function MicroservicesList() {
  const { data } = useData();
  const { request } = useController();
  const { pushFeedback } = useFeedback();
  const [selectedMs, setSelectedMs] = useState<any | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isBottomDrawerOpen, setIsBottomDrawerOpen] = useState(false);
  const [editorIsChanged, setEditorIsChanged] = React.useState(false);
  const [editorDataChanged, setEditorDataChanged] = React.useState<any>()
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPort, setSelectedPort] = useState<any>(null);

  const handleRowClick = (row: any) => {
    setSelectedMs(row);
    setIsOpen(true);
  };

  const handleRestart = async () => {
    try {
      const res = await request(
        `/api/v3/microservices/${selectedMs.uuid}/rebuild`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
        }
      );
      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: "error" });
      } else {
        pushFeedback({ message: "Microservice Rebuilt", type: "success" });
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      const res = await request(
        `/api/v3/microservices/${selectedMs.uuid}`,
        {
          method: "DELETE",
          headers: {
            "content-type": "application/json",
          },
        }
      );
      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: "error" });
      } else {
        pushFeedback({ message: "Microservice Deleted", type: "success" });
        setIsOpen(false)
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
    }
  };

  const handlePortsDelete = async () => {
    try {
      const res = await request(
        `/api/v3/microservices/${selectedMs.uuid}`,
        {
          method: "DELETE",
          headers: {
            "content-type": "application/json",
          },
        }
      );
      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: "error" });
      } else {
        pushFeedback({ message: "Microservice Deleted", type: "success" });
        setIsOpen(false)
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
    }
  };

  const handleYamlUpdate = async () => {
    const url = `/api/v3/microservices/${selectedMs.uuid}`
    try {
      const res = await request(url, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(editorDataChanged)
      })
      return res
    } catch (e: any) {
      pushFeedback({ message: e.message, type: 'error' })
    }
  };

  const yamlDump = React.useMemo(() => {
    return dumpMicroserviceYAML({
      microservice: selectedMs,
      activeAgents: data?.activeAgents,
      reducedAgents: data?.reducedAgents,
    });
  }, [selectedMs, data]);

  const handleEditYaml = () => {
    setIsBottomDrawerOpen(true);
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
      label: 'Microservice Details',
      render: () => '',
      isSectionHeader: true,
    },
    {
      label: 'Image',
      render: (row: any) => row.images?.[0]?.containerImage || 'N/A',
    },
    {
      label: 'Agent',
      render: (row: any) => {
        const agent = data.reducedAgents.byUUID[row.iofogUuid];
        return agent?.name || 'N/A';
      }
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
      label: 'Created at',
      render: (row: any) => {
        const created = row.createdAt || row.creationTimestamp;
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
    {
      label: 'Ports',
      render: () => '',
      isSectionHeader: true,
    },
    {
      label: '',
      isFullSection: true,
      render: (node: any) => {
        const ports = node?.ports || [];
    
        if (!Array.isArray(ports) || ports.length === 0) {
          return <div className="text-sm text-gray-400">No ports found for this microservice.</div>;
        }
    
        const portData = ports.map((port: any, index: number) => ({
          internal: port.internal,
          external: port.external,
          protocol: port.protocol,
          publicLink: port.public?.links?.[0] || '-',
          key: `${port.internal}-${port.external}-${index}`,
        }));
    
        const portColumns = [
          {
            key: 'internal',
            header: 'Internal',
            formatter: ({ row }: any) => <span className="text-white">{row.internal}</span>,
          },
          {
            key: 'external',
            header: 'External',
            formatter: ({ row }: any) => <span className="text-white">{row.external}</span>,
          },
          {
            key: 'protocol',
            header: 'Protocol',
            formatter: ({ row }: any) => <span className="uppercase text-white">{row.protocol}</span>,
          },
          {
            key: 'publicLink',
            header: 'Public Link',
            formatter: ({ row }: any) =>
              row.publicLink !== '-' ? (
                <a href={row.publicLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                  {row.publicLink}
                </a>
              ) : (
                <span className="text-gray-400">-</span>
              ),
          },
          {
            key: 'action',
            header: 'Action',
            render: (row: any) => {
              return (
                <button onClick={() => setSelectedPort(row)} className="hover:text-red-600 hover:bg-white rounded">
                  <DeleteOutlineIcon fontSize="small" />
                </button>)
            },
          },
        ];
    
        return (
          <CustomDataTable
            columns={portColumns}
            data={portData}
            getRowKey={(row: any) => row.key}
          />
        );
      },
    }    
  ];

  useEffect(() => {
    if(selectedPort){
      setShowConfirmModal(true)
    }
  }, [selectedPort])
  

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
        onEditYaml={handleEditYaml}
        customWidth={600}
      />
      <ResizableBottomDrawer
        open={isBottomDrawerOpen}
        isEdit={editorIsChanged}
        onClose={() => { setIsBottomDrawerOpen(false); setEditorIsChanged(false); setEditorDataChanged(null) }}
        onSave={() => handleYamlUpdate()}
        title={`${selectedMs?.name} YAML`}
        showUnsavedChangesModal
        unsavedModalTitle='Changes Not Saved'
        unsavedModalMessage='Are you sure you want to exit? All unsaved changes will be lost.'
        unsavedModalCancelLabel='Stay'
        unsavedModalConfirmLabel='Exit Anyway'

      >
        <AceEditor
          setOptions={{ useWorker: false }}
          mode="yaml"
          theme="monokai"
          defaultValue={yamlDump}
          onLoad={function (editor) {
            editor.renderer.setPadding(10);
            editor.renderer.setScrollMargin(10);
          }}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "4px",
          }}
          onChange={function editorChanged(editor: any) {
            setEditorIsChanged(true)
            setEditorDataChanged(editor)
          }}
        />
      </ResizableBottomDrawer>
      <UnsavedChangesModal
          open={showConfirmModal}
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={handlePortsDelete}
          title={`Delete Port ${selectedPort?.internal}`}
          message={"This is not reversible."}
          cancelLabel={"Cancel"}
          confirmLabel={"Delete"}
        />
    </div>
  );
}

export default MicroservicesList;

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
import yaml from "js-yaml";
import { API_VERSIONS } from '../../Utils/constants';
import { parseMicroservice } from '../../Utils/ApplicationParser';
import lget from "lodash/get";


function MicroservicesList() {
  const { data } = useData();
  const { request } = useController();
  const { pushFeedback } = useFeedback();
  const [selectedMs, setSelectedMs] = useState<any | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isBottomDrawerOpen, setIsBottomDrawerOpen] = useState(false);
  const [editorIsChanged, setEditorIsChanged] = React.useState(false);
  const [editorDataChanged, setEditorDataChanged] = React.useState<any>()
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showPortDeleteConfirmModal, setShowPortDeleteConfirmModal] = useState(false);
  const [showVolumeDeleteConfirmModal, setShowVolumeDeleteConfirmModal] = useState(false);
  const [selectedPort, setSelectedPort] = useState<any>(null);
  const [selectedVolume, setSelectedVolume] = useState<any>(null);
  const flattenedMicroservices = data?.applications?.flatMap((app: any) =>
    app.microservices.map((ms: any) => ({
      ...ms,
      appName: app.name,
      appDescription: app.description,
      appCreatedAt: app.createdAt,
    }))
  );

  const handleRowClick = (row: any) => {
    setSelectedMs(row);
    setIsOpen(true);
  };

  useEffect(() => {
    console.log(data)
  }, [data])


  const handleRestart = async () => {
    try {
      debugger
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
        setShowResetConfirmModal(false)
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
        setShowDeleteConfirmModal(false)
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
        pushFeedback({ message: "Port Deleted", type: "success" });
        setIsOpen(false)
        setShowPortDeleteConfirmModal(false)
        
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
    }
  };

  const handleVolumeDelete = async () => {
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
        pushFeedback({ message: "Volume Deleted", type: "success" });
        setIsOpen(false)
        setShowVolumeDeleteConfirmModal(false)
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
    }
  };

  const parseMicroserviceFile = async (doc: any) => {
    if (API_VERSIONS.indexOf(doc.apiVersion) === -1) {
      return [{}, `Invalid API Version ${doc.apiVersion}, current version is ${API_VERSIONS.slice(-1)[0]}`]
    }
    if (doc.kind !== 'Microservice') {
      return [{}, `Invalid kind ${doc.kind}`]
    }
    if (!doc.metadata || !doc.spec) {
      return [{}, 'Invalid YAML format']
    }
    let tempObject = await parseMicroservice(doc.spec)
    const microserviceData = {
      name: lget(doc, 'metadata.name', undefined),
      ...tempObject,
    }
    return [microserviceData]
  }

  const deployMicroservice = async (microservice: any) => {

    const url = `/api/v3/microservices/${`${selectedMs.uuid}`}`
    try {
      const res = await request(url, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(microservice)
      })
      return res
    } catch (e: any) {
      pushFeedback({ message: e.message, type: 'error' })
    }
  }

  const handleYamlUpdate = async () => {
    if (editorIsChanged) {
      try {
        const doc = yaml.load(editorDataChanged)
        const [microserviceData, err] = await parseMicroserviceFile(doc)
        if (err) {
          return pushFeedback({ message: err, type: 'error' })
        }
        const newMicroservice = microserviceData
        const res = await deployMicroservice(newMicroservice)
        if (!res.ok) {
          try {
            const error = await res.json()
            pushFeedback({ message: error.message, type: 'error' })
          } catch (e) {
            pushFeedback({ message: res.statusText, type: 'error' })
          }
        } else {
          pushFeedback({ message: 'Microservice updated!', type: 'success' })
          setIsBottomDrawerOpen(false); 
          setEditorIsChanged(false); 
          setEditorDataChanged(null);
        }
      } catch (e: any) {
        pushFeedback({ message: e.message, type: 'error' })
      }
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

  useEffect(() => {
    if (selectedPort) {
      setShowPortDeleteConfirmModal(true)
    }
  }, [selectedPort])

  useEffect(() => {
    if (selectedVolume) {
      setShowVolumeDeleteConfirmModal(true)
    }
  }, [selectedVolume])

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
    },
    {
      label: 'Volumes',
      render: () => '',
      isSectionHeader: true,
    },
    {
      label: '',
      isFullSection: true,
      render: (node: any) => {
        const volumes = node?.volumeMappings || [];

        if (!Array.isArray(volumes) || volumes.length === 0) {
          return <div className="text-sm text-gray-400">No Volumes found for this microservice.</div>;
        }

        const volumesData = volumes.map((volume: any, index: number) => ({
          host: volume.hostDestination,
          container: volume.containerDestination,
          accessMode: volume.accessMode,
          type: volume.type || '-',
          key: `${volume.hostDestination}-${volume.containerDestination}-${index}`,
        }));

        const volumeColumns = [
          {
            key: 'host',
            header: 'Host',
            formatter: ({ row }: any) => <span className="text-white">{row.host}</span>,
          },
          {
            key: 'container',
            header: 'Container',
            formatter: ({ row }: any) => <span className="text-white">{row.container}</span>,
          },
          {
            key: 'accessMode',
            header: 'Access Mode',
            formatter: ({ row }: any) => <span className="uppercase text-white">{row.accessMode}</span>,
          },
          {
            key: 'type',
            header: 'Type',
            formatter: ({ row }: any) => (
              <span className="text-white">{row.type}</span>
            ),
          },
          {
            key: 'action',
            header: 'Action',
            render: (row: any) => {
              return (
                <button onClick={() => setSelectedVolume(row)} className="hover:text-red-600 hover:bg-white rounded">
                  <DeleteOutlineIcon fontSize="small" />
                </button>
              );
            },
          },
        ];

        return (
          <CustomDataTable
            columns={volumeColumns}
            data={volumesData}
            getRowKey={(row: any) => row.key}
          />
        );
      },
    },
    {
      label: 'Environment Variables',
      render: () => '',
      isSectionHeader: true,
    },
    {
      label: '',
      isFullSection: true,
      render: (node: any) => {
        const envVars = node?.env || [];

        if (!Array.isArray(envVars) || envVars.length === 0) {
          return <div className="text-sm text-gray-400">No environment variables found for this microservice.</div>;
        }

        const envData = envVars.map((env: any, index: number) => ({
          keyName: env.key,
          value: env.value,
          key: `${env.key}-${index}`,
        }));

        const envColumns = [
          {
            key: 'keyName',
            header: 'Key',
            formatter: ({ row }: any) => <span className="text-white">{row.keyName}</span>,
          },
          {
            key: 'value',
            header: 'Value',
            formatter: ({ row }: any) => <span className="text-white">{row.value}</span>,
          },
        ];

        return (
          <CustomDataTable
            columns={envColumns}
            data={envData}
            getRowKey={(row: any) => row.key}
          />
        );
      },
    },
    {
      label: 'Extra Hosts',
      render: () => '',
      isSectionHeader: true,
    },
    {
      label: '',
      isFullSection: true,
      render: (node: any) => {
        const extraHosts = node?.extraHosts || [];

        if (!Array.isArray(extraHosts) || extraHosts.length === 0) {
          return <div className="text-sm text-gray-400">No extra hosts found for this microservice.</div>;
        }

        const extraHostsData = extraHosts.map((host: any, index: number) => ({
          name: host.name || '-',
          address: host.address || '-',
          value: host.value || '-',
          key: `${host.name}-${host.address}-${index}`,
        }));

        const extraHostColumns = [
          {
            key: 'name',
            header: 'Name',
            formatter: ({ row }: any) => <span className="text-white">{row.name}</span>,
          },
          {
            key: 'address',
            header: 'Address',
            formatter: ({ row }: any) => <span className="text-white">{row.address}</span>,
          },
          {
            key: 'value',
            header: 'Value',
            formatter: ({ row }: any) => <span className="text-white">{row.value}</span>,
          },
        ];

        return (
          <CustomDataTable
            columns={extraHostColumns}
            data={extraHostsData}
            getRowKey={(row: any) => row.key}
          />
        );
      },
    }
  ];


  return (
    <div className="max-h-[90.8vh] min-h-[90.8vh] bg-gray-900 text-white overflow-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">Microservices List</h1>
      <CustomDataTable
        columns={columns}
        data={flattenedMicroservices || []}
        getRowKey={(row: any) => row.uuid}
      />
      <SlideOver
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={selectedMs?.name || 'Microservice Details'}
        data={selectedMs}
        fields={slideOverFields}
        onRestart={()=> setShowResetConfirmModal(true)}
        onDelete={()=> setShowDeleteConfirmModal(true)}
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
        open={showResetConfirmModal}
        onCancel={() => setShowResetConfirmModal(false)}
        onConfirm={handleRestart}
        title={`Rebuild ${selectedMs?.name}`}
        message={"This is not reversible."}
        cancelLabel={"Cancel"}
        confirmLabel={"Rebuild"}
        confirmColor='bg-blue'
      />
      <UnsavedChangesModal
        open={showDeleteConfirmModal}
        onCancel={() => setShowDeleteConfirmModal(false)}
        onConfirm={handleDelete}
        title={`Delete ${selectedMs?.name}`}
        message={"This is not reversible."}
        cancelLabel={"Cancel"}
        confirmLabel={"Delete"}
      />
      <UnsavedChangesModal
        open={showPortDeleteConfirmModal}
        onCancel={() => setShowPortDeleteConfirmModal(false)}
        onConfirm={handlePortsDelete}
        title={`Delete Port ${selectedPort?.internal}`}
        message={"This is not reversible."}
        cancelLabel={"Cancel"}
        confirmLabel={"Delete"}
      />
      <UnsavedChangesModal
        open={showVolumeDeleteConfirmModal}
        onCancel={() => setShowVolumeDeleteConfirmModal(false)}
        onConfirm={handleVolumeDelete}
        title={`Delete Volume ${selectedVolume?.host}`}
        message={"This is not reversible."}
        cancelLabel={"Cancel"}
        confirmLabel={"Delete"}
      />
    </div>
  );
}

export default MicroservicesList;

import React, { useState } from 'react';
import { useData } from '../../providers/Data';
import CustomDataTable from '../../CustomComponent/CustomDataTable';
import SlideOver from '../../CustomComponent/SlideOver';
import { format, formatDistanceToNow } from 'date-fns';
import { useController } from '../../ControllerProvider';
import { useFeedback } from '../../Utils/FeedbackContext';
import { dumpApplicationYAML } from '../../Utils/applicationYAML';
import AceEditor from "react-ace";
import ResizableBottomDrawer from '../../CustomComponent/ResizableBottomDrawer';
import UnsavedChangesModal from '../../CustomComponent/UnsavedChangesModal';
import { parseMicroservice } from '../../Utils/ApplicationParser';
import { API_VERSIONS } from '../../Utils/constants';
import lget from 'lodash/get'
import yaml from "js-yaml";

function SystemApplicationList() {
  const { data } = useData();
  const { request } = useController();
  const { pushFeedback } = useFeedback();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [isBottomDrawerOpen, setIsBottomDrawerOpen] = useState(false);
  const [editorIsChanged, setEditorIsChanged] = React.useState(false);
  const [editorDataChanged, setEditorDataChanged] = React.useState<any>();
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const handleRowClick = (row: any) => {
    setSelectedApplication(row);
    setIsOpen(true);
  };

  async function restartFunction() {
    try {
      const res = await request(`/api/v3/application/${selectedApplication.name}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ isActivated: !selectedApplication.isActivated })
      })
      if (res.ok) {
        selectedApplication.isActivated = !selectedApplication.isActivated
        pushFeedback({ message: selectedApplication.isActivated ? 'Application stopped!' : 'Application started!', type: 'success' })
        setShowResetConfirmModal(false);
      } else {
        pushFeedback({ message: res.statusText, type: 'error' })
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: 'error' })
    }
  }

  const handleRestart = async () => {
    await restartFunction();
    await new Promise(resolve => setTimeout(resolve, 8000));
    await restartFunction();
  };

  const handleDelete = async () => {
    if (!selectedApplication) return;
    try {
      const res = await request(`/api/v3/application/system/${selectedApplication.name}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: 'error' });
        return;
      }
      else {
        pushFeedback({ message: 'Microservice Deleted', type: 'success' });
        setShowDeleteConfirmModal(false)
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: 'error' });
    }
  };

  const parseApplicationFile = async (doc: any) => {
    if (API_VERSIONS.indexOf(doc.apiVersion) === -1) {
      return [{}, `Invalid API Version ${doc.apiVersion}, current version is ${API_VERSIONS.slice(-1)[0]}`]
    }
    if (doc.kind !== 'Application') {
      return [{}, `Invalid kind ${doc.kind}`]
    }
    if (!doc.metadata || !doc.spec) {
      return [{}, 'Invalid YAML format']
    }
    const application = {
      name: lget(doc, 'metadata.name', undefined),
      ...doc.spec,
      isActivated: true,
      microservices: await Promise.all((doc.spec.microservices || []).map(async (m: any) => parseMicroservice(m)))
    }

    return [application]
  }

  const handleYamlUpdate = async () => {
    try {
      const doc = yaml.load(editorDataChanged)
      const [applicationData, err] = await parseApplicationFile(doc)
      if (err) {
        return pushFeedback({ message: err, type: 'error' })
      }
      const newApplication = !data.applications?.find((a: any) => a.name === applicationData.name)
      const res = await deployApplication(applicationData, newApplication)
      if (!res.ok) {
        try {
          const error = await res.json()
          pushFeedback({ message: error.message, type: 'error' })
        } catch (e) {
          pushFeedback({ message: res.statusText, type: 'error' })
        }
      } else {
        pushFeedback({ message: newApplication ? 'Application deployed!' : 'Application updated!', type: 'success' })
        setIsBottomDrawerOpen(false);
        setEditorIsChanged(false);
        setEditorDataChanged(null);
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: 'error' })
    }
  };
  const deployApplication = async (application: any, newApplication: any) => {
    const url = `/api/v3/application/system${newApplication ? '' : `/${application.name}`}`
    try {
      const res = await request(url, {
        method: newApplication ? 'POST' : 'PUT',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(application)
      })
      return res
    } catch (e: any) {
      pushFeedback({ message: e.message, type: 'error' })
    }
  }

  const yamlDump = React.useMemo(() => {
    return dumpApplicationYAML({
      application: selectedApplication,
      activeAgents: data?.activeAgents,
      reducedAgents: data?.reducedAgents,
    });
  }, [selectedApplication, data]);

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
          className={`px-2 py-1 rounded-full text-xs font-semibold ${row.isActivated ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
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
    {
      label: 'Microservices',
      render: () => '',
      isSectionHeader: true,
    },
    {
      label: '',
      isFullSection: true,
      render: (node: any) => {
        const microservices = node?.microservices || [];

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
    {
      label: 'Routes',
      render: () => '',
      isSectionHeader: true,
    },
    {
      label: '',
      isFullSection: true,
      render: (node: any) => {
        const routes = node?.routes || [];

        if (!Array.isArray(routes) || routes.length === 0) {
          return <div className="text-sm text-gray-400">No routes available.</div>;
        }

        const tableData = routes.map((route: any, index: number) => ({
          name: route.name || '-',
          from: route.from || '-',
          to: route.to || '-',
          key: `${route.name || 'route'}-${index}`,
        }));

        const columns = [
          {
            key: 'name',
            header: 'Name',
            formatter: ({ row }: any) => <span className="text-white">{row.name}</span>,
          },
          {
            key: 'from',
            header: 'From',
            formatter: ({ row }: any) => <span className="text-white">{row.from}</span>,
          },
          {
            key: 'to',
            header: 'To',
            formatter: ({ row }: any) => <span className="text-white">{row.to}</span>,
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
    }
  ];

  return (
    <div className="max-h-[90.8vh] min-h-[90.8vh] bg-gray-900 text-white overflow-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
        System Application List
      </h1>

      <CustomDataTable
        columns={columns}
        data={data.systemApplications}
        getRowKey={(row) => row.id}
      />
      <SlideOver
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={selectedApplication?.msName || 'Microservice Details'}
        data={selectedApplication}
        fields={slideOverFields}
        onRestart={() => setShowResetConfirmModal(true)}
        onDelete={() => setShowDeleteConfirmModal(true)}
        onEditYaml={handleEditYaml}
        customWidth={700}
      />
      <ResizableBottomDrawer
        open={isBottomDrawerOpen}
        isEdit={editorIsChanged}
        onClose={() => { setIsBottomDrawerOpen(false); setEditorIsChanged(false); setEditorDataChanged(null) }}
        onSave={() => handleYamlUpdate()}
        title={`${selectedApplication?.name} YAML`}
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
        title={`Restart ${selectedApplication?.name}`}
        message={"This is not reversible."}
        cancelLabel={"Cancel"}
        confirmLabel={"Restart"}
        confirmColor='bg-blue'
      />
      <UnsavedChangesModal
        open={showDeleteConfirmModal}
        onCancel={() => setShowDeleteConfirmModal(false)}
        onConfirm={handleDelete}
        title={`Delete ${selectedApplication?.name}`}
        message={"This is not reversible."}
        cancelLabel={"Cancel"}
        confirmLabel={"Delete"}
      />
    </div>
  );
}

export default SystemApplicationList;

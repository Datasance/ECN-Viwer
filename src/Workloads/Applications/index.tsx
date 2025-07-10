import React, { useEffect, useState } from 'react';
import { useData } from '../../providers/Data';
import CustomDataTable from '../../CustomComponent/CustomDataTable';
import SlideOver from '../../CustomComponent/SlideOver';
import { format, formatDistanceToNow } from 'date-fns';
import { useController } from '../../ControllerProvider';
import { useFeedback } from '../../Utils/FeedbackContext';
import AceEditor from "react-ace";
import ResizableBottomDrawer from '../../CustomComponent/ResizableBottomDrawer';
import { dumpApplicationYAML } from '../../Utils/applicationYAML';
import UnsavedChangesModal from '../../CustomComponent/UnsavedChangesModal';
import { parseMicroservice } from '../../Utils/ApplicationParser';
import lget from 'lodash/get'
import { API_VERSIONS } from '../../Utils/constants';
import yaml from "js-yaml";
import { StatusColor, StatusType } from '../../Utils/Enums/StatusColor';
import { getTextColor } from '../../ECNViewer/utils';
import { useLocation } from 'react-router-dom';
import { NavLink } from 'react-router-dom';


function ApplicationList() {
  const { data } = useData();
  const { request } = useController();
  const { pushFeedback } = useFeedback();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [isBottomDrawerOpen, setIsBottomDrawerOpen] = useState(false);
  const [editorIsChanged, setEditorIsChanged] = React.useState(false);
  const [editorDataChanged, setEditorDataChanged] = React.useState<any>()
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showStartStopConfirmModal, setShowStartStopConfirmModal] = useState(false);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const applicationId = params.get('applicationId');

  useEffect(() => {
    if (applicationId && data?.applications) {
      const found = data.applications.find((a: any) => a.id === parseInt(applicationId));
      if (found) {
        setSelectedApplication(found);
        setIsOpen(true);
      }
    }
  }, [applicationId]);


  const handleRowClick = (row: any) => {
    setSelectedApplication(row);
    setIsOpen(true);
  };

  async function restartFunction(type: boolean) {
    try {
      const res = await request(`/api/v3/application/${selectedApplication.name}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ isActivated: type })
      })
      if (res.ok) {
        pushFeedback({ message: !type ? 'Application stopped!' : 'Application started!', type: 'success' })
        setShowResetConfirmModal(false);
        setShowStartStopConfirmModal(false);
        setIsOpen(false)
      } else {
        pushFeedback({ message: res.statusText, type: 'error' })
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: 'error' })
    }
  }

  const handleRestart = async () => {
    await restartFunction(false);
    await new Promise(resolve => setTimeout(resolve, 8000));
    await restartFunction(true);
  };

  const handleDelete = async () => {
    try {
      const res = await request(`/api/v3/application/${selectedApplication.name}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: 'error' });
        return;
      }
      else {
        pushFeedback({ message: 'Microservice Deleted', type: 'success' });
        setIsBottomDrawerOpen(false);
        setEditorIsChanged(false);
        setEditorDataChanged(null);
        setShowResetConfirmModal(false);
        setShowDeleteConfirmModal(false);
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: 'error' });
    }
  };

  const handleStartStop = async () => {
    await restartFunction(!selectedApplication?.isActivated);
  };

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
        setEditorDataChanged(null)
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: 'error' })
    }
  };
  const deployApplication = async (application: any, newApplication: any) => {
    const url = `/api/v3/application${newApplication ? '' : `/${application.name}`}`
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

  const readApplicationFile = async (item: any) => {
    const file = item
    if (file) {
      const reader = new window.FileReader()

      reader.onload = async function (evt: any) {
        try {
          const doc = yaml.load(evt.target.result)
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
          }
        } catch (e: any) {
          pushFeedback({ message: e.message, type: 'error' })
        }
      }

      reader.onerror = function (evt) {
        pushFeedback({ message: evt, type: 'error' })
      }

      reader.readAsText(file, 'UTF-8')
    }
  }

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
      render: (row: any) => {
        const statusKey = row.isActivated ? StatusType.ACTIVE : StatusType.INACTIVE;
        const bgColor = StatusColor[statusKey] ?? '#9CA3AF';
        const textColor = getTextColor(bgColor);
        return (
          <span
            className="px-2 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: bgColor,
              color: textColor
            }}
          >
            {row.isActivated ? 'ACTIVE' : 'INACTIVE'}
          </span>
        );
      }
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
      render: (row: any) => {
        const statusKey = row.isActivated ? StatusType.ACTIVE : StatusType.INACTIVE;
        const bgColor = StatusColor[statusKey] ?? '#9CA3AF';
        const textColor = getTextColor(bgColor);
        return (
          <span
            className="px-2 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: bgColor,
              color: textColor
            }}
          >
            {row.isActivated ? 'ACTIVE' : 'INACTIVE'}
          </span>
        );
      }
    },
    {
      label: 'System',
      render: (row: any) => (
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${row.isSystem ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'
            }`}
        >
          {row.isSystem ? 'SYSTEM' : 'USER'}
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
          key: `${ms.uuid}`,
          name: ms.name || '-',
          status: ms.status?.status || '-',
          agent: data.activeAgents?.find((a: any) => a.uuid === ms.iofogUuid)?.name ?? '-',
          agentId: ms.iofogUuid,
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
            render: (row: any) => {
              if (!row?.name) return <span className="text-gray-400">No name</span>;
              return (
                <NavLink
                  to={`/Workloads/MicroservicesList?microserviceId=${encodeURIComponent(row.key)}`}
                  className="text-blue-400 underline cursor-pointer"
                >
                  {row.name}
                </NavLink>
              );
            },
          },
          {
            key: 'status',
            header: 'Status',
            formatter: ({ row }: any) => <span className="text-white">{row.status}</span>,
          },
          {
            key: 'agent',
            header: 'Agent',
            render: (row: any) => {
              if (!row?.name) return <span className="text-gray-400">No name</span>;
              return (
                <NavLink
                  to={`/nodes/list?agentId=${encodeURIComponent(row.agentId)}`}
                  className="text-blue-400 underline cursor-pointer"
                >
                  {row.agent}
                </NavLink>
              );
            },
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
    <div className=" bg-gray-900 text-white overflow-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
        Application List
      </h1>
      <CustomDataTable
        columns={columns}
        data={data.applications}
        getRowKey={(row) => row.id}
        uploadDropzone
        uploadFunction={readApplicationFile}
      />
      <SlideOver
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={selectedApplication?.name || 'Application Details'}
        data={selectedApplication}
        fields={slideOverFields}
        onRestart={() => setShowResetConfirmModal(true)}
        onDelete={() => setShowDeleteConfirmModal(true)}
        onEditYaml={() => setIsBottomDrawerOpen(true)}
        customWidth={600}
        onStartStop={() => setShowStartStopConfirmModal(true)}
        startStopValue={selectedApplication?.isActivated}
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
          showPrintMargin={false} 
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
      <UnsavedChangesModal
        open={showStartStopConfirmModal}
        onCancel={() => setShowStartStopConfirmModal(false)}
        onConfirm={handleStartStop}
        title={`${!selectedApplication?.isActivated ? 'ACTIVE' : 'INACTIVE'} ${selectedApplication?.name}`}
        message={"This is not reversible."}
        cancelLabel={"Cancel"}
        confirmLabel={`${!selectedApplication?.isActivated ? 'ACTIVE' : 'INACTIVE'}`}
      />
    </div>
  );
}

export default ApplicationList;

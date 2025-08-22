import React, { useEffect, useState } from 'react'
import CustomDataTable from '../../CustomComponent/CustomDataTable'
import { ControllerContext } from '../../ControllerProvider'
import { FeedbackContext } from '../../Utils/FeedbackContext'
import lget from 'lodash/get'
import yaml from 'js-yaml'
import { parseMicroservice } from '../../Utils/ApplicationParser'
import UnsavedChangesModal from '../../CustomComponent/UnsavedChangesModal'
import DeployApplicationTemplate from '../../Catalog/Application/DeployApplicationTemplate'
import CustomActionModal from '../../CustomComponent/CustomActionModal'
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/mode-yaml";
import CustomLoadingModal from '../../CustomComponent/CustomLoadingModal'
import SlideOver from '../../CustomComponent/SlideOver'
import { format, formatDistanceToNow } from 'date-fns';
import ResizableBottomDrawer from '../../CustomComponent/ResizableBottomDrawer'

function AppTemplates() {
    const [fetching, setFetching] = React.useState(true)
    const [loading, setLoading] = React.useState(false)
    const [loadingMessage, setLoadingMessage] = React.useState("Catalog Adding...")
    const [catalog, setCatalog] = React.useState([])
    const { request } = React.useContext(ControllerContext)
    const { pushFeedback } = React.useContext(FeedbackContext)
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [showDeployModal, setShowDeployModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedItem, setselectedItem] = useState<any>()
    const [isOpen, setIsOpen] = useState(false);
    const [selectedApplicationTemplate, setSelectedApplicationTemplate] = useState<any | null>(null);
    const [isBottomDrawerOpen, setIsBottomDrawerOpen] = useState(false);
    const [editorIsChanged, setEditorIsChanged] = React.useState(false);
    const [editorDataChanged, setEditorDataChanged] = React.useState<any>()
    const [yamlDump, setyamlDump] = useState<any>()

    useEffect(() => {
        fetchCatalog()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleRowClick = (row: any) => {
        if (row.name) {
            fetchCatalogItem(row.name)
        }
    };

    function mapApplicationTemplate(item: any) {
        return {
            display: {
                microservices: lget(item, 'application.microservices', []).map((m: any) => m.name),
                variables: lget(item, 'variables', []).map((m: any) => m.key)
            },
            ...item
        }
    }

    async function fetchCatalog() {
        try {
            setFetching(true)
            const catalogItemsResponse = await request('/api/v3/applicationTemplates')
            if (!catalogItemsResponse.ok) {
                pushFeedback({ message: catalogItemsResponse.statusText, type: 'error' })
                setFetching(false)
                return
            }
            const catalogItems = (await catalogItemsResponse.json()).applicationTemplates
            setCatalog(catalogItems.map((item: any) => mapApplicationTemplate(item)))
            setFetching(false)
        } catch (e: any) {
            pushFeedback({ message: e.message, type: 'error' })
            setFetching(false)
        }
    }

    async function fetchCatalogItem(apptemplateName: string) {
        try {
            setFetching(true)
            const catalogItemResponse = await request(`/api/v3/applicationTemplate/${apptemplateName}`)
            if (!catalogItemResponse.ok) {
                pushFeedback({ message: catalogItemResponse.statusText, type: 'error' })
                setFetching(false)
                return
            }
            const catalogItems = (await catalogItemResponse.json())
            setSelectedApplicationTemplate(catalogItems);
            setIsOpen(true);
            setFetching(false)
        } catch (e: any) {
            pushFeedback({ message: e.message, type: 'error' })
            setFetching(false)
        }
    }

    const removeCatalogItem = async (item: any) => {
        try {
            setLoadingMessage("Catalog Removing...")
            setLoading(true)
            const res = await request(`/api/v3/applicationTemplate/${item.name}`, {
                method: 'DELETE'
            })
            if (!res.ok) {
                pushFeedback({ message: res.statusText, type: 'error' })
            } else {
                setCatalog(catalog.filter((i: any) => i.id !== item.id))
                pushFeedback({ message: 'Application template deleted', type: 'success' })
                setShowDeleteConfirmModal(false)
                setselectedItem(null);
            }
            setLoading(false)
        } catch (e: any) {
            pushFeedback({ message: e.message, type: 'error', uuid: 'error' })
            setLoading(false)
        }
    }

    const addCatalogItem = async (item: any) => {
        const newItem = { ...item }
        setLoadingMessage("Catalog Adding...")
        setLoading(true)
        const response = await request(`/api/v3/applicationTemplate/${newItem.name}`, {
            method: 'PUT',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newItem)
        })
        if (response.ok) {
            pushFeedback({ message: 'Catalog Updated!', type: 'success' })
            fetchCatalog()
            setLoading(false)
        } else {
            pushFeedback({ message: response.statusText, type: 'error' })
            setLoading(false)
        }
    }

    const updateCatalogItem = async (item: any) => {
        const newItem = { ...item }
        const response = await request(`/api/v3/applicationTemplate/${newItem.name}`, {
            method: 'PATCH',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newItem)
        })
        if (response.ok) {
            pushFeedback({ message: `${selectedApplicationTemplate?.name} Updated`, type: "success" });
            setIsBottomDrawerOpen(false);
            setEditorIsChanged(false);
            setEditorDataChanged(null);
            setIsOpen(false);
        } else {
            pushFeedback({ message: response.statusText, type: 'error' })

        }
    }

    const parseApplication = async (applicationYAML: any) => {
        return {
            ...applicationYAML,
            microservices: await Promise.all((applicationYAML.microservices || []).map(async (m: any) => parseMicroservice(m)))
        }
    }

    const parseApplicationTemplate = async (doc: any) => {
        if (doc.apiVersion !== 'datasance.com/v3') {
            return [{}, `Invalid API Version ${doc.apiVersion}, current version is datasance.com/v3`]
        }
        if (doc.kind !== 'ApplicationTemplate') {
            return [{}, `Invalid kind ${doc.kind}`]
        }
        if (!doc.metadata || !doc.spec) {
            return [{}, 'Invalid YAML format']
        }
        const application = await parseApplication(lget(doc, 'spec.application', {}))
        const applicationTemplate = {
            name: lget(doc, 'metadata.name', lget(doc, 'spec.name', undefined)),
            description: lget(doc, 'spec.description', ''),
            application,
            variables: lget(doc, 'spec.variables', [])
        }

        return [applicationTemplate]
    }

    const handleYamlUpload = async (item: any) => {
        const file = item
        if (file) {
            const reader = new window.FileReader()

            reader.onload = async function (evt: any) {
                try {
                    const doc = yaml.load(evt.target.result)
                    const [catalogItem, err] = await parseApplicationTemplate(doc)
                    if (err) {
                        return pushFeedback({ message: err, type: 'error' })
                    }
                    addCatalogItem(catalogItem)
                } catch (e) {
                    console.error({ e })
                    pushFeedback({ message: 'Could not parse the file', type: 'error' })
                }
            }

            reader.onerror = function (evt) {
                pushFeedback({ message: evt, type: 'error' })
            }

            reader.readAsText(file, 'UTF-8')
        }
    }

    async function handleYamlUpdate() {
        try {
            const parsed = yaml.load(editorDataChanged) as any;
            const [catalogItem, err] = await parseApplicationTemplate(parsed)
            if (err) {
                return pushFeedback({ message: err, type: 'error' })
            }
            updateCatalogItem(catalogItem)
        } catch (e: any) {
            console.error({ e })
            pushFeedback({ message: e.message, type: "error", uuid: "error" });
        }
    }

    const handleEditYaml = () => {
        if (!selectedApplicationTemplate) return;

        const { name, description, variables, application } = selectedApplicationTemplate;
        const microservices = application.microservices?.map((ms: any) => {
            let parsedConfig: any = {};
            try {
                parsedConfig =
                    typeof ms?.config === 'string' ? JSON.parse(ms.config) : ms.config || {};
            } catch (e) {
                console.warn(`Failed to parse config for ${ms.name}:`, e);
                parsedConfig = ms.config;
            }

            return {
                name: ms.name,
                agent: {
                    name: ms.agentName
                },
                images: (ms.images || []).reduce(
                    (acc: any, image: any) => {
                        switch (image.fogTypeId) {
                            case 1:
                                acc.x86 = image.containerImage;
                                break;
                            case 2:
                                acc.arm = image.containerImage;
                                break;
                        }
                        return acc;
                    },
                    {
                        registry: ms.registryId ?? null,
                        catalogItemId: ms.catalogItemId ?? null,
                    }
                ),
                container: {
                    annotations: JSON.parse(ms.annotations || '{}'),
                    rootHostAccess: ms.rootHostAccess ?? false,
                    runAsUser: ms.runAsUser ?? null,
                    ipcMode: ms?.ipcMode ?? '',
                    pidMode: ms?.pidMode ?? '',
                    platform: ms.platform ?? null,
                    runtime: ms.runtime ?? null,
                    cdiDevices: ms.cdiDevices ?? [],
                    capAdd: ms.capAdd ?? [],
                    capDrop: ms.capDrop ?? [],
                    volumes: (ms.volumeMappings || []).map((vm: any) => {
                        const { id, ...rest } = vm;
                        return rest;
                    }),
                    env: (ms.env || []).map((env: any) => {
                        const { id, ...rest } = env;
                        const cleanedEnv: any = { ...rest };
                        if (cleanedEnv.valueFromSecret === null || cleanedEnv.valueFromSecret === undefined) {
                            delete cleanedEnv.valueFromSecret;
                        }
                        if (cleanedEnv.valueFromConfigMap === null || cleanedEnv.valueFromConfigMap === undefined) {
                            delete cleanedEnv.valueFromConfigMap;
                        }
                        return cleanedEnv;
                    }),
                    extraHosts: (ms.extraHosts || []).map((eH: any) => {
                        const { id, ...rest } = eH;
                        return rest;
                    }),
                    ports: ms.ports ?? [],
                    commands: Array.isArray(ms.cmd) ? [...ms.cmd] : [],
                    cpuSetCpus: ms?.cpuSetCpus ?? '',
                    ...(ms?.memoryLimit !== undefined && ms?.memoryLimit !== null && { memoryLimit: ms.memoryLimit }),
                    healthCheck: ms?.healthCheck ?? {},
                },
                schedule: ms?.schedule ?? 50,
                msRoutes: {
                    pubTags: ms.pubTags ?? [],
                    subTags: ms.subTags ?? [],
                },
                config: parsedConfig,
            };
        });

        const routes = application.routes?.map((r: any) => ({
            name: r.name,
            from: r.from,
            to: r.to,
        }));

        const yamlDump = {
            apiVersion: 'datasance.com/v3',
            kind: 'ApplicationTemplate',
            metadata: {
                name: name,
            },
            spec: {
                description: description,
                variables: variables.map((v: any) => ({
                    key: v.key,
                    description: v.description,
                })),
                application: {
                    microservices: microservices,
                    routes: routes
                },
            },
        };

        const yamlString = yaml.dump(yamlDump, { noRefs: true, indent: 2 });
        setyamlDump(yamlString);
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
            render: (row: any) => <span>{row.description || '-'}</span>,
        },
    ];

    const slideOverFields = [
        {
            label: 'Application Template Details',
            render: () => '',
            isSectionHeader: true,
        },
        {
            label: 'Name',
            render: (row: any) => row.name || 'N/A',
        },
        {
            label: 'Description',
            render: (row: any) => row.description || 'N/A',
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
                const microservices = node?.application?.microservices || [];

                if (!Array.isArray(microservices) || microservices.length === 0) {
                    return <div className="text-sm text-gray-400">No microservices available.</div>;
                }

                const tableData = microservices.map((route: any, index: number) => ({
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
            label: 'Variables',
            render: () => '',
            isSectionHeader: true,
        },
        {
            label: '',
            isFullSection: true,
            render: (node: any) => {
                const variables = node?.variables || [];

                if (!Array.isArray(variables) || variables.length === 0) {
                    return <div className="text-sm text-gray-400">No variables available.</div>;
                }

                const tableData = variables.map((route: any, index: number) => ({
                    id: route.id,
                    key: route.key,
                    applicationTemplateId: route.applicationTemplateId,
                    description: route.description,
                }));

                const columns = [
                    {
                        key: 'id',
                        header: 'Id',
                        formatter: ({ row }: any) => <span className="text-white">{row.id}</span>,
                    },
                    {
                        key: 'key',
                        header: 'Key',
                        formatter: ({ row }: any) => <span className="text-white">{row.key}</span>,
                    },
                    {
                        key: 'applicationTemplateId',
                        header: 'Application Template Id',
                        formatter: ({ row }: any) => <span className="text-white">{row.applicationTemplateId}</span>,
                    },
                    {
                        key: 'description',
                        header: 'Description',
                        formatter: ({ row }: any) => <span className="text-white">{row.description}</span>,
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
        <>
            {fetching ?
                <>
                    <CustomLoadingModal
                        open={true}
                        message="Fetching Certificates"
                        spinnerSize="lg"
                        spinnerColor="text-green-500"
                        overlayOpacity={60}
                    />
                </>
                :
                <>
                    <div className="bg-gray-900 text-white overflow-auto p-4">
                        <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
                            Application Templates
                        </h1>

                        <CustomDataTable
                            columns={columns}
                            data={catalog}
                            getRowKey={(row: any) => row.id}
                            uploadDropzone
                            uploadFunction={handleYamlUpload}
                            closeMenuRowKey={selectedItem}
                        />
                    </div>
                    <SlideOver
                        open={isOpen}
                        onClose={() => setIsOpen(false)}
                        onPublish={() => setShowDeployModal(true)}
                        onDelete={() => setShowDeleteConfirmModal(true)}
                        onEditYaml={handleEditYaml}
                        title={selectedApplicationTemplate?.name || 'Application Templates Details'}
                        data={selectedApplicationTemplate}
                        fields={slideOverFields}
                        customWidth={900}
                    />
                    <ResizableBottomDrawer
                        open={isBottomDrawerOpen}
                        isEdit={editorIsChanged}
                        onClose={() => { setIsBottomDrawerOpen(false); setEditorIsChanged(false); setEditorDataChanged(null) }}
                        onSave={() => handleYamlUpdate()}
                        title={`${selectedApplicationTemplate?.name} Template`}
                        showUnsavedChangesModal
                        unsavedModalTitle='Changes Not Saved'
                        unsavedModalMessage='Are you sure you want to exit? All unsaved changes will be lost.'
                        unsavedModalCancelLabel='Stay'
                        unsavedModalConfirmLabel='Exit Anyway'

                    >
                        <AceEditor
                            setOptions={{ useWorker: false }}
                            mode="yaml"
                            theme="tomorrow"
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
                        open={showDeleteConfirmModal}
                        onCancel={() => { setShowDeleteConfirmModal(false); }}
                        onConfirm={() => removeCatalogItem(selectedApplicationTemplate)}
                        title={`Delete ${selectedApplicationTemplate?.name}`}
                        message={"This is not reversible."}
                        cancelLabel={"Cancel"}
                        confirmLabel={"Delete"}
                    />
                    <CustomActionModal
                        open={showDeployModal}
                        child={<DeployApplicationTemplate template={selectedApplicationTemplate} close={() => setShowDeployModal(false)} />}
                        title={`Deploy ${selectedApplicationTemplate?.name}`}
                    />
                    <CustomActionModal
                        open={showDetailModal}
                        child={
                            <div className="w-full h-[70vh] min-h-[400px]">
                                <AceEditor
                                    mode="yaml"
                                    theme="tomorrow"
                                    value={
                                        selectedApplicationTemplate ? yaml.dump(selectedApplicationTemplate) : ''
                                    }
                                    setOptions={{
                                        useWorker: false,
                                        wrap: true,
                                        tabSize: 2,
                                    }}
                                    onLoad={(editor) => {
                                        editor.renderer.setPadding(10);
                                        editor.renderer.setScrollMargin(10);
                                        editor.getSession().setUseWrapMode(true);
                                    }}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '4px',
                                    }}
                                />
                            </div>
                        }
                        title={`${selectedItem?.name} Details`}
                        onCancel={() => setShowDetailModal(false)}
                        cancelLabel="Cancel"
                    />
                    <CustomLoadingModal
                        open={loading}
                        message={loadingMessage}
                        spinnerSize="lg"
                        spinnerColor="text-green-500"
                        overlayOpacity={60}
                    />
                </>
            }

        </>

    )
}

export default AppTemplates

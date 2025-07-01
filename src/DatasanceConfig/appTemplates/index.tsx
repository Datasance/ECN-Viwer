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
import CustomLoadingModal from '../../CustomComponent/CustomLoadingModal'

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

    useEffect(() => {
        fetchCatalog()
    }, [])

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

    const columns = [
        {
            key: 'name',
            header: 'Name',
            render: (row: any) => (
                <span>{row.name || '-'}</span>
            ),
        },
        {
            key: 'description',
            header: 'Description',
            render: (row: any) => <span>{row.description || '-'}</span>,
        },
        {
            key: 'microservices',
            header: 'Microservices',
            render: (row: any) => {
                const microservices = row?.application?.microservices || [];
                if (microservices.length === 0) return <span>-</span>;

                return (
                    <div className="flex flex-col space-y-1">
                        {microservices.map((ms: any, index: number) => (
                            <div key={index} className="text-sm text-white bg-gray-700 px-2 py-1 rounded">
                                {ms.name}
                            </div>
                        ))}
                    </div>
                );
            },
        },
        {
            key: 'variables',
            header: 'Variables',
            render: (row: any) => {
                const variables = row?.variables || [];
                if (variables.length === 0) return <span>-</span>;

                return (
                    <div className="max-h-64 overflow-y-auto flex flex-col space-y-1 pr-1 custom-scroll">
                        {variables.map((v: any, index: number) => (
                            <div key={index} className="text-xs text-gray-100 bg-gray-800 px-2 py-1 rounded">
                                <strong>{v.key}</strong>: {v.description}
                            </div>
                        ))}
                    </div>
                );
            },
        },
        {
            key: 'actions',
            header: 'Action',
            type: 'action',
            render: (row: any) => (
                <ul className="text-sm text-black bg-gray-200 rounded">
                    <li
                        className="px-4 py-2 hover:bg-gray-700 cursor-pointer hover:text-white"
                        onClick={() => {
                            setselectedItem(row);
                            setShowDeployModal(true)
                        }}
                    >
                        Deploy
                    </li>
                    <li
                        className="px-4 py-2 hover:bg-gray-700 cursor-pointer hover:text-white"
                        onClick={() => {
                            setselectedItem(row);
                            setShowDetailModal(true)
                        }}
                    >
                        Details
                    </li>
                    <li
                        className="px-4 py-2 hover:bg-red-600 hover:text-white cursor-pointer"
                        onClick={() => {
                            setselectedItem(row);
                            setShowDeleteConfirmModal(true)
                        }}
                    >
                        Remove
                    </li>
                </ul>
            ),
        }
    ];

    return (
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
            <UnsavedChangesModal
                open={showDeleteConfirmModal}
                onCancel={() => { setShowDeleteConfirmModal(false); }}
                onConfirm={() => removeCatalogItem(selectedItem)}
                title={`Delete ${selectedItem?.name}`}
                message={"This is not reversible."}
                cancelLabel={"Cancel"}
                confirmLabel={"Delete"}
            />
            <CustomActionModal
                open={showDeployModal}
                child={<DeployApplicationTemplate template={selectedItem} close={() => setShowDeployModal(false)} />}
                title={`Deploy ${selectedItem?.name}`}
            />
            <CustomActionModal
                open={showDetailModal}
                child={
                    <div className="w-full h-[70vh] min-h-[400px]">
                        <AceEditor
                            mode="json"
                            theme="monokai"
                            value={selectedItem ? JSON.stringify(selectedItem, null, 2) : ''}
                            setOptions={{
                                useWorker: false,
                                wrap: true,
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
                onCancel={() => { setShowDetailModal(false); }}
                cancelLabel={"Cancel"}
            />
            <CustomLoadingModal
                open={loading}
                message={loadingMessage}
                spinnerSize="lg"
                spinnerColor="text-green-500"
                overlayOpacity={60}
            />
        </>

    )
}

export default AppTemplates

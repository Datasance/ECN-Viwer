import React, { useEffect, useState } from 'react'
import CustomDataTable from '../../CustomComponent/CustomDataTable'
import { ControllerContext } from '../../ControllerProvider'
import { FeedbackContext } from '../../Utils/FeedbackContext'
import { NavLink, useLocation } from 'react-router-dom'
import SlideOver from '../../CustomComponent/SlideOver'
import FileCopyIcon from '@material-ui/icons/FileCopy'
import CheckIcon from '@material-ui/icons/Check'

function Services() {
    const [fetching, setFetching] = React.useState(true)
    const [services, setServices] = React.useState([])
    const { request } = React.useContext(ControllerContext)
    const { pushFeedback } = React.useContext(FeedbackContext)
    const [isOpen, setIsOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<any | null>(null);
    const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const serviceName = params.get('name');

    const handleRowClick = (row: any) => {
        if (row.name) {
            fetchServicesItem(row.name)
        }
    };

    const handleCopyEndpoint = async (endpoint: string) => {
        try {
            await navigator.clipboard.writeText(endpoint);
            setCopiedEndpoint(endpoint);
            setTimeout(() => setCopiedEndpoint(null), 1500);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const renderServiceEndpoint = (endpoint: string) => {
        if (!endpoint || endpoint === '-') return <span>-</span>;
        
        return (
            <div className="flex items-center space-x-2">
                <span className="text-blue-400">{endpoint}</span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCopyEndpoint(endpoint);
                    }}
                    className="text-gray-300 hover:text-white"
                    title={copiedEndpoint === endpoint ? 'Copied!' : 'Copy to clipboard'}
                >
                    {copiedEndpoint === endpoint ? <CheckIcon /> : <FileCopyIcon />}
                </button>
            </div>
        );
    };

    const renderTags = (tags: any) => {
        if (!tags) return 'N/A';
        
        // Handle both string and array cases
        const tagArray = Array.isArray(tags) ? tags : [tags];
        
        if (tagArray.length === 0) return 'N/A';
        
        return (
            <div className="flex flex-wrap gap-1">
                {tagArray.map((tag: string, index: number) => (
                    <span 
                        key={index}
                        className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded"
                    >
                        {tag}
                    </span>
                ))}
            </div>
        );
    };

    useEffect(() => {
        if (serviceName && services) {
            const found = services.find((service: any) => service.name === serviceName);
            if (found) {
                handleRowClick(found);
                setIsOpen(true);
            }
        }
    }, [serviceName, services]);

    async function fetchServices() {
        try {
            setFetching(true)
            const servicesItemsResponse = await request('/api/v3/services')
            if (!servicesItemsResponse.ok) {
                pushFeedback({ message: servicesItemsResponse.statusText, type: 'error' })
                setFetching(false)
                return
            }
            const servicesItems = (await servicesItemsResponse.json())
            setServices(servicesItems)
            setFetching(false)
        } catch (e: any) {
            pushFeedback({ message: e.message, type: 'error' })
            setFetching(false)
        }
    }

    async function fetchServicesItem(serviceName: string) {
        try {
            setFetching(true)
            const itemResponse = await request(`/api/v3/services/${serviceName}`)
            if (!itemResponse.ok) {
                pushFeedback({ message: itemResponse.statusText, type: 'error' })
                setFetching(false)
                return
            }
            const responseItem = (await itemResponse.json())
            setSelectedService(responseItem);
            setIsOpen(true);
            setFetching(false)
        } catch (e: any) {
            pushFeedback({ message: e.message, type: 'error' })
            setFetching(false)
        }
    }

    useEffect(() => {
        fetchServices()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
            key: 'type',
            header: 'type',
            render: (row: any) => <span>{row.type || '-'}</span>,
        },
        {
            key: 'resource',
            header: 'resource',
            render: (row: any) => <span>{row.resource || '-'}</span>,
        },
        {
            key: 'targetPort',
            header: 'Target Port',
            render: (row: any) => <span>{row.targetPort || '-'}</span>,
        },
        {
            key: 'bridgePort',
            header: 'Bridge Port',
            render: (row: any) => <span>{row.bridgePort || '-'}</span>,
        },
        {
            key: 'defaultBridge',
            header: 'Default Bridge',
            render: (row: any) => <span>{row.defaultBridge || '-'}</span>,
        },
        {
            key: 'provisioningStatus',
            header: 'status',
            render: (row: any) => <span>{row.provisioningStatus || '-'}</span>,
        },
    ];

    const slideOverFields = [
        {
            label: 'Service Details',
            render: () => '',
            isSectionHeader: true,
        },
        {
            label: 'Name',
            render: (row: any) => row.name || 'N/A',
        },
        {
            label: 'Tags',
            render: (row: any) => renderTags(row.tags),
        },
        {
            label: 'Type',
            render: (row: any) => row.type || 'N/A',
        },
        {
            label: 'Resource',
            render: (row: any) => {
                if (!row.resource) return <span className="text-gray-400">N/A</span>;
                
                if (row.type === 'agent') {
                    return (
                        <NavLink
                            to={`/nodes/list?agentId=${encodeURIComponent(row.resource)}`}
                            className="text-blue-400 underline cursor-pointer"
                        >
                            {row.resource}
                        </NavLink>
                    );
                } else if (row.type === 'microservice') {
                    return (
                        <NavLink
                            to={`/Workloads/MicroservicesList?microserviceId=${encodeURIComponent(row.resource)}`}
                            className="text-blue-400 underline cursor-pointer"
                        >
                            {row.resource}
                        </NavLink>
                    );
                } else {
                    return <span>{row.resource}</span>;
                }
            },
        },
        {
            label: 'Target Port',
            render: (row: any) => row.targetPort || 'N/A',
        },
        {
            label: 'Bridge Port',
            render: (row: any) => row.bridgePort || 'N/A',
        },
        {
            label: 'Default Bridge',
            render: (row: any) => row.defaultBridge || 'N/A',
        },
        {
            label: 'K8s Type',
            render: (row: any) => row.k8sType || 'N/A',
        },
        {
            label: 'Service Endpoint',
            render: (row: any) => renderServiceEndpoint(row.serviceEndpoint),
        },
        {
            label: 'Service Port',
            render: (row: any) => row.servicePort || 'N/A',
        },
        {
            label: 'Provisioning Status',
            render: (row: any) => row.provisioningStatus || 'N/A',
        },
    ];

    return (
        <>
            <div className="bg-gray-900 text-white overflow-auto p-4">
                <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
                    Services
                </h1>

                <CustomDataTable
                    columns={columns}
                    data={services}
                    getRowKey={(row: any) => row.id}
                />

                <SlideOver
                    open={isOpen}
                    onClose={() => setIsOpen(false)}
                    title={selectedService?.name || 'Service Details'}
                    data={selectedService}
                    fields={slideOverFields}
                    customWidth={600}
                />
            </div>
        </>

    )
}

export default Services

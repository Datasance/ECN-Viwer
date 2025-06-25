import React, { useEffect, useState } from 'react'
import CustomDataTable from '../../CustomComponent/CustomDataTable'
import { ControllerContext } from '../../ControllerProvider'
import { FeedbackContext } from '../../Utils/FeedbackContext'

function Services() {
    const [fetching, setFetching] = React.useState(true)
    const [services, setServices] = React.useState([])
    const { request } = React.useContext(ControllerContext)
    const { pushFeedback } = React.useContext(FeedbackContext)

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

    useEffect(() => {
        fetchServices()
    }, [])

    const columns = [
        {
            key: 'name',
            header: 'name',
            render: (row: any) => (
                <span>{row.name || '-'}</span>
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
            key: 'servicePort',
            header: 'service_port',
            render: (row: any) => <span>{row.servicePort || '-'}</span>,
        },
        {
            key: 'k8sType',
            header: 'k8s Type',
            render: (row: any) => <span>{row.k8sType || '-'}</span>,
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
            key: 'serviceEndpoint',
            header: 'serviceEndpoint',
            render: (row: any) => <span>{row.serviceEndpoint || '-'}</span>,
        },
        {
            key: 'provisioningStatus',
            header: 'status',
            render: (row: any) => <span>{row.provisioningStatus || '-'}</span>,
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
            </div>
        </>

    )
}

export default Services

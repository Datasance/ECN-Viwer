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
            const servicesItems = (await servicesItemsResponse.json()).servicesItems
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
            key: 'service',
            header: 'service',
            render: (row: any) => (
                <span>{row.service || '-'}</span>
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
            key: 'target_port',
            header: 'target_port',
            render: (row: any) => <span>{row.target_port || '-'}</span>,
        },
        {
            key: 'service_port',
            header: 'service_port',
            render: (row: any) => <span>{row.service_port || '-'}</span>,
        },
        {
            key: 'k8s_type',
            header: 'k8s_type',
            render: (row: any) => <span>{row.k8s_type || '-'}</span>,
        },
        {
            key: 'bridge_port',
            header: 'bridge_port',
            render: (row: any) => <span>{row.bridge_port || '-'}</span>,
        },
        {
            key: 'default_bridge',
            header: 'default_bridge',
            render: (row: any) => <span>{row.default_bridge || '-'}</span>,
        },
        {
            key: 'service_endpoint',
            header: 'service_endpoint',
            render: (row: any) => <span>{row.service_endpoint || '-'}</span>,
        },
        {
            key: 'status',
            header: 'status',
            render: (row: any) => <span>{row.status || '-'}</span>,
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

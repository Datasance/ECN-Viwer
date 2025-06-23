import React, { useEffect, useState } from 'react'
import CustomDataTable from '../../CustomComponent/CustomDataTable'
import { ControllerContext } from '../../ControllerProvider'
import { FeedbackContext } from '../../Utils/FeedbackContext'

function ConfigMaps() {
    const [fetching, setFetching] = React.useState(true)
    const [configMaps, setConfigMaps] = React.useState([])
    const { request } = React.useContext(ControllerContext)
    const { pushFeedback } = React.useContext(FeedbackContext)

    async function fetchConfigMaps() {
        try {
            setFetching(true)
            const configMapsItemsResponse = await request('/api/v3/configmaps')
            if (!configMapsItemsResponse.ok) {
                pushFeedback({ message: configMapsItemsResponse.statusText, type: 'error' })
                setFetching(false)
                return
            }
            const configMapsItems = (await configMapsItemsResponse.json()).configMapsItems
            debugger
            setConfigMaps(configMapsItems)
            setFetching(false)
        } catch (e: any) {
            pushFeedback({ message: e.message, type: 'error' })
            setFetching(false)
        }
    }

    useEffect(() => {
        fetchConfigMaps()
    }, [])

    const columns = [
        {
            key: 'configmap',
            header: 'configmap',
            render: (row: any) => (
                <span>{row.configmap || '-'}</span>
            ),
        },
        {
            key: 'id',
            header: 'id',
            render: (row: any) => <span>{row.id || '-'}</span>,
        },
        {
            key: 'immutable',
            header: 'immutable',
            render: (row: any) => <span>{row.immutable || '-'}</span>,
        },
    ];

    return (
        <>
            <div className="bg-gray-900 text-white overflow-auto p-4">
                <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
                    ConfigMaps Microservices
                </h1>

                <CustomDataTable
                    columns={columns}
                    data={configMaps}
                    getRowKey={(row: any) => row.id}
                />
            </div>
        </>

    )
}

export default ConfigMaps

import React, { useEffect } from 'react'
import CustomDataTable from '../../CustomComponent/CustomDataTable'
import { ControllerContext } from '../../ControllerProvider'
import { FeedbackContext } from '../../Utils/FeedbackContext'

function VolumeMounts() {
    const [fetching, setFetching] = React.useState(true)
    const [volumeMounts, setVolumeMounts] = React.useState<any[]>([])
    const { request } = React.useContext(ControllerContext)
    const { pushFeedback } = React.useContext(FeedbackContext)

    async function fetchVolumeMounts() {
        try {
            setFetching(true)
            const volumeMountsItemsResponse = await request('/api/v3/volumeMounts')
            if (!volumeMountsItemsResponse.ok) {
                pushFeedback({ message: volumeMountsItemsResponse.statusText, type: 'error' })
                setFetching(false)
                return
            }
            const volumeMountsItems = await volumeMountsItemsResponse.json()
            setVolumeMounts(Array.isArray(volumeMountsItems) ? volumeMountsItems : [])
            setFetching(false)
        } catch (e: any) {
            pushFeedback({ message: e.message, type: 'error' })
            setFetching(false)
        }
    }

    useEffect(() => {
        fetchVolumeMounts()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const columns = [
        {
            key: 'name',
            header: 'Name',
            render: (row: any) => (
                <span>{row.name || '-'}</span>
            ),
        },
        {
            key: 'secretName',
            header: 'Secret Name',
            render: (row: any) => (
                <span>{row.secretName || '-'}</span>
            ),
        },
        {
            key: 'configMapName',
            header: 'ConfigMap Name',
            render: (row: any) => (
                <span>{row.configMapName || '-'}</span>
            ),
        },
        {
            key: 'version',
            header: 'version',
            render: (row: any) => <span>{row.version || '-'}</span>,
        },
        {
            key: 'uuid',
            header: 'uuid',
            render: (row: any) => <span>{row.uuid || '-'}</span>,
        },
    ];

    return (
        <>
            <div className="bg-gray-900 text-white overflow-auto p-4">
                <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
                    VolumeMounts
                </h1>

                {fetching ? (
                    <div className="text-center py-8">
                        <div className="text-white">Loading...</div>
                    </div>
                ) : (
                    <CustomDataTable
                        columns={columns}
                        data={volumeMounts || []}
                        getRowKey={(row: any) => row.uuid || row.id || Math.random()}
                    />
                )}
            </div>
        </>

    )
}

export default VolumeMounts

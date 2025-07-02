import React, { useEffect } from 'react'
import CustomDataTable from '../../CustomComponent/CustomDataTable'
import { ControllerContext } from '../../ControllerProvider'
import { FeedbackContext } from '../../Utils/FeedbackContext'

function SecretsMicroservices() {
    const [fetching, setFetching] = React.useState(true)
    const [secrets, setSecrets] = React.useState([])
    const { request } = React.useContext(ControllerContext)
    const { pushFeedback } = React.useContext(FeedbackContext)

    async function fetchSecrets() {
        try {
            setFetching(true)
            const secretsItemsResponse = await request('/api/v3/secrets')
            if (!secretsItemsResponse.ok) {
                pushFeedback({ message: secretsItemsResponse.statusText, type: 'error' })
                setFetching(false)
                return
            }
            const secretsItems = (await secretsItemsResponse.json()).secrets
            setSecrets(secretsItems)
            setFetching(false)
        } catch (e: any) {
            pushFeedback({ message: e.message, type: 'error' })
            setFetching(false)
        }
    }

    useEffect(() => {
        fetchSecrets()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const columns = [
        {
            key: 'id',
            header: 'id',
            render: (row: any) => <span>{row.id || '-'}</span>,
        },
        {
            key: 'Name',
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
    ];

    return (
        <>
            <div className="bg-gray-900 text-white overflow-auto p-4">
                <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
                    Secrets
                </h1>

                <CustomDataTable
                    columns={columns}
                    data={secrets}
                    getRowKey={(row: any) => row.id}
                />
            </div>
        </>

    )
}

export default SecretsMicroservices

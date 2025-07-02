import React, { useEffect } from 'react'
import CustomDataTable from '../../CustomComponent/CustomDataTable'
import { ControllerContext } from '../../ControllerProvider'
import { FeedbackContext } from '../../Utils/FeedbackContext'

function CatalogMicroservices() {
    const [fetching, setFetching] = React.useState(true)
    const [catalog, setCatalog] = React.useState([])
    const { request } = React.useContext(ControllerContext)
    const { pushFeedback } = React.useContext(FeedbackContext)

    async function fetchCatalog() {
        try {
            setFetching(true)
            const catalogItemsResponse = await request('/api/v3/catalog/microservices')
            if (!catalogItemsResponse.ok) {
                pushFeedback({ message: catalogItemsResponse.statusText, type: 'error' })
                setFetching(false)
                return
            }
            const catalogItems = (await catalogItemsResponse.json()).catalogItems
            setCatalog(catalogItems)
            setFetching(false)
        } catch (e: any) {
            pushFeedback({ message: e.message, type: 'error' })
            setFetching(false)
        }
    }

    useEffect(() => {
        fetchCatalog()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const columns = [
        {
            key: 'id',
            header: 'ID',
            render: (row: any) => (
                <span>{row.id || '-'}</span>
            ),
        },
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
            key: 'registryId',
            header: 'Registry',
            render: (row: any) => <span>{row.registryId === 1 ? "Remote" : '-'}</span>,
        },
        {
            key: 'images',
            header: 'x86',
            render: (row: any) => <span>{row.images.find((x: any) => x.fogTypeId === 1)?.containerImage}</span>,
        },
        {
            key: 'images',
            header: 'ARM',
            render: (row: any) => <span>{row.images.find((x: any) => x.fogTypeId === 2)?.containerImage}</span>,
        },
        {
            key: 'category',
            header: 'Category',
            render: (row: any) => <span>{row.category || '-'}</span>,
        },
    ];

    return (
        <>
            <div className="bg-gray-900 text-white overflow-auto p-4">
                <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
                    Catalog Microservices
                </h1>

                <CustomDataTable
                    columns={columns}
                    data={catalog}
                    getRowKey={(row: any) => row.id}
                />
            </div>
        </>

    )
}

export default CatalogMicroservices

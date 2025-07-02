import React, { useEffect } from 'react'
import CustomDataTable from '../../CustomComponent/CustomDataTable'
import { ControllerContext } from '../../ControllerProvider'
import { FeedbackContext } from '../../Utils/FeedbackContext'

function Certificates() {
    const [fetching, setFetching] = React.useState(true)
    const [certificates, setCertificates] = React.useState([])
    const { request } = React.useContext(ControllerContext)
    const { pushFeedback } = React.useContext(FeedbackContext)

    async function fetchCertificates() {
        try {
            setFetching(true)
            const certificatesItemsResponse = await request('/api/v3/certificates')
            if (!certificatesItemsResponse.ok) {
                pushFeedback({ message: certificatesItemsResponse.statusText, type: 'error' })
                setFetching(false)
                return
            }
            const certificatesItems = (await certificatesItemsResponse.json()).certificates
            setCertificates(certificatesItems)
            setFetching(false)
        } catch (e: any) {
            pushFeedback({ message: e.message, type: 'error' })
            setFetching(false)
        }
    }

    useEffect(() => {
        fetchCertificates()
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            key: 'isCA',
            header: 'isCA',
            render: (row: any) => <span>{row.isCA.toString()}</span>,
        },
        {
            key: 'validFrom',
            header: 'Valid From',
            render: (row: any) => <span>{new Date(row.validFrom).toLocaleString()}</span>,
        },
        {
            key: 'validTo',
            header: 'Valid To',
            render: (row: any) => <span>{new Date(row.validTo).toLocaleString()}</span>,
        },
        {
            key: 'caName',
            header: 'ca name',
            render: (row: any) => <span>{row.caName || '-'}</span>,
        },
        {
            key: 'daysRemaining',
            header: 'Days Remaining',
            render: (row: any) => <span>{new Date(row.daysRemaining).toLocaleString()}</span>,
        },
        {
            key: 'isExpired',
            header: 'Is Expired',
            render: (row: any) => <span>{row.isExpired.toString()}</span>,
        },
    ];

    return (
        <>
            <div className="bg-gray-900 text-white overflow-auto p-4">
                <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
                    Certificates
                </h1>

                <CustomDataTable
                    columns={columns}
                    data={certificates}
                    getRowKey={(row: any) => row.id}
                />
            </div>
        </>

    )
}

export default Certificates

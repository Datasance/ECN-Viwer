import React, { useEffect, useState } from 'react'
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
            const certificatesItems = (await certificatesItemsResponse.json()).certificatesItems
            setCertificates(certificatesItems)
            setFetching(false)
        } catch (e: any) {
            pushFeedback({ message: e.message, type: 'error' })
            setFetching(false)
        }
    }

    useEffect(() => {
        fetchCertificates()
    }, [])

    const columns = [
        {
            key: 'certificate',
            header: 'Certificate',
            render: (row: any) => (
                <span>{row.certificate || '-'}</span>
            ),
        },
        {
            key: 'is_ca',
            header: 'IS CA',
            render: (row: any) => <span>{row.is_ca || '-'}</span>,
        },
        {
            key: 'valid_from',
            header: 'Valid From',
            render: (row: any) => <span>{new Date(row.valid_from).toLocaleString()}</span>,
        },
        {
            key: 'valid_to',
            header: 'Valid To',
            render: (row: any) => <span>{new Date(row.valid_to).toLocaleString()}</span>,
        },
        {
            key: 'ca_name',
            header: 'ca name',
            render: (row: any) => <span>{row.ca_name || '-'}</span>,
        },
        {
            key: 'days_remaining',
            header: 'Days Remaining',
            render: (row: any) => <span>{new Date(row.days_remaining).toLocaleString()}</span>,
        },
        {
            key: 'is_expired',
            header: 'Is Expired',
            render: (row: any) => <span>{new Date(row.is_expired).toLocaleString()}</span>,
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

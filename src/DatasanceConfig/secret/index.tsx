import React, { useEffect, useState } from 'react'
import CustomDataTable from '../../CustomComponent/CustomDataTable'
import { ControllerContext } from '../../ControllerProvider'
import { FeedbackContext } from '../../Utils/FeedbackContext'
import SlideOver from '../../CustomComponent/SlideOver'
import CryptoTextBox from '../../CustomComponent/CustomCryptoTextBox'
import { useLocation } from 'react-router-dom';

function Secrets() {
    const [fetching, setFetching] = React.useState(true)
    const [secrets, setSecrets] = React.useState([])
    const { request } = React.useContext(ControllerContext)
    const { pushFeedback } = React.useContext(FeedbackContext)
    const [isOpen, setIsOpen] = useState(false);
    const [selectedSecret, setselectedSecret] = useState<any | null>(null);
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const secretName = params.get('secretName');

    const handleRowClick = (row: any) => {
        if (row.name) {
            fetchSecretItem(row.name)
        }
    };

    useEffect(() => {
        if (secretName && secrets) {
            const found = secrets.find((secret: any) => secret.name === secretName);
            if (found) {
                handleRowClick(found);
                setIsOpen(true);
            }
        }
    }, [secretName, secrets]);



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

    async function fetchSecretItem(secretName: string) {
        try {
            setFetching(true)
            const itemResponse = await request(`/api/v3/secrets/${secretName}`)
            if (!itemResponse.ok) {
                pushFeedback({ message: itemResponse.statusText, type: 'error' })
                setFetching(false)
                return
            }
            const responseItem = (await itemResponse.json())
            setselectedSecret(responseItem);
            setIsOpen(true);
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
    ];
    const slideOverFields = [
        {
            label: 'Secret Details',
            render: () => '',
            isSectionHeader: true,
        },
        {
            label: 'Secret Name',
            render: (row: any) => row.name || 'N/A',
        },
        {
            label: 'Type',
            render: (row: any) => row.type || 'N/A',
        },
        {
            label: 'Data',
            render: () => '',
            isSectionHeader: true,
        },
        {
            label: '',
            isFullSection: true,
            render: (node: any) => {
                const entries = Object.entries(node?.data || {});

                return (
                    <div className="space-y-6">
                        {entries.map(([key, rawValue], index) => {
                            let parsed: any = null;

                            try {
                                if (typeof rawValue === 'string') {
                                    parsed = JSON.parse(rawValue);
                                } else if (typeof rawValue === 'object') {
                                    parsed = rawValue;
                                } else {
                                    parsed = rawValue;
                                }
                            } catch (e) {
                                parsed = rawValue;
                            }
                            return (
                                <div key={index} className="py-3 flex flex-col">
                                    <div className="text-sm font-medium text-gray-300 mb-1">
                                        {key}
                                    </div>
                                    <div className="text-sm text-white break-all bg-gray-800 rounded px-2 py-1">
                                        <CryptoTextBox data={parsed} mode={node.type === 'tls' ? 'encrypted' : 'plain'} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            },
        }
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
                <SlideOver
                    open={isOpen}
                    onClose={() => setIsOpen(false)}
                    title={selectedSecret?.name || 'Secret Details'}
                    data={selectedSecret}
                    fields={slideOverFields}
                    customWidth={600}
                />
            </div>
        </>

    )
}

export default Secrets

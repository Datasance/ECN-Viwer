import React, { useEffect, useState } from 'react'
import CustomDataTable from '../../CustomComponent/CustomDataTable'
import { ControllerContext } from '../../ControllerProvider'
import { FeedbackContext } from '../../Utils/FeedbackContext'
import SlideOver from '../../CustomComponent/SlideOver'
import { NavLink } from 'react-router-dom'
import { useLocation } from 'react-router-dom';

function VolumeMounts() {
    const [fetching, setFetching] = React.useState(true)
    const [volumeMounts, setVolumeMounts] = React.useState<any[]>([])
    const { request } = React.useContext(ControllerContext)
    const { pushFeedback } = React.useContext(FeedbackContext)
    const [isOpen, setIsOpen] = useState(false);
    const [selectedVolume, setselectedVolume] = useState<any | null>(null);
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const volumeMountName = params.get('volumeMountName');


    const handleRowClick = (row: any) => {
        if (row.name) {
            fetchVolumeMountItem(row.name)
        }
    };

    useEffect(() => {
        if (volumeMountName && volumeMounts) {
            const found = volumeMounts.find((volumeMount: any) => volumeMount.name === volumeMountName);
            if (found) {
                handleRowClick(found);
                setIsOpen(true);
            }
        }
    }, [volumeMountName, volumeMounts]);

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

    async function fetchVolumeMountItem(volumeName: string) {
        try {
            setFetching(true)
            const itemResponse = await request(`/api/v3/volumeMounts/${volumeName}`)
            if (!itemResponse.ok) {
                pushFeedback({ message: itemResponse.statusText, type: 'error' })
                setFetching(false)
                return
            }
            const responseItem = (await itemResponse.json())
            setselectedVolume(responseItem);
            setIsOpen(true);
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
                <div
                    className="cursor-pointer text-blue-400 hover:underline"
                    onClick={() => handleRowClick(row)}
                >
                    {row.name}
                </div>
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
    ];

    const slideOverFields = [
        {
            label: 'Volume Mount Details',
            render: () => '',
            isSectionHeader: true,
        },
        {
            label: 'Name',
            render: (row: any) => row.name || 'N/A',
        },
        {
            label: 'Secret Name',
            render: (row: any) => {
                if (!row.secretName) return <span className="text-gray-400">N/A</span>;
                return (
                    <NavLink
                        to={`/config/secret?secretName=${encodeURIComponent(row.secretName)}`}
                        className="text-blue-400 underline cursor-pointer"
                    >
                        {row.secretName}
                    </NavLink>
                );
            },
        },
        {
            label: 'Config Map Name',
            render: (row: any) => {
                if (!row.configMapName) return <span className="text-gray-400">N/A</span>;
                return (
                    <NavLink
                        to={`/config/ConfigMaps?configMapName=${encodeURIComponent(row.configMapName)}`}
                        className="text-blue-400 underline cursor-pointer"
                    >
                        {row.configMapName}
                    </NavLink>
                );
            },
        },
        {
            label: 'uuid',
            render: (row: any) => row.uuid || 'N/A',
        },
        {
            label: 'Version',
            render: (row: any) => row.version || 'N/A',
        },
    ];

    return (
        <>
            <div className="bg-gray-900 text-white overflow-auto p-4">
                <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
                    Volume Mount List
                </h1>

                <CustomDataTable
                    columns={columns}
                    data={volumeMounts || []}
                    getRowKey={(row: any) => row.uuid || row.id || Math.random()}
                />

                <SlideOver
                    open={isOpen}
                    onClose={() => setIsOpen(false)}
                    title={selectedVolume?.name || 'Secret Details'}
                    data={selectedVolume}
                    fields={slideOverFields}
                    customWidth={600}
                />
            </div>
        </>

    )
}

export default VolumeMounts

import React, { useEffect, useState } from 'react'
import CustomDataTable from '../../CustomComponent/CustomDataTable'
import { ControllerContext } from '../../ControllerProvider'
import { FeedbackContext } from '../../Utils/FeedbackContext'
import SlideOver from '../../CustomComponent/SlideOver'
import { NavLink } from 'react-router-dom'
import { useLocation } from 'react-router-dom';
import { useData } from '../../providers/Data';
import { StatusColor, StatusType } from '../../Utils/Enums/StatusColor';
import CustomLoadingModal from '../../CustomComponent/CustomLoadingModal'

function VolumeMounts() {
    const { data } = useData();
    const [fetching, setFetching] = React.useState(true)
    const [volumeMounts, setVolumeMounts] = React.useState<any[]>([])
    const { request } = React.useContext(ControllerContext)
    const { pushFeedback } = React.useContext(FeedbackContext)
    const [isOpen, setIsOpen] = useState(false);
    const [selectedVolume, setselectedVolume] = useState<any | null>(null);
    const [fogUuids, setFogUuids] = useState<any[]>([]);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            const fogUuidsResponse = await request(`/api/v3/volumeMounts/${volumeName}/link`)
            if (!fogUuidsResponse.ok) {
                pushFeedback({ message: fogUuidsResponse.statusText, type: 'error' })
                setFetching(false)
                return
            }
            const fogUuidsData = await fogUuidsResponse.json()
            const fogUuids = fogUuidsData.fogUuids || []
            setFogUuids(Array.isArray(fogUuids) ? fogUuids : [])
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
        {
            label: 'Linked Fog Nodes',
            render: () => '',
            isSectionHeader: true,
        },
        {
            label: 'Fog Nodes',
            render: () => {
                if (!Array.isArray(fogUuids)) {
                    return (
                        <div className="flex items-center space-x-2 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span>No fog nodes linked</span>
                        </div>
                    );
                }
                if (fogUuids.length === 0) {
                    return (
                        <div className="flex items-center space-x-2 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span>No fog nodes linked</span>
                        </div>
                    );
                }
                return (
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium text-gray-300">
                                {fogUuids.length} fog node{fogUuids.length !== 1 ? 's' : ''} linked
                            </span>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden backdrop-blur-sm">
                            <div className="divide-y divide-gray-700/50">
                                {fogUuids.map((fogUuid: any, index: number) => {
                                    const agent = data.reducedAgents.byUUID[fogUuid];
                                    const statusKey = agent?.daemonStatus;
                                    const bgColor = StatusColor[statusKey as StatusType] ?? '#9CA3AF';

                                    return (
                                        <div key={fogUuid} className="p-3 hover:bg-gray-750/50 transition-all duration-200 group">
                                            <NavLink
                                                to={`/nodes/list?agentId=${encodeURIComponent(fogUuid)}`}
                                                className="flex items-center justify-between"
                                            >
                                                <div className="flex items-center space-x-3 flex-1">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bgColor }}></div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm text-gray-300 group-hover:text-blue-400 transition-colors duration-200">
                                                            {fogUuid}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            {agent?.name || 'Unknown Agent'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className="hidden group-hover:block">
                                                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </div>
                                                    <svg className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </NavLink>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            },
        },
    ];

    return (
        <>
            {fetching ?
                <>
                    <CustomLoadingModal
                        open={true}
                        message="Fetching Volume Mount List"
                        spinnerSize="lg"
                        spinnerColor="text-green-500"
                        overlayOpacity={60}
                    />
                </>
                :
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
            }
        </>

    )
}

export default VolumeMounts

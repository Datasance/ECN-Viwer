import React, { useEffect, useState } from 'react';
import { useData } from '../../providers/Data';
import CustomDataTable from '../../CustomComponent/CustomDataTable';
import CustomProgressBar from '../../CustomComponent/CustomProgressBar';
import SlideOver from '../../CustomComponent/SlideOver';
import { formatDistanceToNow, format } from 'date-fns';
import { useController } from '../../ControllerProvider';
import { useFeedback } from '../../Utils/FeedbackContext';
import UnsavedChangesModal from '../../CustomComponent/UnsavedChangesModal';
import AceEditor from "react-ace";
import ResizableBottomDrawer from '../../CustomComponent/ResizableBottomDrawer';
import yaml from 'js-yaml';
import { getTextColor, MiBFactor, prettyBytes } from '../../ECNViewer/utils';
import { StatusColor, StatusType } from '../../Utils/Enums/StatusColor';
import { NavLink } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

const formatDuration = (milliseconds: number): string => {
    if (!milliseconds || milliseconds <= 0) return 'N/A';

    const totalSeconds = Math.floor(milliseconds / 1000);

    const days = Math.floor(totalSeconds / (24 * 3600));
    const remainingHours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const remainingMinutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    if (days > 0) {
        return `${days}d${remainingHours}h`;
    }

    if (remainingHours > 0) {
        return `${remainingHours}h${remainingMinutes}m`;
    }

    if (remainingMinutes > 0) {
        return `${remainingMinutes}m${remainingSeconds}s`;
    }

    return `${remainingSeconds}s`;
};

function NodesList() {
    const { data } = useData();
    const { request } = useController();
    const { pushFeedback } = useFeedback();
    const [selectedNode, setSelectedNode] = useState<any | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [isBottomDrawerOpen, setIsBottomDrawerOpen] = useState(false);
    const [editorIsChanged, setEditorIsChanged] = React.useState(false);
    const [editorDataChanged, setEditorDataChanged] = React.useState<any>()
    const [yamlDump, setyamlDump] = useState<any>()
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const agentId = params.get('agentId');

    useEffect(() => {
        if (agentId && data?.reducedAgents) {
            const found = data?.reducedAgents.byUUID[agentId];
            if (found) {
                setSelectedNode(found);
                setIsOpen(true);
            }
        }
    }, [agentId]);

    const handleRowClick = (row: any) => {
        setSelectedNode(row);
        setIsOpen(true);
    };

    const handleRestart = async () => {
        try {
            const res = await request(`/api/v3/iofog/${selectedNode.uuid}/reboot`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                pushFeedback({ message: res.statusText, type: "error" });
                return;
            }
            else {
                pushFeedback({ message: "Agent Rebooted", type: "success" });
                setShowResetConfirmModal(false);
            }
        } catch (e: any) {
            pushFeedback({ message: e.message, type: "error", uuid: "error" });
        }
    };

    const handleDelete = async () => {
        try {
            const res = await request(`/api/v3/iofog/${selectedNode.uuid}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                pushFeedback({ message: res.statusText || res.status, type: "error" });
                return;
            }
            else {
                pushFeedback({ message: "Agent deleted!", type: "success" });
                setShowDeleteConfirmModal(false);
            }
        } catch (e: any) {
            pushFeedback({ message: e.message || e.status, type: "error" });
        }
    };


    const handleEditYaml = () => {
        const fogType = selectedNode?.fogTypeId === 0 ? "Auto" : selectedNode?.fogTypeId === 1 ? "x86" : "arm";
        const yamlDump = {
            apiVersion: 'datasance.com/v3',
            kind: 'AgentConfig',
            metadata: {
                name: selectedNode?.name,
                tags: selectedNode?.tags,
            },
            spec: {
                name: selectedNode?.name,
                host: selectedNode?.host,
                location: selectedNode?.location,
                latitude: selectedNode?.latitude,
                longitude: selectedNode?.longitude,
                description: selectedNode?.description,
                fogType: fogType,
                networkInterface: selectedNode?.networkInterface,
                dockerUrl: selectedNode?.dockerUrl,
                containerEngine: selectedNode?.containerEngine,
                deploymentType: selectedNode?.deploymentType,
                diskLimit: selectedNode?.diskLimit,
                diskDirectory: selectedNode?.diskDirectory,
                memoryLimit: selectedNode?.memoryLimit,
                cpuLimit: selectedNode?.cpuLimit,
                logLimit: selectedNode?.logLimit,
                logDirectory: selectedNode?.logDirectory,
                logFileCount: selectedNode?.logFileCount,
                statusFrequency: selectedNode?.statusFrequency,
                changeFrequency: selectedNode?.changeFrequency,
                deviceScanFrequency: selectedNode?.deviceScanFrequency,
                bluetoothEnabled: selectedNode?.bluetoothEnabled,
                watchdogEnabled: selectedNode?.watchdogEnabled,
                gpsMode: selectedNode?.gpsMode,
                gpsScanFrequency: selectedNode?.gpsScanFrequency,
                gpsDevice: selectedNode?.gpsDevice,
                edgeGuardFrequency: selectedNode?.edgeGuardFrequency,
                abstractedHardwareEnabled: selectedNode?.abstractedHardwareEnabled,
                upstreamRouters: selectedNode?.upstreamRouters ?? [],
                routerConfig: {
                    routerMode: selectedNode?.routerMode,
                    messagingPort: selectedNode?.messagingPort,
                    edgeRouterPort: selectedNode?.edgeRouterPort,
                    interRouterPort: selectedNode?.interRouterPort,
                },
                logLevel: selectedNode?.logLevel,
                dockerPruningFrequency: selectedNode?.dockerPruningFrequency,
                availableDiskThreshold: selectedNode?.availableDiskThreshold,
                timeZone: selectedNode?.timeZone,
            },
        };

        const yamlString = yaml.dump(yamlDump, { noRefs: true, indent: 2 });
        setyamlDump(yamlString);
        setIsBottomDrawerOpen(true);
    };



    async function handleYamlUpdate() {
        try {
            const parsed = yaml.load(editorDataChanged) as any;
            const spec = parsed?.spec ?? {};
            const metadata = parsed?.metadata ?? {};

            const patchBody = { ...spec };

            patchBody.tags = metadata.tags;

            if (spec.routerConfig) {
                patchBody.routerMode = spec.routerConfig.routerMode;
                patchBody.messagingPort = spec.routerConfig.messagingPort;

                if (spec.routerConfig.edgeRouterPort !== undefined) {
                    patchBody.edgeRouterPort = spec.routerConfig.edgeRouterPort;
                }
                if (spec.routerConfig.interRouterPort !== undefined) {
                    patchBody.interRouterPort = spec.routerConfig.interRouterPort;
                }

                delete patchBody.routerConfig;
            }

            const fogType = spec?.fogType === "Auto" ? 0 : spec?.fogType === "x86" ? 1 : 2;
            patchBody.fogType = fogType;

            const res = await request(`/api/v3/iofog/${selectedNode?.uuid}`, {
                method: "PATCH",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify(patchBody),
            });

            if (!res.ok) {
                pushFeedback({ message: res.statusText, type: "error" });
            } else {
                pushFeedback({ message: "Controller Updated", type: "success" });
                setIsBottomDrawerOpen(false);
                setEditorIsChanged(false);
                setEditorDataChanged(null);
                setIsOpen(false);
            }
        } catch (e: any) {
            pushFeedback({ message: e.message, type: "error", uuid: "error" });
        }
    }

    const columns = [
        {
            key: 'name',
            header: 'Name',
            render: (row: any) => (
                <div className="cursor-pointer text-blue-400 hover:underline" onClick={() => handleRowClick(row)}>
                    {row.name}
                </div>
            ),
        },
        {
            key: 'ipAddress',
            header: 'IP Address',
        },
        {
            key: 'deploymentType',
            header: 'Deployment Type',
        },
        {
            key: 'containerEngine',
            header: 'Container Engine',
        },
        {
            key: 'memoryUsage',
            header: 'Memory Usage',
            render: (row: any) => (
                <CustomProgressBar value={row.memoryUsage} max={row.systemAvailableMemory} unit='agent' />
            ),
        },
        {
            key: 'cpuUsage',
            header: 'CPU Usage',
            render: (row: any) => (
                <CustomProgressBar value={row.cpuUsage} max={100} unit="%" />
            ),
        },
        {
            key: 'diskUsage',
            header: 'Disk Usage',
            render: (row: any) => (
                <CustomProgressBar value={row.diskUsage} max={row.systemAvailableDisk} unit='agent' />
            ),
        },
        {
            key: 'daemonStatus',
            header: 'Status',
            render: (row: any) => {
                const statusKey = row.daemonStatus;
                const bgColor = StatusColor[statusKey as StatusType] ?? '#9CA3AF';
                const textColor = getTextColor(bgColor);
                return (
                    <span
                        className="px-2 py-1 rounded-full text-xs font-semibold"
                        style={{
                            backgroundColor: bgColor,
                            color: textColor
                        }}
                    >
                        {row.daemonStatus}
                    </span>
                );
            }
        },
    ];

    const slideOverFields = [
        {
            label: 'uuid',
            render: (row: any) => row.uuid || 'N/A',
        },
        {
            label: 'Status',
            render: (row: any) => {
                const bgColor = StatusColor[row.daemonStatus as StatusType] ?? '#9CA3AF'
                const textColor = getTextColor(bgColor);
                return (
                    <span
                        className="px-2 py-1 rounded-full text-xs font-semibold"
                        style={{
                            backgroundColor: bgColor,
                            color: textColor
                        }}
                    >
                        {row.daemonStatus}
                    </span>
                );
            },
        },
        {
            label: 'Security Status',
            render: (row: any) => {
                const bgColor = StatusColor[row.securityStatus as StatusType] ?? '#9CA3AF'
                const textColor = getTextColor(bgColor);
                return (
                    <span
                        className="px-2 py-1 rounded-full text-xs font-semibold"
                        style={{
                            backgroundColor: bgColor,
                            color: textColor
                        }}
                    >
                        {row.securityStatus}
                    </span>
                );
            },
        },
        {
            label: 'Security Violation Info',
            render: (node: any) => {
                return node.warningMessage ? <span className="text-white whitespace-pre-wrap break-words">{node.securityViolationInfo}</span> : 'N/A'
            },
        },
        {
            label: 'Warning Message',
            render: (node: any) => {
                return node.warningMessage ? <span className="text-white whitespace-pre-wrap break-words">{node.warningMessage}</span> : 'N/A'
            },
        },
        {
            label: 'Last Active',
            render: (node: any) => {
                const lastActive = node.lastActive || node.updated || node.timestamp;
                if (!lastActive) return 'N/A';

                const date = new Date(lastActive);
                const timeAgo = formatDistanceToNow(date, { addSuffix: true });
                const formattedDate = format(date, 'PPpp');

                return `${timeAgo} (${formattedDate})`;
            },
        },
        {
            label: 'Description',
            render: (node: any) => { return node.description || 'N/A' },
        },
        {
            label: 'Up Time',
            render: (node: any) => { return formatDuration(node.daemonOperatingDuration) },
        },
        {
            label: 'Agent Details',
            render: () => '',
            isSectionHeader: true,
        },
        {
            label: 'Host',
            render: (node: any) => node.host || 'N/A',
        },
        {
            label: 'Version',
            render: (node: any) => node.version || 'N/A',
        },
        {
            label: 'Mode',
            render: (node: any) => node.isSystem ? "System" : 'Node',
        },
        {
            label: 'Deployment Type',
            render: (node: any) => node.deploymentType || 'N/A',
        },
        {
            label: 'Container Engine',
            render: (node: any) => node.containerEngine || 'N/A',
        },
        {
            label: 'Arch',
            render: (node: any) => node.fogTypeId === 0 ? "Auto" : node.fogTypeId === 1 ? "x86" : "arm",
        },
        {
            label: 'IP Address',
            render: (node: any) => node.ipAddress || 'N/A',
        },
        {
            label: 'IP Address External',
            render: (node: any) => node.ipAddressExternal || 'N/A',
        },
        {
            label: 'Tags',
            render: (node: any) => {
                return node.tags && node.tags?.length > 0 ? <span className="text-white whitespace-pre-wrap break-words">{node.tags}</span> : ""
            },
        },
        {
            label: 'Created',
            render: (node: any) => {
                const created = node.created || node.creationTimestamp;
                if (!created) return 'N/A';
                const date = new Date(created);
                const formattedDate = format(date, 'PPpp');
                return `${formatDistanceToNow(date, { addSuffix: true })} (${formattedDate})`;
            },
        },
        {
            label: 'Resource Utilization',
            render: () => '',
            isSectionHeader: true,
        },
        {
            label: 'CPU Usage',
            render: (node: any) => `${(Number(node.cpuUsage) || 0)?.toFixed(2)}%`,
        },
        {
            label: 'System Total CPU',
            render: (node: any) => `${node.systemTotalCpu?.toFixed(2)}%`,
        },
        {
            label: 'Memory Usage',
            render: (node: any) => `${prettyBytes((node.memoryUsage * MiBFactor) || 0)}`,
        },
        {
            label: 'System Available Memory',
            render: (node: any) => `${prettyBytes((node.systemAvailableMemory) || 0)}`,
        },
        {
            label: 'Disk Usage',
            render: (node: any) => `${prettyBytes(Number((node.diskUsage * MiBFactor)?.toFixed(2)) || 0)}`,
        },
        {
            label: 'System Available Disk',
            render: (node: any) => `${prettyBytes((node.systemAvailableDisk) || 0)}`,
        },
        {
            label: 'Volume Mounts',
            render: () => '',
            isSectionHeader: true,
        },
        {
            label: '',
            isFullSection: true,
            render: (node: any) => {

                if (!node.volumeMounts || node.volumeMounts === 0) {
                    return <div className="text-sm text-gray-400">No volume mounts found for this agent.</div>;
                }

                const localColumns = [
                    {
                        key: 'name',
                        header: 'Name',
                        render: (row: any) => {
                            if (!row?.name) return <span className="text-gray-400">No name</span>;
                            return (
                                <NavLink
                                    to={`/config/VolumeMounts?volumeMountName=${encodeURIComponent(row.name)}`}
                                    className="text-blue-400 underline cursor-pointer"
                                >
                                    {row.name}
                                </NavLink>
                            );
                        },
                    },
                    {
                        key: 'version',
                        header: 'Version',
                        formatter: ({ row }: any) => <span className="text-white">{row.version}</span>,
                    },
                    {
                        key: 'configMapName',
                        header: 'Config Map Name',
                        formatter: ({ row }: any) => <span className="text-white">{row.configMapName}</span>,
                    },
                    {
                        key: 'secretName',
                        header: 'Secret Name',
                        formatter: ({ row }: any) => <span className="text-white">{row.secretName}</span>,
                    },
                ];

                return (
                    <CustomDataTable
                        columns={localColumns}
                        data={node.volumeMounts}
                        getRowKey={(row: any) => row.uuid}
                    />
                );
            },
        },
        {
            label: 'Status',
            render: () => '',
            isSectionHeader: true,
        },
        {
            label: 'GPS Status',
            render: (node: any) => { return node.gpsStatus || 'N/A' },
        },
        {
            label: 'Cpu Violation',
            render: (row: any) => row.cpuViolation === "0" ? "false" : "true",
        },
        {
            label: 'Disk Violation',
            render: (row: any) => row.diskViolation === "0" ? "false" : "true",
        },
        {
            label: 'Memory Violation',
            render: (row: any) => row.memoryViolation === "0" ? "false" : "true",
        },
        {
            label: 'Is Ready To Rollback',
            render: (row: any) => <span>{row.isReadyToRollback.toString()}</span>,
        },
        {
            label: 'Is Ready To Upgrade',
            render: (row: any) => <span>{row.isReadyToUpgrade.toString()}</span>,
        },
        // {
        //     label: 'Last Command Time',
        //     render: (row: any) => row.lastCommandTime || 'N/A',
        // },
        {
            label: 'Last Status Time',
            render: (row: any) => <span>{new Date(row.lastStatusTime).toLocaleString()}</span>,
        },
        {
            label: 'Processed Messages',
            render: (row: any) => row.processedMessages || 'N/A',
        },
        {
            label: 'Applications',
            render: () => '',
            isSectionHeader: true,
        },
        {
            label: '',
            isFullSection: true,
            render: (node: any) => {
                const agentApplications = data?.applications?.filter(
                    (app: any) =>
                        app.microservices?.some((msvc: any) => msvc.iofogUuid === node.uuid)
                );

                if (!agentApplications || agentApplications.length === 0) {
                    return <div className="text-sm text-gray-400">No applications found for this agent.</div>;
                }
                const localColumns = [
                    {
                        key: 'name',
                        header: 'Application Name',
                        render: (row: any) => {
                            if (!row?.name) return <span className="text-gray-400">No name</span>;
                            return (
                                <NavLink
                                    to={`/Workloads/ApplicationList?applicationId=${encodeURIComponent(row.id)}`}
                                    className="text-blue-400 underline cursor-pointer"
                                >
                                    {row.name}
                                </NavLink>
                            );
                        },
                    },
                    {
                        key: 'isActivated',
                        header: 'Status',
                        render: (row: any) => {
                            const statusKey = row.isActivated ? StatusType.ACTIVE : StatusType.INACTIVE;
                            const bgColor = StatusColor[statusKey] ?? '#9CA3AF';
                            const textColor = getTextColor(bgColor);
                            return (
                                <span
                                    className="px-2 py-1 rounded-full text-xs font-semibold"
                                    style={{
                                        backgroundColor: bgColor,
                                        color: textColor
                                    }}
                                >
                                    {row.isActivated ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            );
                        }
                    },
                ];

                return (
                    <CustomDataTable
                        columns={localColumns}
                        data={agentApplications}
                        getRowKey={(row: any) => row.uuid}
                    />
                );
            },
        },
        {
            label: 'Microservices',
            render: () => '',
            isSectionHeader: true,
        },
        {
            label: '',
            isFullSection: true,
            render: (node: any) => {
                const agentApplications = data?.applications?.find(
                    (app: any) =>
                        app.microservices?.some((msvc: any) => msvc.iofogUuid === node.uuid)
                );
                const microservices = agentApplications?.microservices || [];

                if (!Array.isArray(microservices) || microservices.length === 0) {
                    return <div className="text-sm text-gray-400">No microservices available.</div>;
                }
                const tableData = microservices.map((ms: any, index: number) => ({
                    key: `${ms.uuid}`,
                    name: ms.name || '-',
                    status: ms.status?.status || '-',
                    agent: data.activeAgents?.find((a: any) => a.uuid === ms.iofogUuid)?.name ?? '-',
                    ports: Array.isArray(ms.ports) ? (
                        ms.ports.map((p: any, i: number) => (
                            <div key={i}>
                                {`${p.internal}:${p.external}/${p.protocol}`}
                            </div>
                        ))
                    ) : (
                        '-'
                    )
                }));

                const columns = [
                    {
                        key: 'name',
                        header: 'Name',
                        render: (row: any) => {
                            if (!row?.name) return <span className="text-gray-400">No name</span>;
                            return (
                                <NavLink
                                    to={`/Workloads/MicroservicesList?microserviceId=${encodeURIComponent(row.key)}`}
                                    className="text-blue-400 underline cursor-pointer"
                                >
                                    {row.name}
                                </NavLink>
                            );
                        },
                    },
                    {
                        key: 'status',
                        header: 'Status',
                        render: (row: any) => {
                            const bgColor = StatusColor[row.status as StatusType] ?? '#9CA3AF'
                            const textColor = getTextColor(bgColor);
                            return (
                                <span
                                    className="px-2 py-1 rounded-full text-xs font-semibold"
                                    style={{
                                        backgroundColor: bgColor,
                                        color: textColor
                                    }}
                                >
                                    {row.status}
                                </span>
                            );
                        },
                    },
                    {
                        key: 'agent',
                        header: 'Agent',
                        formatter: ({ row }: any) => <span className="text-white">{row.agent}</span>,
                    },
                    {
                        key: 'ports',
                        header: 'Ports',
                        formatter: ({ row }: any) => (
                            <span className="text-white whitespace-pre-wrap break-words">{row.ports}</span>
                        ),
                    },
                ];

                return (
                    <CustomDataTable
                        columns={columns}
                        data={tableData}
                        getRowKey={(row: any) => row.key}
                    />
                );
            },
        },
        {
            label: 'System Applications',
            render: () => '',
            isSectionHeader: true,
        },
        {
            label: '',
            isFullSection: true,
            render: (node: any) => {
                const agentApplications = data?.systemApplications?.filter(
                    (app: any) =>
                        app.microservices?.some((msvc: any) => msvc.iofogUuid === node.uuid)
                );

                if (!agentApplications || agentApplications.length === 0) {
                    return <div className="text-sm text-gray-400">No applications found for this agent.</div>;
                }

                const localColumns = [
                    {
                        key: 'name',
                        header: 'Application Name',
                        render: (row: any) => {
                            if (!row?.name) return <span className="text-gray-400">No name</span>;
                            return (
                                <NavLink
                                    to={`/Workloads/SystemApplicationList?applicationId=${encodeURIComponent(row.id)}`}
                                    className="text-blue-400 underline cursor-pointer"
                                >
                                    {row.name}
                                </NavLink>
                            );
                        },
                    },
                    {
                        key: 'isActivated',
                        header: 'Status',
                        render: (row: any) => {
                            const statusKey = row.isActivated ? StatusType.ACTIVE : StatusType.INACTIVE;
                            const bgColor = StatusColor[statusKey] ?? '#9CA3AF';
                            const textColor = getTextColor(bgColor);
                            return (
                                <span
                                    className="px-2 py-1 rounded-full text-xs font-semibold"
                                    style={{
                                        backgroundColor: bgColor,
                                        color: textColor
                                    }}
                                >
                                    {row.isActivated ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            );
                        }
                    },
                ];

                return (
                    <CustomDataTable
                        columns={localColumns}
                        data={agentApplications}
                        getRowKey={(row: any) => row.uuid}
                    />
                );
            },
        },
        {
            label: 'System Microservices',
            render: () => '',
            isSectionHeader: true,
        },
        {
            label: '',
            isFullSection: true,
            render: (node: any) => {
                const systemAgentApplications = data?.systemApplications?.find(
                    (app: any) =>
                        app.microservices?.some((msvc: any) => msvc.iofogUuid === node.uuid)
                );
                const microservices = systemAgentApplications?.microservices || [];

                if (!Array.isArray(microservices) || microservices.length === 0) {
                    return <div className="text-sm text-gray-400">No microservices available.</div>;
                }
                const tableData = microservices.map((ms: any, index: number) => ({
                    key: `${ms.uuid}`,
                    name: ms.name || '-',
                    status: ms.status?.status || '-',
                    agent: data.activeAgents?.find((a: any) => a.uuid === ms.iofogUuid)?.name ?? '-',
                    ports: Array.isArray(ms.ports) ? (
                        ms.ports.map((p: any, i: number) => (
                            <div key={i}>
                                {`${p.internal}:${p.external}/${p.protocol}`}
                            </div>
                        ))
                    ) : (
                        '-'
                    )
                }));

                const columns = [
                    {
                        key: 'name',
                        header: 'Name',
                        render: (row: any) => {
                            if (!row?.name) return <span className="text-gray-400">No name</span>;
                            return (
                                <NavLink
                                    to={`/Workloads/SystemMicroservicesList?microserviceId=${encodeURIComponent(row.key)}`}
                                    className="text-blue-400 underline cursor-pointer"
                                >
                                    {row.name}
                                </NavLink>
                            );
                        },
                    },
                    {
                        key: 'status',
                        header: 'Status',
                        render: (row: any) => {
                            const bgColor = StatusColor[row.status as StatusType] ?? '#9CA3AF'
                            const textColor = getTextColor(bgColor);
                            return (
                                <span
                                    className="px-2 py-1 rounded-full text-xs font-semibold"
                                    style={{
                                        backgroundColor: bgColor,
                                        color: textColor
                                    }}
                                >
                                    {row.status}
                                </span>
                            );
                        },
                    },
                    {
                        key: 'agent',
                        header: 'Agent',
                        formatter: ({ row }: any) => <span className="text-white">{row.agent}</span>,
                    },
                    {
                        key: 'ports',
                        header: 'Ports',
                        formatter: ({ row }: any) => (
                            <span className="text-white whitespace-pre-wrap break-words">{row.ports}</span>
                        ),
                    },
                ];

                return (
                    <CustomDataTable
                        columns={columns}
                        data={tableData}
                        getRowKey={(row: any) => row.key}
                    />
                );
            },
        },
    ];

    return (
        <div className=" bg-gray-900 text-white overflow-auto p-4">
            <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">Agent List</h1>
            <CustomDataTable columns={columns} data={Object.values(data?.reducedAgents?.byName || [])} getRowKey={(row: any) => row.uuid} />

            <SlideOver
                open={isOpen}
                onClose={() => setIsOpen(false)}
                title={selectedNode?.name || 'Agent Details'}
                data={selectedNode}
                fields={slideOverFields}
                onRestart={() => setShowResetConfirmModal(true)}
                onDelete={() => setShowDeleteConfirmModal(true)}
                onEditYaml={handleEditYaml}
                customWidth={700}
            />

            <ResizableBottomDrawer
                open={isBottomDrawerOpen}
                isEdit={editorIsChanged}
                onClose={() => { setIsBottomDrawerOpen(false); setEditorIsChanged(false); setEditorDataChanged(null) }}
                onSave={() => handleYamlUpdate()}
                title={`${selectedNode?.name} Config`}
                showUnsavedChangesModal
                unsavedModalTitle='Changes Not Saved'
                unsavedModalMessage='Are you sure you want to exit? All unsaved changes will be lost.'
                unsavedModalCancelLabel='Stay'
                unsavedModalConfirmLabel='Exit Anyway'

            >
                <AceEditor
                    setOptions={{ useWorker: false, tabSize: 2  }}
                    mode="yaml"
                    theme="monokai"
                    defaultValue={yamlDump}
                    showPrintMargin={false}
                    onLoad={function (editor) {
                        editor.renderer.setPadding(10);
                        editor.renderer.setScrollMargin(10);
                    }}
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "4px",
                    }}
                    onChange={function editorChanged(editor: any) {
                        setEditorIsChanged(true)
                        setEditorDataChanged(editor)
                    }}
                />
            </ResizableBottomDrawer>
            <UnsavedChangesModal
                open={showResetConfirmModal}
                onCancel={() => setShowResetConfirmModal(false)}
                onConfirm={handleRestart}
                title={`Restart ${selectedNode?.name}`}
                message={"This is not reversible."}
                cancelLabel={"Cancel"}
                confirmLabel={"Restart"}
                confirmColor='bg-blue'
            />
            <UnsavedChangesModal
                open={showDeleteConfirmModal}
                onCancel={() => setShowDeleteConfirmModal(false)}
                onConfirm={handleDelete}
                title={`Delete ${selectedNode?.name}`}
                message={"This is not reversible."}
                cancelLabel={"Cancel"}
                confirmLabel={"Delete"}
            />

        </div>
    );
}

export default NodesList;

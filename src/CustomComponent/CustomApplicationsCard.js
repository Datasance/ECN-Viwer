import React, { useEffect, useState } from 'react';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

const statusColorMap = {
    RUNNING: 'bg-green-500',
    STOPPED: 'bg-red-500',
    OTHER: 'bg-yellow-500',
};

const CustomApplicationsCard = ({ applications = [], cardTitle = 'Applications Overview' }) => {
    const [structuredApplications, setStructuredApplications] = useState([]);

    useEffect(() => {
        const structured = applications.map(app => ({
            appName: app.name,
            microservices: (app.microservices || []).map(ms => ({
                name: ms.name,
                status: ms.status.status,
            })),
        }));


        setStructuredApplications(structured);
    }, [applications]);

    if (!applications.length) {
        return (
            <div className="bg-gray-800 rounded-2xl p-6 shadow-md w-full h-full flex flex-col justify-center items-center">
                <div className="text-gray-400 text-lg">No Applications Available</div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 shadow-md w-full h-full flex flex-col">
            {/* Title */}
            <div className="flex items-center mb-4">
                <div className="text-xl font-bold text-white mr-2">{structuredApplications.length}</div>
                <div className="text-xl font-bold text-white">{cardTitle}</div>
            </div>

            {/* Applications List */}
            <div className="flex-1 overflow-y-auto pr-2">
                <div className="flex flex-col space-y-4">
                    {structuredApplications.map((app, idx) => (
                        <div key={idx} className="bg-gray-700 rounded-lg p-4 shadow">
                            <div className="text-white font-semibold mb-2">{app.appName}</div>
                            <div className="grid grid-cols-1 gap-2">
                                {app.microservices.map((ms, msIdx) => {
                                    const statusColor = statusColorMap[ms.status] || statusColorMap.OTHER;
                                    return (
                                        <div key={msIdx} className="flex items-center justify-between text-gray-300 text-sm">
                                            <span>{ms.name}</span>
                                            <span className={`w-3 h-3 rounded-full ${statusColor}`}></span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-end mt-4 cursor-pointer group">
                <span className="text-sm text-gray-400 group-hover:text-gray-200 mr-1">Continue to Details</span>
                <ChevronRightIcon style={{ fontSize: 18 }} className="text-gray-400 group-hover:text-gray-200" />
            </div>
        </div>
    );
};

export default CustomApplicationsCard;

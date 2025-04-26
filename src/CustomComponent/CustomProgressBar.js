import React from 'react';

const CustomProgressBar = ({ value, max = 100, unit }) => {
    const percent = Math.min((value / max) * 100, 100);

    return (
        <div className="flex text-center align-center justify-center">
            <div className="text-xs text-gray-400 h-2.5 mr-1">
                {unit === '%' ? `${percent.toFixed(1)}%` : `${value}${unit}`}
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2.5 overflow-hidden">
                {
                    percent > 90 ? (
                        <div
                            className="bg-red-400 h-2.5"
                            style={{ width: `${percent.toFixed(1)}%` }}
                        />
                    ) : percent > 70 ? (
                        <div
                            className="bg-yellow-400 h-2.5"
                            style={{ width: `${percent.toFixed(1)}%` }}
                        />
                    ) : (
                        <div
                            className="bg-green-400 h-2.5"
                            style={{ width: `${percent.toFixed(1)}%` }}
                        />
                    )
                }
            </div>
        </div>
    );
};

export default CustomProgressBar;

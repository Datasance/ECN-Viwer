import React from 'react'

const CustomStatusBadge = ({ status }) => {
    const color = status === 'RUNNING' ? 'bg-green-400' : status === 'ERROR' ? 'bg-red-400' : 'bg-yellow-400';
    return <span className={`${color} inline-block w-2 h-2 rounded-full mr-2`} />;
}

export default CustomStatusBadge
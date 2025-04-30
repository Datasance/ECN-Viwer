import React, { useState } from 'react';

export default function CustomDataTable({
  columns,
  data,
  expandableRowRender,
  getRowKey,
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (key) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedRows(newSet);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-gray-300">
        <thead className="bg-gray-700 text-xs uppercase">
          <tr>
            {columns.map(col => (
              <th key={col.key} className={`px-4 py-2 text-center ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
            {expandableRowRender && <th className="px-4 py-2 text-center"></th>}
          </tr>
        </thead>
        <tbody>
          {data.map(row => {
            const rowKey = getRowKey(row);
            const isExpanded = expandedRows.has(rowKey);
            return (
              <React.Fragment key={rowKey}>
                <tr
                  className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer"
                  onClick={expandableRowRender ? () => toggleRow(rowKey) : undefined}
                >
                  {columns.map(col => (
                    <td key={col.key} className={`px-4 py-2 text-center ${col.className || ''}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {expandableRowRender && (
                    <td className="px-4 py-2 text-center">
                      {isExpanded ? (
                        <span className="text-gray-300">▴</span>
                      ) : (
                        <span className="text-gray-300">▾</span>
                      )}
                    </td>
                  )}
                </tr>

                {expandableRowRender && isExpanded && (
                  <tr>
                    <td colSpan={columns.length + 1} className="bg-gray-700 p-4">
                      {expandableRowRender(row)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

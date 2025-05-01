import React, { useState } from 'react';

export default function CustomDataTable({
  columns,
  data,
  expandableRowRender,
  getRowKey,
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [filterText, setFilterText] = useState('');

  const toggleRow = (key) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedRows(newSet);
  };

  const filteredData = data.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(filterText.toLowerCase())
    )
  );

  return (
    <div className="w-full">
      <div className="flex justify-end mb-2">
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Search"
          className="px-3 py-2 border border-gray-600 bg-gray-800 text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

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
            {filteredData.map(row => {
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
    </div>
  );
}

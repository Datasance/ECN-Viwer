import React, { useState } from 'react';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDownOutlined';
import KeyboardArrowUpOutlined from '@material-ui/icons/KeyboardArrowUpOutlined';

type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
};

type CustomDataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  expandableRowRender?: (row: T) => React.ReactNode;
  getRowKey: (row: T) => string | number;
};

export default function CustomDataTable<T>({
  columns,
  data,
  expandableRowRender,
  getRowKey,
}: CustomDataTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
  const [filterText, setFilterText] = useState('');

  const toggleRow = (key: string | number) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedRows(newSet);
  };

  const filteredData = data?.filter(row =>
    columns.some(col => {
      const value = (row as any)[col.key];
      return value !== undefined && value !== null && String(value).toLowerCase().includes(filterText.toLowerCase());
    })
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
                <th key={col.key} className={`px-4 py-2 text-start ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
              {expandableRowRender && <th className="px-4 py-2 text-start">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map(row => {
                const rowKey = getRowKey(row);
                const isExpanded = expandedRows.has(rowKey);

                return (
                  <React.Fragment key={String(rowKey)}>
                    <tr className="border-b border-gray-700 hover:bg-gray-700/50">
                      {columns.map(col => (
                        <td key={col.key} className={`px-4 py-2 text-start ${col.className || ''}`}>
                          {col.render ? col.render(row) : (row as any)[col.key]}
                        </td>
                      ))}
                      {expandableRowRender && (
                        <td className="px-4 py-2 text-start cursor-pointer" onClick={() => toggleRow(rowKey)}>
                          {isExpanded ? (
                            <span className="text-gray-300"><KeyboardArrowUpOutlined fontSize="default" /></span>
                          ) : (
                            <span className="text-gray-300"><KeyboardArrowDown fontSize="default" /></span>
                          )}
                        </td>
                      )}
                    </tr>

                    {expandableRowRender && isExpanded && (
                      <tr>
                        <td
                          colSpan={columns.length + 1}
                          className="bg-gray-700 p-4"
                        >
                          {expandableRowRender(row)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (expandableRowRender ? 1 : 0)}
                  className="text-center py-6 text-white-400 text-2xl"
                >
                  No records found
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}

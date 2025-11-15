import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: any) => any;
}

interface TableProps {
  columns: Column[];
  data: any[];
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
}

export const Table: React.FC<TableProps> = ({ columns, data, onEdit, onDelete }) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  let filteredData = data.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (sortKey) {
    filteredData.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {col.sortable && sortKey === col.key && (
                        sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </div>
                  </th>
                ))}
                {(onEdit || onDelete) && <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-sm text-gray-800">
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                {(onEdit || onDelete) && (
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="px-4 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg font-semibold text-sm transition-all duration-200 border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="px-4 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg font-semibold text-sm transition-all duration-200 border border-red-200 hover:border-red-300 shadow-sm hover:shadow-md"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import DatabaseDetailsModal from './DatabaseDetailsModal';
import { DATABASE_TYPES } from './DatabaseTypeSelector';

const DatabaseTable = ({ databases, onAction }) => {
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDatabaseClick = (database) => {
    setSelectedDatabase(database);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDatabase(null);
  };

  const handleAction = (database, action) => {
    console.log(`Action: ${action} on database:`, database.name);
    // TODO: Implement API calls
    if (onAction) {
      onAction(database, action);
    }
  };

  const getTypeInfo = (type) => {
    return DATABASE_TYPES.find(t => t.id === type) || DATABASE_TYPES[0];
  };

  if (databases.length === 0) {
    return (
      <div className="py-24 text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-white/[0.04] rounded-xl flex items-center justify-center">
          <svg
            className="h-6 w-6 text-primary-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-white mb-1">
          No databases configured
        </h3>
        <p className="text-sm text-primary-gray-600">
          Get started by creating your first database instance
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-[#111113]/95 backdrop-blur-sm">
            <tr className="border-b border-white/[0.06]">
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-primary-gray-500 uppercase tracking-wider">
                Database Name
              </th>
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-primary-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-primary-gray-500 uppercase tracking-wider">
                Container ID
              </th>
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-primary-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-primary-gray-500 uppercase tracking-wider">
                Port
              </th>
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-primary-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {databases.map((database, index) => {
              const typeInfo = getTypeInfo(database.type);
              return (
                <tr
                  key={database.id}
                  className={`group border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${
                    index === databases.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  {/* Name - Clickable */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDatabaseClick(database)}
                      className="text-left"
                    >
                      <div className="text-sm font-medium text-white group-hover:text-white/80 transition-colors">
                        {database.name}
                      </div>
                      <div className="text-xs text-primary-gray-600 mt-0.5">
                        Click to view
                      </div>
                    </button>
                  </td>

                  {/* Type */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg ${typeInfo.bgColor} flex items-center justify-center p-1.5`}>
                        <img
                          src={typeInfo.logo}
                          alt={typeInfo.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-sm text-primary-gray-400">{typeInfo.name}</span>
                    </div>
                  </td>

                  {/* Container ID */}
                  <td className="px-6 py-4">
                    {database.containerId ? (
                      <span className="text-xs font-mono text-primary-gray-500">
                        {database.containerId}
                      </span>
                    ) : (
                      <span className="text-xs text-primary-gray-700">
                        —
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge status={database.status} />
                  </td>

                  {/* Port */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-primary-gray-500">
                      {database.port || '—'}
                    </span>
                  </td>

                  {/* Created */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-primary-gray-500">
                      {new Date(database.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      <DatabaseDetailsModal
        database={selectedDatabase}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAction={handleAction}
      />
    </>
  );
};

export default DatabaseTable;

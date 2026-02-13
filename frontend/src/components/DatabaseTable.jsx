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
    if (onAction) onAction(database, action);
  };

  const getTypeInfo = (type) => DATABASE_TYPES.find(t => t.id === type) || DATABASE_TYPES[0];

  if (databases.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl island-inset flex items-center justify-center">
          <svg className="h-6 w-6 text-primary-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-sm font-medium text-white mb-1">No databases yet</h3>
          <p className="text-xs text-primary-gray-600">Create your first database instance to get started</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="px-6 py-3.5 text-left text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
                Name
              </th>
              <th className="px-6 py-3.5 text-left text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
                Engine
              </th>
              <th className="px-6 py-3.5 text-left text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
                Container
              </th>
              <th className="px-6 py-3.5 text-left text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
                Status
              </th>
              <th className="px-6 py-3.5 text-left text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
                Port
              </th>
              <th className="px-6 py-3.5 text-left text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
                Created
              </th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {databases.map((database, index) => {
              const typeInfo = getTypeInfo(database.type);
              return (
                <tr
                  key={database.id}
                  className={`island-row ${index === databases.length - 1 ? 'border-b-0' : ''}`}
                >
                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white leading-none">
                      {database.name}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${typeInfo.bgColor} flex items-center justify-center p-1.5 flex-shrink-0`}>
                        <img src={typeInfo.logo} alt={typeInfo.name} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-sm text-primary-gray-400">{typeInfo.name}</span>
                    </div>
                  </td>

                  {/* Container ID */}
                  <td className="px-6 py-4">
                    {database.containerId ? (
                      <span className="text-[11px] font-mono text-primary-gray-600 bg-white/[0.03] border border-white/[0.05] px-2 py-1 rounded-md">
                        {database.containerId.slice(0, 12)}
                      </span>
                    ) : (
                      <span className="text-primary-gray-700 text-sm">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge status={database.status} />
                  </td>

                  {/* Port */}
                  <td className="px-6 py-4">
                    {database.port ? (
                      <span className="text-sm font-mono text-primary-gray-400">:{database.port}</span>
                    ) : (
                      <span className="text-primary-gray-700 text-sm">—</span>
                    )}
                  </td>

                  {/* Created */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-primary-gray-600">
                      {new Date(database.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </td>

                  {/* Details */}
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleDatabaseClick(database)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-primary-gray-600 hover:text-white hover:bg-white/[0.06] transition-colors"
                      title="View details"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.58-3.007-9.964-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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

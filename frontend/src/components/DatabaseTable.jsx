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
                    <button onClick={() => handleDatabaseClick(database)} className="text-left group/name">
                      <div className="text-sm font-medium text-white group-hover/name:text-white/70 transition-colors leading-none mb-1">
                        {database.name}
                      </div>
                      <div className="text-[11px] text-primary-gray-700 flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        View details
                      </div>
                    </button>
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

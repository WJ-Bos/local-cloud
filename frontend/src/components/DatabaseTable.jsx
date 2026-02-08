import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import DatabaseDetailsModal from './DatabaseDetailsModal';

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

  if (databases.length === 0) {
    return (
      <div className="bg-primary-gray-900 border border-primary-gray-800 rounded-lg p-12 text-center">
        <svg
          className="mx-auto h-16 w-16 text-primary-gray-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
        <h3 className="text-lg font-semibold text-white mb-2">
          No databases
        </h3>
        <p className="text-primary-gray-400 mb-6">
          You haven't created any databases yet. Get started by creating your first PostgreSQL database.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-primary-gray-900 border border-primary-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-gray-850 border-b border-primary-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray-400 uppercase tracking-wider">
                  Container ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray-400 uppercase tracking-wider">
                  Engine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray-400 uppercase tracking-wider">
                  Port
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray-400 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-gray-800">
              {databases.map((database) => (
                <tr
                  key={database.id}
                  className="hover:bg-primary-gray-850 transition-colors"
                >
                  {/* Name - Clickable */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDatabaseClick(database)}
                      className="text-left hover:text-primary-orange transition-colors"
                    >
                      <div className="font-medium text-white hover:underline">
                        {database.name}
                      </div>
                      <div className="text-xs text-primary-gray-500 mt-0.5">
                        Click for details
                      </div>
                    </button>
                  </td>

                  {/* Container ID */}
                  <td className="px-6 py-4">
                    {database.containerId ? (
                      <span className="text-sm font-mono text-primary-gray-300">
                        {database.containerId}
                      </span>
                    ) : (
                      <span className="text-sm text-primary-gray-600 italic">
                        Provisioning...
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge status={database.status} />
                  </td>

                  {/* Engine */}
                  <td className="px-6 py-4 text-primary-gray-300 text-sm">
                    PostgreSQL 15
                  </td>

                  {/* Port */}
                  <td className="px-6 py-4 text-primary-gray-300 text-sm font-mono">
                    {database.port || '-'}
                  </td>

                  {/* Created */}
                  <td className="px-6 py-4 text-primary-gray-300 text-sm">
                    {new Date(database.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

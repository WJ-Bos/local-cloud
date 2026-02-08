import React, { useState } from 'react';
import StatusBadge from './StatusBadge';

const DatabaseTableRow = ({ database }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${database.name}"?`)) {
      console.log('Deleting database:', database.id);
      // TODO: Implement API call
    }
  };

  return (
    <>
      {/* Main Row */}
      <tr className="border-b border-primary-gray-800 hover:bg-primary-gray-850 transition-colors">
        <td className="px-6 py-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary-gray-400 hover:text-white transition-colors"
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </td>
        <td className="px-6 py-4">
          <div className="font-medium text-white">{database.name}</div>
          <div className="text-xs text-primary-gray-500 font-mono mt-1">
            {database.containerId ? (
              <span title="Docker Container ID">{database.containerId}</span>
            ) : (
              <span className="text-primary-gray-600 italic">Provisioning...</span>
            )}
          </div>
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={database.status} />
        </td>
        <td className="px-6 py-4 text-primary-gray-300">
          PostgreSQL 15
        </td>
        <td className="px-6 py-4 text-primary-gray-300">
          {database.port || '-'}
        </td>
        <td className="px-6 py-4 text-primary-gray-300 text-sm">
          {new Date(database.createdAt).toLocaleString()}
        </td>
        <td className="px-6 py-4 text-right">
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-400 font-medium text-sm transition-colors"
          >
            Delete
          </button>
        </td>
      </tr>

      {/* Expanded Details Row */}
      {isExpanded && (
        <tr className="bg-primary-gray-900 border-b border-primary-gray-800">
          <td colSpan="7" className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Connection Details */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Connection Details
                </h4>
                <div className="space-y-3">
                  <div className="bg-primary-gray-850 rounded p-3 border border-primary-gray-700">
                    <div className="text-xs text-primary-gray-400 mb-1">Connection String</div>
                    <div className="text-sm font-mono text-primary-gray-200 break-all">
                      {database.connectionString || 'Not available yet'}
                    </div>
                    {database.connectionString && (
                      <button className="mt-2 text-xs text-primary-orange hover:text-primary-orange-dark transition-colors">
                        Copy to clipboard
                      </button>
                    )}
                  </div>
                  <div className="bg-primary-gray-850 rounded p-3 border border-primary-gray-700">
                    <div className="text-xs text-primary-gray-400 mb-1">Host</div>
                    <div className="text-sm font-mono text-primary-gray-200">localhost:{database.port || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Resource Information */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Resource Information
                </h4>
                <div className="space-y-3">
                  {/* Container ID - Prominent */}
                  {database.containerId && (
                    <div className="bg-primary-gray-850 rounded p-3 border border-primary-gray-700">
                      <div className="text-xs text-primary-gray-400 mb-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                        Docker Container ID
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-mono text-primary-orange">{database.containerId}</div>
                        <button
                          onClick={() => navigator.clipboard.writeText(database.containerId)}
                          className="text-xs text-primary-gray-400 hover:text-primary-orange transition-colors"
                          title="Copy Container ID"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Other Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-primary-gray-400">Engine:</span>
                      <span className="text-primary-gray-200">PostgreSQL 15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary-gray-400">Status:</span>
                      <span className="text-primary-gray-200">{database.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary-gray-400">Created:</span>
                      <span className="text-primary-gray-200">{new Date(database.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary-gray-400">Storage:</span>
                      <span className="text-primary-gray-200">Docker Volume</span>
                    </div>
                  </div>

                  {/* Docker Commands */}
                  {database.containerId && (
                    <div className="bg-primary-gray-900 rounded p-3 border border-primary-gray-700">
                      <div className="text-xs text-primary-gray-400 mb-2 font-semibold">Quick Commands:</div>
                      <div className="space-y-1 text-xs font-mono">
                        <div className="text-primary-gray-300">
                          <span className="text-primary-gray-500">$</span> docker logs {database.containerId}
                        </div>
                        <div className="text-primary-gray-300">
                          <span className="text-primary-gray-500">$</span> docker inspect {database.containerId}
                        </div>
                        <div className="text-primary-gray-300">
                          <span className="text-primary-gray-500">$</span> docker exec -it {database.containerId} psql
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-primary-gray-800 flex gap-3">
              <button className="px-4 py-2 bg-primary-gray-800 hover:bg-primary-gray-700 text-white rounded text-sm transition-colors border border-primary-gray-700">
                View Logs
              </button>
              <button className="px-4 py-2 bg-primary-gray-800 hover:bg-primary-gray-700 text-white rounded text-sm transition-colors border border-primary-gray-700">
                Connect
              </button>
              <button className="px-4 py-2 bg-primary-gray-800 hover:bg-primary-gray-700 text-white rounded text-sm transition-colors border border-primary-gray-700">
                Modify
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const DatabaseTable = ({ databases }) => {
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
        <button className="px-6 py-2.5 bg-gradient-to-r from-primary-orange to-primary-orange-dark hover:from-primary-orange-dark hover:to-primary-orange text-white font-semibold rounded-md transition-all">
          Create Database
        </button>
      </div>
    );
  }

  return (
    <div className="bg-primary-gray-900 border border-primary-gray-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary-gray-850 border-b border-primary-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray-400 uppercase tracking-wider w-12"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray-400 uppercase tracking-wider">Engine</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray-400 uppercase tracking-wider">Port</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray-400 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-primary-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {databases.map((database) => (
              <DatabaseTableRow key={database.id} database={database} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DatabaseTable;

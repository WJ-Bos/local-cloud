import React, { useState } from 'react';

const DatabaseForm = ({ onClose }) => {
  const [databaseName, setDatabaseName] = useState('');
  const [port, setPort] = useState('');
  const [useAutoPort, setUseAutoPort] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate port if not auto-assigning
    if (!useAutoPort && port) {
      const portNum = parseInt(port);
      if (portNum < 5433 || portNum > 65535) {
        setError('Port must be between 5433 and 65535 (5432 is reserved for platform database)');
        setIsSubmitting(false);
        return;
      }
    }

    const payload = {
      name: databaseName,
      ...((!useAutoPort && port) && { port: parseInt(port) })
    };

    // TODO: Implement API call
    console.log('Creating database:', payload);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setDatabaseName('');
      setPort('');
      setUseAutoPort(true);
      onClose();
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-md p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="databaseName"
          className="block text-sm font-medium text-primary-gray-300 mb-2"
        >
          Database Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="databaseName"
          value={databaseName}
          onChange={(e) => setDatabaseName(e.target.value)}
          placeholder="my-postgres-db"
          pattern="^[a-z0-9-]+$"
          className="w-full px-4 py-2.5 bg-primary-gray-900 text-white border border-primary-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent placeholder-primary-gray-500"
          required
        />
        <p className="mt-2 text-xs text-primary-gray-400">
          Enter a unique name for your PostgreSQL database (lowercase, alphanumeric, hyphens allowed)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-primary-gray-300 mb-2">
          Port Configuration
        </label>

        <div className="space-y-3">
          {/* Auto-assign option */}
          <label className="flex items-center space-x-3 cursor-pointer group">
            <input
              type="radio"
              checked={useAutoPort}
              onChange={() => setUseAutoPort(true)}
              className="w-4 h-4 text-primary-orange focus:ring-2 focus:ring-primary-orange"
            />
            <div className="flex-1">
              <div className="text-sm text-white group-hover:text-primary-orange transition-colors">
                Auto-assign port
              </div>
              <div className="text-xs text-primary-gray-400">
                System will automatically assign the next available port (recommended)
              </div>
            </div>
          </label>

          {/* Custom port option */}
          <label className="flex items-start space-x-3 cursor-pointer group">
            <input
              type="radio"
              checked={!useAutoPort}
              onChange={() => setUseAutoPort(false)}
              className="w-4 h-4 mt-1 text-primary-orange focus:ring-2 focus:ring-primary-orange"
            />
            <div className="flex-1">
              <div className="text-sm text-white group-hover:text-primary-orange transition-colors mb-2">
                Specify custom port
              </div>
              {!useAutoPort && (
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="e.g., 5433"
                  min="5433"
                  max="65535"
                  className="w-full px-3 py-2 bg-primary-gray-900 text-white border border-primary-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent placeholder-primary-gray-500 text-sm"
                />
              )}
              <div className="text-xs text-primary-gray-400 mt-1">
                Port range: 5433-65535 (5432 is reserved for platform database)
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-primary-gray-900 border border-primary-gray-700 rounded-md p-4">
        <h4 className="text-sm font-semibold text-white mb-2">Database Configuration</h4>
        <div className="space-y-2 text-sm text-primary-gray-400">
          <div className="flex justify-between">
            <span>Engine:</span>
            <span className="text-white">PostgreSQL 15</span>
          </div>
          <div className="flex justify-between">
            <span>Port:</span>
            <span className="text-white">
              {useAutoPort ? 'Auto-assigned' : (port || 'Not specified')}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Storage:</span>
            <span className="text-white">Docker Volume</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2.5 bg-primary-gray-800 hover:bg-primary-gray-700 text-white rounded-md transition-colors border border-primary-gray-700"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-orange to-primary-orange-dark hover:from-primary-orange-dark hover:to-primary-orange text-white font-semibold rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Create Database'}
        </button>
      </div>
    </form>
  );
};

export default DatabaseForm;

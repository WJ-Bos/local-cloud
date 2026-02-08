import React, { useState } from 'react';
import DatabaseTypeSelector, { DATABASE_TYPES } from './DatabaseTypeSelector';

const DatabaseForm = ({ onSubmit, onClose }) => {
  const [databaseName, setDatabaseName] = useState('');
  const [databaseType, setDatabaseType] = useState('POSTGRESQL');
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
        setError('Port must be between 5433 and 65535');
        setIsSubmitting(false);
        return;
      }
    }

    const payload = {
      name: databaseName,
      type: databaseType,
      ...((!useAutoPort && port) && { port: parseInt(port) })
    };

    try {
      await onSubmit(payload);
      setDatabaseName('');
      setDatabaseType('POSTGRESQL');
      setPort('');
      setUseAutoPort(true);
    } catch (error) {
      setError(error.message || 'Failed to create database');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTypeInfo = DATABASE_TYPES.find(t => t.id === databaseType);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Database Type Selector */}
      <DatabaseTypeSelector
        selectedType={databaseType}
        onTypeSelect={setDatabaseType}
      />

      {/* Database Name */}
      <div className="space-y-2">
        <label htmlFor="databaseName" className="block text-sm font-medium text-white">
          Database Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="databaseName"
          value={databaseName}
          onChange={(e) => setDatabaseName(e.target.value)}
          placeholder="my-database"
          pattern="^[a-z0-9-]+$"
          className="w-full px-4 py-2.5 bg-[#0A0A0B] text-white border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent placeholder-primary-gray-600 transition-all"
          required
        />
        <p className="text-xs text-primary-gray-600">
          Lowercase letters, numbers, and hyphens only
        </p>
      </div>

      {/* Port Configuration */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white">
          Port Configuration
        </label>

        {/* Auto-assign option */}
        <label className="flex items-start gap-3 p-4 bg-[#0A0A0B] border border-white/[0.08] rounded-lg cursor-pointer hover:border-white/[0.12] transition-colors has-[:checked]:border-white/20 has-[:checked]:bg-white/[0.02]">
          <input
            type="radio"
            checked={useAutoPort}
            onChange={() => setUseAutoPort(true)}
            className="mt-0.5 w-4 h-4 text-white focus:ring-2 focus:ring-white/20"
          />
          <div className="flex-1">
            <div className="text-sm font-medium text-white flex items-center gap-2">
              Auto-assign port
              <span className="text-xs text-primary-gray-600 bg-white/[0.06] px-2 py-0.5 rounded">Recommended</span>
            </div>
            <p className="text-xs text-primary-gray-600 mt-1">
              System will automatically assign the next available port
            </p>
          </div>
        </label>

        {/* Custom port option */}
        <label className="flex items-start gap-3 p-4 bg-[#0A0A0B] border border-white/[0.08] rounded-lg cursor-pointer hover:border-white/[0.12] transition-colors has-[:checked]:border-white/20 has-[:checked]:bg-white/[0.02]">
          <input
            type="radio"
            checked={!useAutoPort}
            onChange={() => setUseAutoPort(false)}
            className="mt-0.5 w-4 h-4 text-white focus:ring-2 focus:ring-white/20"
          />
          <div className="flex-1 space-y-3">
            <div>
              <div className="text-sm font-medium text-white">
                Specify custom port
              </div>
              <p className="text-xs text-primary-gray-600 mt-1">
                Choose a specific port number
              </p>
            </div>
            {!useAutoPort && (
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="e.g., 5433"
                min="5433"
                max="65535"
                className="w-full px-4 py-2.5 bg-[#111113] text-white border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 placeholder-primary-gray-600"
              />
            )}
          </div>
        </label>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-blue-300 flex items-start gap-2">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Port 5432 is reserved. Valid range: 5433-65535</span>
          </p>
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-4">
        <h4 className="text-xs font-medium text-primary-gray-500 uppercase tracking-wider mb-3">
          Configuration Summary
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-primary-gray-600 mb-1">Type</div>
            <div className="text-sm font-medium text-white">{selectedTypeInfo?.name || 'PostgreSQL'}</div>
          </div>
          <div>
            <div className="text-xs text-primary-gray-600 mb-1">Port</div>
            <div className="text-sm font-mono font-medium text-white">
              {useAutoPort ? 'Auto' : (port || '—')}
            </div>
          </div>
          <div>
            <div className="text-xs text-primary-gray-600 mb-1">Storage</div>
            <div className="text-sm font-medium text-white">Volume</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white text-sm font-medium rounded-lg transition-all"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 bg-white hover:bg-white/90 text-black text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating...
            </span>
          ) : (
            'Create Database'
          )}
        </button>
      </div>
    </form>
  );
};

export default DatabaseForm;

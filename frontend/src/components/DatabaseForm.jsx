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
    } catch (err) {
      setError(err.message || 'Failed to create database');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTypeInfo = DATABASE_TYPES.find(t => t.id === databaseType);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-500/[0.08] border border-red-500/20 rounded-xl">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Engine selector */}
      <DatabaseTypeSelector selectedType={databaseType} onTypeSelect={setDatabaseType} />

      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="databaseName" className="block text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
          Database Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="databaseName"
          value={databaseName}
          onChange={(e) => setDatabaseName(e.target.value)}
          placeholder="my-database"
          pattern="^[a-z0-9-]+$"
          className="w-full island-inset rounded-xl px-4 py-2.5 text-sm text-white placeholder-primary-gray-700 focus:outline-none font-mono"
          required
        />
        <p className="text-[11px] text-primary-gray-700">Lowercase letters, numbers, and hyphens only</p>
      </div>

      {/* Port */}
      <div className="space-y-2.5">
        <label className="block text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
          Port
        </label>

        {/* Auto */}
        <label className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-all ${
          useAutoPort
            ? 'border-white/20 bg-white/[0.04]'
            : 'border-white/[0.06] bg-white/[0.01] hover:border-white/[0.1]'
        }`}>
          <input
            type="radio"
            checked={useAutoPort}
            onChange={() => setUseAutoPort(true)}
            className="mt-0.5 w-3.5 h-3.5 accent-white"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">Auto-assign</span>
              <span className="text-[10px] text-primary-gray-600 bg-white/[0.05] border border-white/[0.06] px-2 py-0.5 rounded-md font-medium">
                Recommended
              </span>
            </div>
            <p className="text-xs text-primary-gray-700 mt-0.5">Next available port assigned automatically</p>
          </div>
        </label>

        {/* Custom */}
        <label className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-all ${
          !useAutoPort
            ? 'border-white/20 bg-white/[0.04]'
            : 'border-white/[0.06] bg-white/[0.01] hover:border-white/[0.1]'
        }`}>
          <input
            type="radio"
            checked={!useAutoPort}
            onChange={() => setUseAutoPort(false)}
            className="mt-0.5 w-3.5 h-3.5 accent-white"
          />
          <div className="flex-1 space-y-2.5">
            <div>
              <span className="text-sm font-medium text-white">Custom port</span>
              <p className="text-xs text-primary-gray-700 mt-0.5">Specify a port number manually</p>
            </div>
            {!useAutoPort && (
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="e.g. 5433"
                min="5433"
                max="65535"
                className="w-full island-inset rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-primary-gray-700 focus:outline-none"
              />
            )}
          </div>
        </label>

        {/* Port hint */}
        <div className="flex items-start gap-2 px-3 py-2.5 bg-sky-500/[0.06] border border-sky-500/20 rounded-xl">
          <svg className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-[11px] text-sky-300/80">Port 5432 is reserved by the platform. Valid range: 5433–65535</p>
        </div>
      </div>

      {/* Config summary */}
      <div className="island-inset rounded-xl px-4 py-3.5">
        <p className="text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest mb-3">Summary</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[10px] text-primary-gray-700 mb-1">Engine</div>
            <div className="text-sm font-medium text-white">{selectedTypeInfo?.name || 'PostgreSQL'}</div>
          </div>
          <div>
            <div className="text-[10px] text-primary-gray-700 mb-1">Port</div>
            <div className="text-sm font-mono font-medium text-white">
              {useAutoPort ? 'Auto' : (port || '—')}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-primary-gray-700 mb-1">Storage</div>
            <div className="text-sm font-medium text-white">Volume</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 island-inset border border-white/[0.06] text-white text-sm font-medium rounded-xl hover:bg-white/[0.04] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 bg-white hover:bg-white/90 text-black text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="spin-slow h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Creating…
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

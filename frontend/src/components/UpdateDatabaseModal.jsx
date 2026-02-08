import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const UpdateDatabaseModal = ({ isOpen, onClose, database, onSubmit }) => {
  const [newName, setNewName] = useState('');
  const [port, setPort] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (database) {
      setNewName(database.name);
      setPort(database.port?.toString() || '');
      setError('');
    }
  }, [database, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const portNum = parseInt(port);
    if (portNum < 5433 || portNum > 65535) {
      setError('Port must be between 5433 and 65535');
      setIsSubmitting(false);
      return;
    }

    if (newName === database.name && portNum === database.port) {
      setError('No changes detected');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: database.name,
      newName: newName,
      port: portNum
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to update database');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!database) return null;

  const hasNameChanged = newName !== database.name;
  const hasPortChanged = port && parseInt(port) !== database.port;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Database">
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

        {/* Important Notice */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-orange-300 mb-1">Database Must Be Stopped</h4>
              <p className="text-xs text-orange-200/80">
                Container will be recreated with new settings. Data will be preserved.
              </p>
            </div>
          </div>
        </div>

        {/* Current Configuration */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-4">
          <h4 className="text-xs font-medium text-primary-gray-500 uppercase tracking-wider mb-3">
            Current Configuration
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-primary-gray-600 mb-1">Name</div>
              <div className="text-sm font-mono font-medium text-white">{database.name}</div>
            </div>
            <div>
              <div className="text-xs text-primary-gray-600 mb-1">Port</div>
              <div className="text-sm font-mono font-medium text-white">{database.port}</div>
            </div>
            <div>
              <div className="text-xs text-primary-gray-600 mb-1">Status</div>
              <div className="text-sm font-medium text-orange-400">{database.status}</div>
            </div>
          </div>
        </div>

        {/* New Name Input */}
        <div className="space-y-2">
          <label htmlFor="newName" className="block text-sm font-medium text-white">
            New Database Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="newName"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="my-database"
            pattern="^[a-z0-9-]+$"
            className="w-full px-4 py-2.5 bg-[#0A0A0B] text-white border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 placeholder-primary-gray-600 transition-all"
            required
          />
          <p className="text-xs text-primary-gray-600">
            Lowercase letters, numbers, and hyphens only
          </p>
        </div>

        {/* Port Input */}
        <div className="space-y-2">
          <label htmlFor="port" className="block text-sm font-medium text-white">
            Port <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            id="port"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder="5433"
            min="5433"
            max="65535"
            className="w-full px-4 py-2.5 bg-[#0A0A0B] text-white font-mono border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 placeholder-primary-gray-600 transition-all"
            required
          />
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-xs text-blue-300 flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Valid range: 5433-65535</span>
            </p>
          </div>
        </div>

        {/* Updated Configuration Preview */}
        {(hasNameChanged || hasPortChanged) && (
          <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-4">
            <h4 className="text-xs font-medium text-primary-gray-500 uppercase tracking-wider mb-3">
              New Configuration
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-primary-gray-600 mb-1 flex items-center justify-between">
                  Name
                  {hasNameChanged && (
                    <span className="text-[10px] text-emerald-400 font-medium">CHANGED</span>
                  )}
                </div>
                <div className={`text-sm font-mono font-medium ${hasNameChanged ? 'text-emerald-400' : 'text-white'}`}>
                  {newName}
                </div>
              </div>
              <div>
                <div className="text-xs text-primary-gray-600 mb-1 flex items-center justify-between">
                  Port
                  {hasPortChanged && (
                    <span className="text-[10px] text-emerald-400 font-medium">CHANGED</span>
                  )}
                </div>
                <div className={`text-sm font-mono font-medium ${hasPortChanged ? 'text-emerald-400' : 'text-white'}`}>
                  {port}
                </div>
              </div>
              <div>
                <div className="text-xs text-primary-gray-600 mb-1">Engine</div>
                <div className="text-sm font-medium text-white">PostgreSQL</div>
              </div>
            </div>
          </div>
        )}

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
                Updating...
              </span>
            ) : (
              'Update Database'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UpdateDatabaseModal;

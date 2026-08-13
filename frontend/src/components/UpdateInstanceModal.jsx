import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { INSTANCE_TYPES, getInstanceTypeInfo } from './instanceCatalog';

const UpdateInstanceModal = ({ isOpen, onClose, instance, onSubmit, onStop }) => {
  const [newName, setNewName] = useState('');
  const [sshPort, setSshPort] = useState('');
  const [instanceType, setInstanceType] = useState('T3_MICRO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (instance) {
      setNewName(instance.name);
      setSshPort(instance.sshPort?.toString() || '');
      setInstanceType(instance.instanceType || 'T3_MICRO');
      setError('');
    }
  }, [instance, isOpen]);

  if (!instance) return null;

  const isStopped = instance.status === 'STOPPED';
  const isStoppingNow = instance.status === 'STOPPING';
  const isLocked = !isStopped;

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await onStop();
    } finally {
      setIsStopping(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    setIsSubmitting(true);
    setError('');

    const portNum = parseInt(sshPort);
    if (portNum < 1024 || portNum > 65535 || portNum === 5432) {
      setError('SSH port must be between 1024 and 65535 (5432 is reserved)');
      setIsSubmitting(false);
      return;
    }

    if (newName === instance.name && portNum === instance.sshPort && instanceType === instance.instanceType) {
      setError('No changes detected');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: instance.name,
      newName: newName,
      sshPort: portNum,
      instanceType,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update instance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasNameChanged = newName !== instance.name;
  const hasPortChanged = sshPort && parseInt(sshPort) !== instance.sshPort;
  const hasTypeChanged = instanceType !== instance.instanceType;
  const currentTypeInfo = getInstanceTypeInfo(instance.instanceType);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Instance">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {/* Status banner — only shown when not stopped */}
        {isLocked && (
          <div className={`rounded-lg p-4 flex items-start justify-between gap-4 ${
            isStoppingNow
              ? 'bg-amber-500/10 border border-amber-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <div className="flex items-start gap-3 min-w-0">
              {isStoppingNow ? (
                <svg className="animate-spin w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              )}
              <div>
                <p className={`text-xs font-semibold mb-0.5 ${isStoppingNow ? 'text-amber-300' : 'text-red-300'}`}>
                  {isStoppingNow ? 'Stopping instance…' : 'Instance must be stopped first'}
                </p>
                <p className={`text-xs ${isStoppingNow ? 'text-amber-200/60' : 'text-red-200/60'}`}>
                  {isStoppingNow
                    ? 'Fields will unlock automatically once the instance is stopped.'
                    : 'Stop the instance to edit its configuration.'}
                </p>
              </div>
            </div>
            {!isStoppingNow && (
              <button
                type="button"
                onClick={handleStop}
                disabled={isStopping}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStopping ? (
                  <>
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Stopping…
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                    Stop Instance
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Current config */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
          <h4 className="text-[10px] font-semibold text-primary-gray-600 uppercase tracking-wider mb-3">
            Current Configuration
          </h4>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <div className="text-xs text-primary-gray-600 mb-1">Name</div>
              <div className="text-sm font-mono font-medium text-white">{instance.name}</div>
            </div>
            <div>
              <div className="text-xs text-primary-gray-600 mb-1">SSH Port</div>
              <div className="text-sm font-mono font-medium text-white">{instance.sshPort}</div>
            </div>
            <div>
              <div className="text-xs text-primary-gray-600 mb-1">Type</div>
              <div className="text-sm font-mono font-medium text-white">{currentTypeInfo.name}</div>
            </div>
            <div>
              <div className="text-xs text-primary-gray-600 mb-1">Status</div>
              <div className={`text-xs font-semibold ${isStopped ? 'text-emerald-400' : 'text-amber-400'}`}>
                {instance.status}
              </div>
            </div>
          </div>
        </div>

        {/* Fields — locked overlay when not stopped */}
        <div className={`space-y-4 transition-opacity duration-200 ${isLocked ? 'opacity-35 pointer-events-none select-none' : ''}`}>

          {/* New Name */}
          <div className="space-y-1.5">
            <label htmlFor="newInstanceName" className="block text-[10px] font-semibold text-primary-gray-600 uppercase tracking-wider">
              New Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="newInstanceName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="my-instance"
              pattern="^[a-z0-9-]+$"
              disabled={isLocked}
              className="w-full px-4 py-2.5 bg-[#0A0A0B] text-white border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 placeholder-primary-gray-600 transition-all font-mono text-sm"
              required
            />
            <p className="text-[11px] text-primary-gray-700">Lowercase letters, numbers, and hyphens only</p>
          </div>

          {/* SSH Port */}
          <div className="space-y-1.5">
            <label htmlFor="instanceSshPort" className="block text-[10px] font-semibold text-primary-gray-600 uppercase tracking-wider">
              SSH Port <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              id="instanceSshPort"
              value={sshPort}
              onChange={(e) => setSshPort(e.target.value)}
              placeholder="2222"
              min="1024"
              max="65535"
              disabled={isLocked}
              className="w-full px-4 py-2.5 bg-[#0A0A0B] text-white font-mono border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 placeholder-primary-gray-600 transition-all text-sm"
              required
            />
          </div>

          {/* Instance type */}
          <div className="space-y-1.5">
            <label htmlFor="updateInstanceType" className="block text-[10px] font-semibold text-primary-gray-600 uppercase tracking-wider">
              Instance Type
            </label>
            <div className="relative">
              <select
                id="updateInstanceType"
                value={instanceType}
                onChange={(e) => setInstanceType(e.target.value)}
                disabled={isLocked}
                className="w-full px-4 py-2.5 bg-[#0A0A0B] text-white border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer transition-all text-sm pr-9 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              >
                {INSTANCE_TYPES.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#0f1024] text-white">
                    {t.name} — {t.description}
                  </option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <p className="text-[11px] text-primary-gray-700">
              Changing the type recreates the container with new CPU/memory limits
            </p>
          </div>

          {/* Changed preview */}
          {(hasNameChanged || hasPortChanged || hasTypeChanged) && (
            <div className="bg-emerald-500/[0.05] border border-emerald-500/20 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-emerald-500/60 uppercase tracking-wider mb-2">Changes</p>
              <div className="flex gap-4">
                {hasNameChanged && (
                  <div>
                    <div className="text-[10px] text-primary-gray-600 mb-0.5">Name</div>
                    <div className="text-xs font-mono text-emerald-400">{newName}</div>
                  </div>
                )}
                {hasPortChanged && (
                  <div>
                    <div className="text-[10px] text-primary-gray-600 mb-0.5">SSH Port</div>
                    <div className="text-xs font-mono text-emerald-400">{sshPort}</div>
                  </div>
                )}
                {hasTypeChanged && (
                  <div>
                    <div className="text-[10px] text-primary-gray-600 mb-0.5">Type</div>
                    <div className="text-xs font-mono text-emerald-400">{getInstanceTypeInfo(instanceType).name}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLocked || isSubmitting}
            className="flex-1 px-4 py-2.5 bg-white hover:bg-white/90 text-black text-sm font-semibold rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Updating…
              </span>
            ) : (
              'Update Instance'
            )}
          </button>
        </div>

      </form>
    </Modal>
  );
};

export default UpdateInstanceModal;

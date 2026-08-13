import React, { useState } from 'react';
import MachineImageSelector from './MachineImageSelector';
import { MACHINE_IMAGES, INSTANCE_TYPES, getImageInfo, getInstanceTypeInfo } from './instanceCatalog';

const InstanceForm = ({ onSubmit, onClose }) => {
  const [instanceName, setInstanceName] = useState('');
  const [image, setImage] = useState('UBUNTU_22_04');
  const [instanceType, setInstanceType] = useState('T3_MICRO');
  const [sshPort, setSshPort] = useState('');
  const [useAutoPort, setUseAutoPort] = useState(true);
  const [userData, setUserData] = useState('');
  const [showUserData, setShowUserData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!useAutoPort && sshPort) {
      const portNum = parseInt(sshPort);
      if (portNum < 1024 || portNum > 65535 || portNum === 5432) {
        setError('SSH port must be between 1024 and 65535 (5432 is reserved)');
        setIsSubmitting(false);
        return;
      }
    }

    const payload = {
      name: instanceName,
      image,
      instanceType,
      ...(userData.trim() && { userData }),
      ...((!useAutoPort && sshPort) && { sshPort: parseInt(sshPort) })
    };

    try {
      await onSubmit(payload);
      setInstanceName('');
      setImage('UBUNTU_22_04');
      setInstanceType('T3_MICRO');
      setSshPort('');
      setUseAutoPort(true);
      setUserData('');
      setShowUserData(false);
    } catch (err) {
      setError(err.message || 'Failed to launch instance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedImageInfo = getImageInfo(image);
  const selectedTypeInfo = getInstanceTypeInfo(instanceType);

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

      {/* Machine image selector */}
      <MachineImageSelector selectedImage={image} onImageSelect={setImage} />

      {/* Instance type */}
      <div className="space-y-2">
        <label htmlFor="instanceType" className="block text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
          Instance Type <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <select
            id="instanceType"
            value={instanceType}
            onChange={(e) => setInstanceType(e.target.value)}
            className="w-full island-inset rounded-xl px-4 py-2.5 text-sm font-mono text-white appearance-none cursor-pointer focus:outline-none pr-9"
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
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="instanceName" className="block text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
          Instance Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="instanceName"
          value={instanceName}
          onChange={(e) => setInstanceName(e.target.value)}
          placeholder="my-instance"
          pattern="^[a-z0-9-]+$"
          className="w-full island-inset rounded-xl px-4 py-2.5 text-sm text-white placeholder-primary-gray-700 focus:outline-none font-mono"
          required
        />
        <p className="text-[11px] text-primary-gray-700">Lowercase letters, numbers, and hyphens only</p>
      </div>

      {/* SSH Port */}
      <div className="space-y-2.5">
        <label className="block text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
          SSH Port
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
            <p className="text-xs text-primary-gray-700 mt-0.5">Next available SSH port assigned automatically (2222+)</p>
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
              <p className="text-xs text-primary-gray-700 mt-0.5">Specify an SSH port number manually</p>
            </div>
            {!useAutoPort && (
              <input
                type="number"
                value={sshPort}
                onChange={(e) => setSshPort(e.target.value)}
                placeholder="e.g. 2222"
                min="1024"
                max="65535"
                className="w-full island-inset rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-primary-gray-700 focus:outline-none"
              />
            )}
          </div>
        </label>
      </div>

      {/* User data (advanced) */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowUserData(!showUserData)}
          className="flex items-center gap-2 text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest hover:text-white transition-colors"
        >
          <svg className={`w-3 h-3 transition-transform ${showUserData ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          User Data <span className="normal-case font-normal tracking-normal text-primary-gray-700">(optional startup script)</span>
        </button>
        {showUserData && (
          <>
            <textarea
              value={userData}
              onChange={(e) => setUserData(e.target.value)}
              placeholder={'#!/bin/sh\napt-get install -y curl'}
              rows={4}
              className="w-full island-inset rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-primary-gray-700 focus:outline-none resize-y"
            />
            <p className="text-[11px] text-primary-gray-700">
              Runs once at first boot, before SSH becomes available. Output is written to /var/log/user-data.log
            </p>
          </>
        )}
      </div>

      {/* Config summary */}
      <div className="island-inset rounded-xl px-4 py-3.5">
        <p className="text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest mb-3">Summary</p>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] text-primary-gray-700 mb-1">Image</div>
            <div className="text-sm font-medium text-white">{selectedImageInfo?.name || 'Ubuntu 22.04'}</div>
          </div>
          <div>
            <div className="text-[10px] text-primary-gray-700 mb-1">Type</div>
            <div className="text-sm font-mono font-medium text-white">{selectedTypeInfo?.name}</div>
          </div>
          <div>
            <div className="text-[10px] text-primary-gray-700 mb-1">Specs</div>
            <div className="text-sm font-mono font-medium text-white">
              {selectedTypeInfo ? `${selectedTypeInfo.vcpus} vCPU · ${selectedTypeInfo.memoryMb} MB` : '—'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-primary-gray-700 mb-1">SSH Port</div>
            <div className="text-sm font-mono font-medium text-white">
              {useAutoPort ? 'Auto' : (sshPort || '—')}
            </div>
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
              Launching…
            </span>
          ) : (
            'Launch Instance'
          )}
        </button>
      </div>
    </form>
  );
};

export default InstanceForm;

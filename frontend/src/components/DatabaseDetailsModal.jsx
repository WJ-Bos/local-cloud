import React, { Fragment, useState } from 'react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { XMarkIcon, ChevronDownIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import StatusBadge from './StatusBadge';
import { DATABASE_TYPES } from './DatabaseTypeSelector';
import toast from 'react-hot-toast';

const DatabaseDetailsModal = ({ database, isOpen, onClose, onAction }) => {
  const [showPassword, setShowPassword] = useState(false);

  if (!database) return null;

  const isRunning = database.status === 'RUNNING';
  const isStopped = database.status === 'STOPPED';
  const isProvisioning = database.status === 'PROVISIONING';
  const isDestroying = database.status === 'DESTROYING';
  const isStarting = database.status === 'STARTING';
  const isStopping = database.status === 'STOPPING';
  const isTransitioning = isProvisioning || isDestroying || isStarting || isStopping;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleAction = (action) => {
    if (onAction) {
      onAction(database, action);
    }
    onClose();
  };

  const typeInfo = DATABASE_TYPES.find(t => t.id === database.type) || DATABASE_TYPES[0];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-[#111113] border border-white/[0.08] shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg ${typeInfo.bgColor} flex items-center justify-center p-2`}>
                      <img
                        src={typeInfo.logo}
                        alt={typeInfo.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <Dialog.Title className="text-xl font-semibold text-white">
                        {database.name}
                      </Dialog.Title>
                      <p className="text-sm text-primary-gray-500 mt-0.5">{typeInfo.name}</p>
                    </div>
                    <StatusBadge status={database.status} />
                  </div>
                  <button
                    onClick={onClose}
                    className="text-primary-gray-500 hover:text-white p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-6">
                  {/* Container ID */}
                  {database.containerId && (
                    <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-primary-gray-500 uppercase tracking-wider">Container ID</span>
                        <button
                          onClick={() => handleCopy(database.containerId)}
                          className="px-3 py-1.5 text-xs text-white hover:bg-white/[0.06] rounded-md transition-colors font-medium"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="text-sm font-mono text-white">
                        {database.containerId}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Connection Details */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-medium text-primary-gray-500 uppercase tracking-wider">
                        Connection Details
                      </h3>

                      {/* Port */}
                      <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-4">
                        <div className="text-xs text-primary-gray-600 mb-2">Port</div>
                        <div className="text-base font-mono font-medium text-white">{database.port || 'N/A'}</div>
                      </div>

                      {/* Password */}
                      {database.password && (
                        <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-xs text-primary-gray-600">Password</div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-primary-gray-500 hover:text-white transition-colors p-1"
                                title={showPassword ? 'Hide password' : 'Show password'}
                              >
                                {showPassword ? (
                                  <EyeSlashIcon className="w-4 h-4" />
                                ) : (
                                  <EyeIcon className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleCopy(database.password)}
                                className="px-2 py-1 text-xs text-white hover:bg-white/[0.06] rounded transition-colors font-medium"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                          <div className="text-base font-mono font-medium text-white">
                            {showPassword ? database.password : '••••••••••••••••'}
                          </div>
                        </div>
                      )}

                      {/* Connection String */}
                      {database.connectionString && (
                        <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-xs text-primary-gray-600">Connection String</div>
                            <button
                              onClick={() => handleCopy(database.connectionString)}
                              className="px-2 py-1 text-xs text-white hover:bg-white/[0.06] rounded transition-colors font-medium"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="text-xs font-mono text-white break-all">
                            {database.connectionString}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Resource Information */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-medium text-primary-gray-500 uppercase tracking-wider">
                        Resource Information
                      </h3>

                      <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-primary-gray-600">Database Type</span>
                          <span className="text-sm font-medium text-white">{typeInfo.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-primary-gray-600">Status</span>
                          <span className="text-sm font-medium text-white">{database.status}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-primary-gray-600">Created</span>
                          <span className="text-sm font-medium text-white">
                            {new Date(database.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-primary-gray-600">Storage</span>
                          <span className="text-sm font-medium text-white">Docker Volume</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Docker Commands */}
                  {database.containerId && (
                    <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-4">
                      <h3 className="text-xs font-medium text-primary-gray-500 uppercase tracking-wider mb-4">
                        Docker Commands
                      </h3>
                      <div className="space-y-2">
                        {[
                          { cmd: `docker logs ${database.containerId}`, label: 'View Logs' },
                          { cmd: `docker inspect ${database.containerId}`, label: 'Inspect Container' },
                          { cmd: `docker exec -it ${database.containerId} psql`, label: 'Open PostgreSQL CLI' }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-[#0A0A0B] rounded-lg px-3 py-2.5 group hover:bg-white/[0.02] transition-colors">
                            <div className="flex-1 mr-4">
                              <div className="text-[10px] text-primary-gray-600 mb-1 font-medium uppercase tracking-wider">{item.label}</div>
                              <span className="text-xs font-mono text-primary-gray-400 break-all">
                                <span className="text-primary-gray-600">$ </span>{item.cmd}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopy(item.cmd)}
                              className="px-2 py-1 text-xs text-white hover:bg-white/[0.06] rounded transition-colors font-medium flex-shrink-0"
                            >
                              Copy
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer with Actions */}
                <div className="px-6 py-4 bg-[#0A0A0B] border-t border-white/[0.08] flex gap-3">
                  {/* Actions Dropdown */}
                  <Menu as="div" className="relative flex-1">
                    <Menu.Button className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-white hover:bg-white/90 text-black text-sm font-medium rounded-lg transition-all">
                      Actions
                      <ChevronDownIcon className="w-4 h-4" />
                    </Menu.Button>

                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute bottom-full left-0 mb-2 w-full origin-bottom rounded-lg bg-[#111113] border border-white/[0.08] shadow-xl focus:outline-none overflow-hidden">
                        {isStopped && (
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => handleAction('start')}
                                className={`${
                                  active ? 'bg-white/[0.06]' : ''
                                } group flex w-full items-center px-4 py-2.5 text-sm font-medium text-white transition-colors`}
                              >
                                <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Start Database
                              </button>
                            )}
                          </Menu.Item>
                        )}

                        {isRunning && (
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => handleAction('stop')}
                                className={`${
                                  active ? 'bg-white/[0.06]' : ''
                                } group flex w-full items-center px-4 py-2.5 text-sm font-medium text-white transition-colors`}
                              >
                                <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                </svg>
                                Stop Database
                              </button>
                            )}
                          </Menu.Item>
                        )}

                        {(isRunning || isStopped) && (
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => handleAction('update')}
                                className={`${
                                  active ? 'bg-white/[0.06]' : ''
                                } group flex w-full items-center px-4 py-2.5 text-sm font-medium text-white transition-colors`}
                              >
                                <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Update Database
                              </button>
                            )}
                          </Menu.Item>
                        )}

                        <div className="border-t border-white/[0.08]">
                          <Menu.Item disabled={isDestroying}>
                            {({ active, disabled }) => (
                              <button
                                onClick={() => handleAction('delete')}
                                disabled={disabled}
                                className={`${
                                  active ? 'bg-red-600/10' : ''
                                } ${
                                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                                } group flex w-full items-center px-4 py-2.5 text-sm font-medium text-red-400 transition-colors`}
                              >
                                <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Database
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>

                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white text-sm font-medium rounded-lg transition-all"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DatabaseDetailsModal;

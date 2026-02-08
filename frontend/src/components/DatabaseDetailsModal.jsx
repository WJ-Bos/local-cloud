import React, { Fragment, useState } from 'react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { XMarkIcon, ChevronDownIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import StatusBadge from './StatusBadge';
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
    toast.success('Copied to clipboard', {
      duration: 2000,
      position: 'top-center',
      style: {
        background: '#10B981',
        color: '#fff',
        fontWeight: '500',
        padding: '12px 20px',
        borderRadius: '8px',
      },
      icon: '✓',
    });
  };

  const handleAction = (action) => {
    console.log(`Action: ${action} on database:`, database.name);
    if (onAction) {
      onAction(database, action);
    }
    // Close modal after action
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-primary-gray-850 border border-primary-gray-700 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-primary-gray-700">
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-white">
                      {database.name}
                    </Dialog.Title>
                    <div className="mt-1">
                      <StatusBadge status={database.status} />
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-primary-gray-400 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-6">
                  {/* Container ID */}
                  {database.containerId && (
                    <div className="bg-primary-gray-900 rounded-lg p-4 border border-primary-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary-orange" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                          Docker Container ID
                        </div>
                        <button
                          onClick={() => handleCopy(database.containerId)}
                          className="text-xs text-primary-orange hover:text-primary-orange-dark transition-colors font-medium"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="text-lg font-mono text-primary-orange">
                        {database.containerId}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Connection Details */}
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Connection Details
                      </h3>
                      <div className="space-y-3">
                        <div className="bg-primary-gray-900 rounded p-3 border border-primary-gray-700">
                          <div className="text-xs text-primary-gray-400 mb-1">Port</div>
                          <div className="text-sm font-mono text-white">{database.port || 'N/A'}</div>
                        </div>
                        {database.password && (
                          <div className="bg-primary-gray-900 rounded p-3 border border-primary-gray-700">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs text-primary-gray-400">Password</div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="text-xs text-primary-gray-400 hover:text-white transition-colors"
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
                                  className="text-xs text-primary-orange hover:text-primary-orange-dark transition-colors"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                            <div className="text-sm font-mono text-white">
                              {showPassword ? database.password : '••••••••••••••••'}
                            </div>
                          </div>
                        )}
                        {database.connectionString && (
                          <div className="bg-primary-gray-900 rounded p-3 border border-primary-gray-700">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs text-primary-gray-400">Connection String</div>
                              <button
                                onClick={() => handleCopy(database.connectionString)}
                                className="text-xs text-primary-orange hover:text-primary-orange-dark transition-colors"
                              >
                                Copy
                              </button>
                            </div>
                            <div className="text-sm font-mono text-white break-all">
                              {database.connectionString}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Resource Information */}
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Resource Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-primary-gray-400">Engine:</span>
                          <span className="text-white">PostgreSQL 15</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-primary-gray-400">Status:</span>
                          <span className="text-white">{database.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-primary-gray-400">Created:</span>
                          <span className="text-white">{new Date(database.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-primary-gray-400">Storage:</span>
                          <span className="text-white">Docker Volume</span>
                        </div>
                        {database.terraformStatePath && (
                          <div className="flex justify-between">
                            <span className="text-primary-gray-400">State Path:</span>
                            <span className="text-white font-mono text-xs">{database.terraformStatePath}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Docker Commands */}
                  {database.containerId && (
                    <div className="bg-primary-gray-900 rounded-lg p-4 border border-primary-gray-700">
                      <h3 className="text-sm font-semibold text-white mb-3">Quick Docker Commands</h3>
                      <div className="space-y-2 text-sm font-mono">
                        <div className="flex items-center justify-between bg-primary-gray-850 rounded px-3 py-2">
                          <span className="text-primary-gray-300">
                            <span className="text-primary-gray-500">$ </span>docker logs {database.containerId}
                          </span>
                          <button
                            onClick={() => handleCopy(`docker logs ${database.containerId}`)}
                            className="text-xs text-primary-orange hover:text-primary-orange-dark"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-primary-gray-850 rounded px-3 py-2">
                          <span className="text-primary-gray-300">
                            <span className="text-primary-gray-500">$ </span>docker inspect {database.containerId}
                          </span>
                          <button
                            onClick={() => handleCopy(`docker inspect ${database.containerId}`)}
                            className="text-xs text-primary-orange hover:text-primary-orange-dark"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-primary-gray-850 rounded px-3 py-2">
                          <span className="text-primary-gray-300">
                            <span className="text-primary-gray-500">$ </span>docker exec -it {database.containerId} psql
                          </span>
                          <button
                            onClick={() => handleCopy(`docker exec -it ${database.containerId} psql`)}
                            className="text-xs text-primary-orange hover:text-primary-orange-dark"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-primary-gray-900 border-t border-primary-gray-700 flex gap-3">
                  {/* Actions Dropdown */}
                  <Menu as="div" className="relative flex-1">
                    <Menu.Button className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-orange to-primary-orange-dark hover:from-primary-orange-dark hover:to-primary-orange text-white font-semibold rounded-md transition-all shadow-lg shadow-primary-orange/20">
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
                      <Menu.Items className="absolute bottom-full left-0 mb-2 w-full origin-bottom rounded-lg bg-primary-gray-850 border border-primary-gray-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-primary-gray-700">
                        {/* Start */}
                        {isStopped && (
                          <div className="px-1 py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleAction('start')}
                                  className={`${
                                    active ? 'bg-primary-gray-800 text-white' : 'text-primary-gray-300'
                                  } group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors`}
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Start Database
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        )}

                        {/* Stop */}
                        {isRunning && (
                          <div className="px-1 py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleAction('stop')}
                                  className={`${
                                    active ? 'bg-primary-gray-800 text-white' : 'text-primary-gray-300'
                                  } group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors`}
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                  </svg>
                                  Stop Database
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        )}

                        {/* Delete */}
                        <div className="px-1 py-1">
                          <Menu.Item disabled={isDestroying}>
                            {({ active, disabled }) => (
                              <button
                                onClick={() => handleAction('delete')}
                                disabled={disabled}
                                className={`${
                                  active ? 'bg-red-600 text-white' : 'text-red-500'
                                } ${
                                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                                } group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors`}
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Database
                                {isDestroying && <span className="ml-auto text-xs">(In progress)</span>}
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>

                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 bg-primary-gray-800 hover:bg-primary-gray-700 text-white font-semibold rounded-md transition-colors border border-primary-gray-700"
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

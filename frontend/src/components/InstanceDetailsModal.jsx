import React, { Fragment, useState } from 'react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { XMarkIcon, ChevronDownIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import StatusBadge from './StatusBadge';
import { getImageInfo, getInstanceTypeInfo } from './instanceCatalog';
import toast from 'react-hot-toast';

const InstanceDetailsModal = ({ instance, isOpen, onClose, onAction }) => {
  const [showPassword, setShowPassword] = useState(false);

  if (!instance) return null;

  const isRunning     = instance.status === 'RUNNING';
  const isStopped     = instance.status === 'STOPPED';
  const isTerminating = instance.status === 'TERMINATING';

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleAction = (action) => {
    if (onAction) onAction(instance, action);
    onClose();
  };

  const imageInfo = getImageInfo(instance.image);
  const typeInfo = getInstanceTypeInfo(instance.instanceType);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 translate-y-2 scale-[0.98]" enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 scale-100" leaveTo="opacity-0 translate-y-2 scale-[0.98]"
            >
              <Dialog.Panel className="w-full max-w-4xl island rounded-2xl overflow-hidden">

                {/* ── Header ──────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl ${imageInfo.bgColor} flex items-center justify-center p-2 flex-shrink-0`}>
                      <img src={imageInfo.logo} alt={imageInfo.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-white leading-none mb-1">
                        {instance.name}
                      </Dialog.Title>
                      <p className="text-xs text-primary-gray-600">{imageInfo.name} · {typeInfo.name}</p>
                    </div>
                    <StatusBadge status={instance.status} />
                  </div>

                  <div className="flex items-center gap-2">
                    {isRunning && (
                      <button
                        onClick={() => handleAction('connect')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Connect
                      </button>
                    )}
                    {isRunning && (
                      <button
                        onClick={() => handleAction('terminal')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                        </svg>
                        Console
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-primary-gray-600 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <XMarkIcon className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* ── Body ────────────────────────────────────────── */}
                <div className="px-6 py-5 space-y-5">

                  {/* Container ID */}
                  {instance.containerId && (
                    <div className="island-inset rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">Container ID</span>
                        <button
                          onClick={() => handleCopy(instance.containerId)}
                          className="text-[11px] font-medium text-primary-gray-500 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-white/[0.06]"
                        >
                          Copy
                        </button>
                      </div>
                      <code className="text-xs font-mono text-primary-gray-300">{instance.containerId}</code>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Connection Details */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
                        SSH Access
                      </h3>

                      {/* SSH Port */}
                      <div className="island-inset rounded-xl px-4 py-3">
                        <div className="text-[10px] text-primary-gray-600 uppercase tracking-wider mb-1.5">SSH Port</div>
                        <div className="text-base font-mono font-medium text-white">{instance.sshPort || 'N/A'}</div>
                      </div>

                      {/* Root password */}
                      {instance.password && (
                        <div className="island-inset rounded-xl px-4 py-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="text-[10px] text-primary-gray-600 uppercase tracking-wider">Root Password</div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-primary-gray-600 hover:text-white transition-colors p-0.5"
                              >
                                {showPassword
                                  ? <EyeSlashIcon className="w-3.5 h-3.5" />
                                  : <EyeIcon className="w-3.5 h-3.5" />
                                }
                              </button>
                              <button
                                onClick={() => handleCopy(instance.password)}
                                className="text-[11px] font-medium text-primary-gray-500 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-white/[0.06]"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                          <div className="text-base font-mono font-medium text-white">
                            {showPassword ? instance.password : '••••••••••••'}
                          </div>
                        </div>
                      )}

                      {/* SSH command */}
                      {instance.sshCommand && (
                        <div className="island-inset rounded-xl px-4 py-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="text-[10px] text-primary-gray-600 uppercase tracking-wider">SSH Command</div>
                            <button
                              onClick={() => handleCopy(instance.sshCommand)}
                              className="text-[11px] font-medium text-primary-gray-500 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-white/[0.06]"
                            >
                              Copy
                            </button>
                          </div>
                          <code className="text-[11px] font-mono text-primary-gray-300 break-all leading-relaxed">
                            {instance.sshCommand}
                          </code>
                        </div>
                      )}
                    </div>

                    {/* Resource Info */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
                        Instance Information
                      </h3>
                      <div className="island-inset rounded-xl px-4 py-3 space-y-3">
                        {[
                          { label: 'Image',    value: imageInfo.name },
                          { label: 'Type',     value: typeInfo.name },
                          { label: 'vCPUs',    value: instance.vcpus ?? typeInfo.vcpus },
                          { label: 'Memory',   value: `${instance.memoryMb ?? typeInfo.memoryMb} MB` },
                          { label: 'Status',   value: instance.status },
                          { label: 'Launched', value: new Date(instance.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-xs text-primary-gray-600">{label}</span>
                            <span className="text-xs font-medium text-white">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Docker Commands */}
                  {instance.containerId && (
                    <div>
                      <h3 className="text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest mb-3">
                        Docker Commands
                      </h3>
                      <div className="space-y-1.5">
                        {[
                          { cmd: `docker logs ${instance.containerId.slice(0, 12)}`,    label: 'View Logs' },
                          { cmd: `docker inspect ${instance.containerId.slice(0, 12)}`, label: 'Inspect' },
                          { cmd: `docker exec -it ${instance.containerId.slice(0, 12)} sh`, label: 'Exec Shell' },
                        ].map((item) => (
                          <div key={item.label} className="island-inset rounded-xl px-4 py-3 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                            <div className="min-w-0">
                              <div className="text-[10px] text-primary-gray-600 uppercase tracking-wider mb-1">{item.label}</div>
                              <code className="text-[11px] font-mono text-primary-gray-400">
                                <span className="text-primary-gray-700">$ </span>{item.cmd}
                              </code>
                            </div>
                            <button
                              onClick={() => handleCopy(item.cmd)}
                              className="text-[11px] font-medium text-primary-gray-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/[0.08] flex-shrink-0"
                            >
                              Copy
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Footer ──────────────────────────────────────── */}
                <div className="px-6 py-4 border-t border-white/[0.06] bg-black/20 flex gap-2.5">
                  <Menu as="div" className="relative flex-1">
                    <Menu.Button className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-white hover:bg-white/90 text-black text-sm font-semibold rounded-xl transition-all">
                      Actions
                      <ChevronDownIcon className="w-3.5 h-3.5" />
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
                      <Menu.Items className="absolute bottom-full left-0 mb-2 w-full origin-bottom rounded-xl island-sm border border-white/[0.08] shadow-xl focus:outline-none overflow-hidden">

                        {isStopped && (
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => handleAction('start')}
                                className={`${active ? 'bg-white/[0.06]' : ''} flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-white transition-colors`}
                              >
                                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Start Instance
                              </button>
                            )}
                          </Menu.Item>
                        )}

                        {isRunning && (
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => handleAction('stop')}
                                className={`${active ? 'bg-white/[0.06]' : ''} flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-white transition-colors`}
                              >
                                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                </svg>
                                Stop Instance
                              </button>
                            )}
                          </Menu.Item>
                        )}

                        {(isRunning || isStopped) && (
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => handleAction('update')}
                                className={`${active ? 'bg-white/[0.06]' : ''} flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-white transition-colors`}
                              >
                                <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Update Instance
                              </button>
                            )}
                          </Menu.Item>
                        )}

                        <div className="border-t border-white/[0.06]">
                          <Menu.Item disabled={isTerminating}>
                            {({ active, disabled }) => (
                              <button
                                onClick={() => handleAction('terminate')}
                                disabled={disabled}
                                className={`${active ? 'bg-red-500/10' : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors`}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Terminate Instance
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>

                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 island-inset border border-white/[0.06] text-white text-sm font-medium rounded-xl hover:bg-white/[0.04] transition-colors"
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

export default InstanceDetailsModal;

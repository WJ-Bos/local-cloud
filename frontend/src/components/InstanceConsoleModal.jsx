import { Fragment, useState, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import StatusBadge from './StatusBadge';
import { getImageInfo, getInstanceTypeInfo } from './instanceCatalog';
import instanceService from '../services/instanceService';
import toast from 'react-hot-toast';

// ── Connection command templates ───────────────────────────────────────────────

const getConnectCommands = (instance) => {
  if (!instance) return [];
  const { sshPort, password } = instance;
  return [
    { label: 'SSH',        cmd: `ssh root@localhost -p ${sshPort}` },
    ...(password ? [{ label: 'SSH (sshpass)', cmd: `sshpass -p ${password} ssh root@localhost -p ${sshPort}` }] : []),
    { label: 'SCP upload', cmd: `scp -P ${sshPort} ./file.txt root@localhost:/root/` },
  ];
};

// ── Log line colouring ─────────────────────────────────────────────────────────

const lineClass = (line) => {
  const u = line.toUpperCase();
  if (u.includes('ERROR') || u.includes('FATAL') || u.includes('CRITICAL')) return 'text-red-400';
  if (u.includes('WARN'))  return 'text-amber-400';
  if (u.includes('DEBUG')) return 'text-primary-gray-600';
  return 'text-primary-gray-300';
};

// ── Component ──────────────────────────────────────────────────────────────────

const TABS = ['logs', 'inspect', 'connect'];
const TAB_LABELS = { logs: 'Logs', inspect: 'Inspect', connect: 'Connect' };

const InstanceConsoleModal = ({ instance, isOpen, onClose }) => {
  const [activeTab, setActiveTab]     = useState('logs');
  const [outputLines, setOutputLines] = useState([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [filter, setFilter]           = useState('');
  const [tail, setTail]               = useState('100');
  const outputRef = useRef(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputLines]);

  useEffect(() => {
    if (!isOpen) {
      setOutputLines([]);
      setActiveTab('logs');
      setFilter('');
      setTail('100');
    }
  }, [isOpen]);

  if (!instance) return null;

  const imageInfo   = getImageInfo(instance.image);
  const typeInfo    = getInstanceTypeInfo(instance.instanceType);
  const connectCmds = getConnectCommands(instance);
  const hasOutput   = outputLines.length > 0;

  const fetchLogs = async () => {
    setIsLoading(true);
    setOutputLines([]);
    try {
      const res = await instanceService.getConsoleLogs(instance.id, parseInt(tail) || 100, filter);
      setOutputLines(res.lines.length > 0 ? res.lines : ['(no log lines matched)']);
    } catch (err) {
      setOutputLines([`Error: ${err.response?.data?.message || err.message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInspect = async () => {
    setIsLoading(true);
    setOutputLines([]);
    try {
      const res = await instanceService.getConsoleInspect(instance.id);
      setOutputLines(JSON.stringify(res, null, 2).split('\n'));
    } catch (err) {
      setOutputLines([`Error: ${err.response?.data?.message || err.message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setOutputLines([]);
  };

  const handleRun = () => {
    if (activeTab === 'logs')    fetchLogs();
    if (activeTab === 'inspect') fetchInspect();
  };

  const handleCopyOutput = () => {
    if (!hasOutput) return;
    navigator.clipboard.writeText(outputLines.join('\n'));
    toast.success('Copied to clipboard');
  };

  const handleCopyCmd = (cmd) => {
    navigator.clipboard.writeText(cmd);
    toast.success('Copied to clipboard');
  };

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
              <Dialog.Panel className="w-full max-w-5xl flex flex-col island rounded-2xl overflow-hidden" style={{ height: '80vh' }}>

                {/* ── Header ──────────────────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${imageInfo.bgColor} flex items-center justify-center p-1.5 flex-shrink-0`}>
                      <img src={imageInfo.logo} alt={imageInfo.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <Dialog.Title className="text-sm font-semibold text-white leading-none mb-0.5">
                        {instance.name}
                      </Dialog.Title>
                      <p className="text-[11px] text-primary-gray-600">{imageInfo.name} · {typeInfo.name} — Console</p>
                    </div>
                    <StatusBadge status={instance.status} />
                  </div>
                  <button
                    onClick={onClose}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-primary-gray-600 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* ── Tabs ────────────────────────────────────────── */}
                <div className="flex items-center gap-0.5 px-5 pt-3 border-b border-white/[0.06] flex-shrink-0">
                  {TABS.map(tab => (
                    <button
                      key={tab}
                      onClick={() => handleTabClick(tab)}
                      className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${
                        activeTab === tab
                          ? 'text-white border-white/60 bg-white/[0.04]'
                          : 'text-primary-gray-600 border-transparent hover:text-primary-gray-400 hover:bg-white/[0.02]'
                      }`}
                    >
                      {TAB_LABELS[tab]}
                    </button>
                  ))}
                </div>

                {/* ── Controls (Logs + Inspect only) ──────────────── */}
                {activeTab !== 'connect' && (
                  <div className="flex items-center gap-2.5 px-5 py-3 border-b border-white/[0.05] flex-shrink-0 bg-black/20">
                    {activeTab === 'logs' && (
                      <>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleRun()}
                            placeholder="Filter lines (grep)…"
                            className="w-full island-inset rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-primary-gray-700 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[11px] text-primary-gray-600">Lines</span>
                          <select
                            value={tail}
                            onChange={e => setTail(e.target.value)}
                            className="island-inset rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                          >
                            {['50', '100', '200', '500', '1000'].map(n => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                    {activeTab === 'inspect' && (
                      <p className="text-xs text-primary-gray-600 flex-1">Full Docker inspect output for this container.</p>
                    )}

                    <button
                      onClick={handleRun}
                      disabled={isLoading}
                      className="px-4 py-1.5 bg-white hover:bg-white/90 disabled:opacity-50 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0"
                    >
                      {isLoading ? (
                        <>
                          <svg className="w-3 h-3 spin-slow" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          Running…
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653Z" />
                          </svg>
                          Run
                        </>
                      )}
                    </button>

                    {hasOutput && (
                      <button
                        onClick={handleCopyOutput}
                        className="px-3 py-1.5 island-inset border border-white/[0.06] text-white text-xs font-medium rounded-lg transition-colors hover:bg-white/[0.04] flex-shrink-0"
                      >
                        Copy
                      </button>
                    )}
                    {hasOutput && (
                      <button
                        onClick={() => setOutputLines([])}
                        className="px-3 py-1.5 island-inset border border-white/[0.06] text-primary-gray-500 text-xs font-medium rounded-lg transition-colors hover:bg-white/[0.04] flex-shrink-0"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}

                {/* ── Body ────────────────────────────────────────── */}
                <div className="flex-1 overflow-hidden bg-black/30">

                  {/* Logs / Inspect output */}
                  {activeTab !== 'connect' && (
                    <div ref={outputRef} className="h-full overflow-y-auto custom-scrollbar p-5">
                      {!hasOutput && !isLoading && (
                        <p className="text-xs text-primary-gray-700 font-mono italic">
                          {activeTab === 'logs'
                            ? '$ press Run to fetch instance logs'
                            : '$ press Run to inspect the container'}
                        </p>
                      )}
                      {outputLines.map((line, i) => (
                        <div key={i} className={`text-xs font-mono leading-relaxed ${lineClass(line)}`}>
                          {line || ' '}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Connect tab */}
                  {activeTab === 'connect' && (
                    <div className="h-full overflow-y-auto custom-scrollbar p-5 space-y-5">

                      {/* SSH command */}
                      {instance.sshCommand && (
                        <div>
                          <p className="text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest mb-2">SSH Command</p>
                          <div className="island-inset rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                            <code className="text-xs font-mono text-primary-gray-300 break-all">{instance.sshCommand}</code>
                            <button
                              onClick={() => handleCopyCmd(instance.sshCommand)}
                              className="text-[11px] font-medium text-primary-gray-500 hover:text-white px-2 py-1 rounded hover:bg-white/[0.06] transition-colors flex-shrink-0"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      )}

                      {/* CLI commands */}
                      {connectCmds.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest mb-2">CLI Commands</p>
                          <div className="space-y-1.5">
                            {connectCmds.map(({ label, cmd }) => (
                              <div key={label} className="island-inset rounded-xl px-4 py-3 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                                <div className="min-w-0">
                                  <p className="text-[10px] text-primary-gray-600 uppercase tracking-wider mb-1">{label}</p>
                                  <code className="text-xs font-mono text-primary-gray-300 break-all">
                                    <span className="text-primary-gray-700">$ </span>{cmd}
                                  </code>
                                </div>
                                <button
                                  onClick={() => handleCopyCmd(cmd)}
                                  className="text-[11px] font-medium text-primary-gray-500 hover:text-white px-2 py-1 rounded hover:bg-white/[0.06] transition-colors flex-shrink-0"
                                >
                                  Copy
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Docker commands */}
                      {instance.containerId && (
                        <div>
                          <p className="text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest mb-2">Docker Commands</p>
                          <div className="space-y-1.5">
                            {[
                              { label: 'View Logs',   cmd: `docker logs ${instance.containerId.slice(0, 12)}` },
                              { label: 'Follow Logs', cmd: `docker logs -f ${instance.containerId.slice(0, 12)}` },
                              { label: 'Exec Shell',  cmd: `docker exec -it ${instance.containerId.slice(0, 12)} sh` },
                              { label: 'Inspect',     cmd: `docker inspect ${instance.containerId.slice(0, 12)}` },
                            ].map(({ label, cmd }) => (
                              <div key={label} className="island-inset rounded-xl px-4 py-3 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                                <div className="min-w-0">
                                  <p className="text-[10px] text-primary-gray-600 uppercase tracking-wider mb-1">{label}</p>
                                  <code className="text-xs font-mono text-primary-gray-300 break-all">
                                    <span className="text-primary-gray-700">$ </span>{cmd}
                                  </code>
                                </div>
                                <button
                                  onClick={() => handleCopyCmd(cmd)}
                                  className="text-[11px] font-medium text-primary-gray-500 hover:text-white px-2 py-1 rounded hover:bg-white/[0.06] transition-colors flex-shrink-0"
                                >
                                  Copy
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Footer status bar ────────────────────────────── */}
                {activeTab !== 'connect' && hasOutput && (
                  <div className="flex items-center gap-2.5 px-5 py-2 border-t border-white/[0.05] bg-black/20 flex-shrink-0">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full block" />
                    <span className="text-[11px] font-mono text-primary-gray-600">
                      {outputLines.length} line{outputLines.length !== 1 ? 's' : ''}
                      {filter && ` · filter="${filter}"`}
                    </span>
                  </div>
                )}

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default InstanceConsoleModal;

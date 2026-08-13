import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import InstanceForm from './InstanceForm';
import InstanceTable from './InstanceTable';
import ProvisioningModal from './ProvisioningModal';
import TerminateConfirmationModal from './TerminateConfirmationModal';
import UpdateInstanceModal from './UpdateInstanceModal';
import InstanceConsoleModal from './InstanceConsoleModal';
import InstanceTerminalModal from './InstanceTerminalModal';
import { MACHINE_IMAGES } from './instanceCatalog';
import instanceService from '../services/instanceService';

function InstanceDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProvisioningModalOpen, setIsProvisioningModalOpen] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false);
  const [instanceToTerminate, setInstanceToTerminate] = useState(null);
  const [instanceToUpdate, setInstanceToUpdate] = useState(null);
  const [instanceForTerminal, setInstanceForTerminal] = useState(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [instanceToConnect, setInstanceToConnect] = useState(null);
  const [launchingInstanceName, setLaunchingInstanceName] = useState('');
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstances();
  }, []);

  useEffect(() => {
    const hasActiveOperation = instances.some(
      inst => ['PENDING', 'TERMINATING', 'STARTING', 'STOPPING', 'UPDATING'].includes(inst.status)
    );
    if (!hasActiveOperation) return;

    const pollInterval = setInterval(() => {
      fetchInstances();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [instances]);

  // Keep the update modal's instance in sync with live polling results
  useEffect(() => {
    if (!instanceToUpdate) return;
    const latest = instances.find(inst => inst.id === instanceToUpdate.id);
    if (latest && latest.status !== instanceToUpdate.status) {
      setInstanceToUpdate(latest);
    }
  }, [instances]);

  const fetchInstances = async () => {
    try {
      const data = await instanceService.getAllInstances();
      setInstances(data);
      setLoading(false);

      if (isProvisioningModalOpen) {
        const launchingInstance = data.find(
          inst => inst.name === launchingInstanceName && inst.status !== 'PENDING'
        );
        if (launchingInstance) {
          setIsProvisioningModalOpen(false);
          if (launchingInstance.status === 'RUNNING') {
            toast.success(`Instance "${launchingInstance.name}" is now running!`);
          } else if (launchingInstance.status === 'FAILED') {
            toast.error(`Instance "${launchingInstance.name}" failed to launch`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch instances:', error);
      toast.error('Failed to fetch instances');
      setLoading(false);
    }
  };

  const handleLaunchInstance = async (formData) => {
    try {
      const newInstance = await instanceService.launchInstance(formData);
      setIsModalOpen(false);
      setLaunchingInstanceName(newInstance.name);
      setIsProvisioningModalOpen(true);
      toast.success('Instance launch initiated!');
      fetchInstances();
    } catch (error) {
      console.error('Failed to launch instance:', error);
      toast.error(error.response?.data?.message || 'Failed to launch instance');
    }
  };

  const handleInstanceAction = async (instance, action) => {
    if (action === 'terminate') {
      setInstanceToTerminate(instance);
      setIsTerminateModalOpen(true);
    } else if (action === 'stop') {
      try {
        toast.loading(`Stopping ${instance.name}...`, { id: 'stop-instance' });
        await instanceService.stopInstance(instance.id);
        toast.success(`Instance "${instance.name}" is stopping!`, { id: 'stop-instance' });
        fetchInstances();
      } catch (error) {
        console.error('Failed to stop instance:', error);
        toast.error(error.response?.data?.message || 'Failed to stop instance', { id: 'stop-instance' });
      }
    } else if (action === 'start') {
      try {
        toast.loading(`Starting ${instance.name}...`, { id: 'start-instance' });
        await instanceService.startInstance(instance.id);
        toast.success(`Instance "${instance.name}" is starting!`, { id: 'start-instance' });
        fetchInstances();
      } catch (error) {
        console.error('Failed to start instance:', error);
        toast.error(error.response?.data?.message || 'Failed to start instance', { id: 'start-instance' });
      }
    } else if (action === 'update') {
      setInstanceToUpdate(instance);
      setIsUpdateModalOpen(true);
    } else if (action === 'terminal') {
      setInstanceForTerminal(instance);
      setIsTerminalModalOpen(true);
    } else if (action === 'connect') {
      setInstanceToConnect(instance);
      setIsConnectModalOpen(true);
    }
  };

  const confirmTerminate = async () => {
    if (!instanceToTerminate) return;
    try {
      setIsTerminateModalOpen(false);
      toast.loading(`Terminating ${instanceToTerminate.name}...`, { id: 'terminate' });
      await instanceService.terminateInstance(instanceToTerminate.id);
      toast.success(`Instance "${instanceToTerminate.name}" is being terminated!`, { id: 'terminate' });
      setInstanceToTerminate(null);
      fetchInstances();
    } catch (error) {
      console.error('Failed to terminate instance:', error);
      toast.error(error.response?.data?.message || 'Failed to terminate instance', { id: 'terminate' });
    }
  };

  const handleStopForUpdate = async () => {
    if (!instanceToUpdate) return;
    try {
      await instanceService.stopInstance(instanceToUpdate.id);
      fetchInstances();
    } catch (error) {
      console.error('Failed to stop instance:', error);
      toast.error(error.response?.data?.message || 'Failed to stop instance');
    }
  };

  const handleUpdateInstance = async (updateData) => {
    toast.loading(`Updating ${updateData.name}...`, { id: 'update-instance' });
    try {
      await instanceService.updateInstance(updateData.name, updateData);
      toast.success(`Instance "${updateData.name}" is being updated!`, { id: 'update-instance' });
      setIsUpdateModalOpen(false);
      setInstanceToUpdate(null);
      fetchInstances();
    } catch (error) {
      console.error('Failed to update instance:', error);
      toast.error(error.response?.data?.message || 'Failed to update instance', { id: 'update-instance' });
      throw error;
    }
  };

  const runningCount  = instances.filter(inst => inst.status === 'RUNNING').length;
  const pendingCount  = instances.filter(inst => inst.status === 'PENDING').length;
  const inactiveCount = instances.filter(inst => inst.status === 'STOPPED' || inst.status === 'FAILED').length;

  return (
    <>
      {/* Page header */}
      <div className="flex items-end justify-between mb-7">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight leading-none mb-1.5">
            Instance Management
          </h1>
          <p className="text-sm text-primary-gray-600">
            Launch and manage virtual machine instances running in Docker
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 h-9 bg-white hover:bg-white/90 text-black text-sm font-semibold rounded-xl transition-all shadow-lg shadow-white/[0.08]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Launch Instance
        </button>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">

        {/* Total */}
        <div className="island-sm rounded-2xl p-5">
          <p className="text-[11px] font-semibold text-primary-gray-600 uppercase tracking-widest mb-3">Total</p>
          <p className="text-4xl font-semibold text-white leading-none mb-2">{instances.length}</p>
          <p className="text-xs text-primary-gray-600">instances</p>
        </div>

        {/* Running */}
        <div className="island-sm glow-emerald rounded-2xl p-5">
          <p className="text-[11px] font-semibold text-primary-gray-600 uppercase tracking-widest mb-3">Running</p>
          <div className="flex items-end gap-2 mb-2">
            <p className="text-4xl font-semibold text-emerald-400 leading-none">{runningCount}</p>
            {runningCount > 0 && (
              <span className="w-2 h-2 mb-1 bg-emerald-400 rounded-full running-dot block" />
            )}
          </div>
          <p className="text-xs text-emerald-500/60">healthy</p>
        </div>

        {/* Pending */}
        <div className="island-sm glow-sky rounded-2xl p-5">
          <p className="text-[11px] font-semibold text-primary-gray-600 uppercase tracking-widest mb-3">Pending</p>
          <div className="flex items-end gap-2 mb-2">
            <p className="text-4xl font-semibold text-sky-400 leading-none">{pendingCount}</p>
            {pendingCount > 0 && (
              <span className="w-2 h-2 mb-1 bg-sky-400 rounded-full animate-pulse block" />
            )}
          </div>
          <p className="text-xs text-sky-500/60">launching</p>
        </div>

        {/* Inactive */}
        <div className={`island-sm rounded-2xl p-5 ${inactiveCount > 0 ? 'glow-amber' : ''}`}>
          <p className="text-[11px] font-semibold text-primary-gray-600 uppercase tracking-widest mb-3">Inactive</p>
          <p className={`text-4xl font-semibold leading-none mb-2 ${inactiveCount > 0 ? 'text-amber-400' : 'text-primary-gray-600'}`}>
            {inactiveCount}
          </p>
          <p className="text-xs text-primary-gray-600">
            {instances.filter(inst => inst.status === 'FAILED').length > 0 ? 'needs attention' : 'stopped'}
          </p>
        </div>
      </div>

      {/* Image breakdown — only show if any images exist */}
      {instances.length > 0 && (
        <div className="island-sm rounded-2xl px-5 py-4 mb-5 flex items-center gap-6 flex-wrap">
          <span className="text-[11px] font-semibold text-primary-gray-600 uppercase tracking-widest">Images</span>
          {MACHINE_IMAGES.map(image => {
            const count = instances.filter(inst => inst.image === image.id).length;
            if (count === 0) return null;
            return (
              <div key={image.id} className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-md ${image.bgColor} flex items-center justify-center p-0.5 flex-shrink-0`}>
                  <img src={image.logo} alt={image.name} className="w-full h-full object-contain" />
                </div>
                <span className="text-xs text-primary-gray-400">{image.name}</span>
                <span className="text-xs font-semibold text-white">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Instance table island ───────────────────────────────────── */}
      <div className="island rounded-2xl overflow-hidden">
        <div className="max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <svg className="w-5 h-5 text-primary-gray-600 spin-slow" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span className="text-xs text-primary-gray-600">Loading instances…</span>
            </div>
          ) : (
            <InstanceTable instances={instances} onAction={handleInstanceAction} />
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Launch Instance">
        <InstanceForm onSubmit={handleLaunchInstance} onClose={() => setIsModalOpen(false)} />
      </Modal>

      <ProvisioningModal
        isOpen={isProvisioningModalOpen}
        databaseName={launchingInstanceName}
        title="Launching Instance"
        infoText="Your instance will be available shortly. You'll be able to SSH in once it's running. Installing the SSH server on first boot can take a minute."
        onComplete={() => setIsProvisioningModalOpen(false)}
      />

      <TerminateConfirmationModal
        isOpen={isTerminateModalOpen}
        onClose={() => { setIsTerminateModalOpen(false); setInstanceToTerminate(null); }}
        onConfirm={confirmTerminate}
        instanceName={instanceToTerminate?.name}
      />

      <UpdateInstanceModal
        isOpen={isUpdateModalOpen}
        onClose={() => { setIsUpdateModalOpen(false); setInstanceToUpdate(null); }}
        onStop={handleStopForUpdate}
        instance={instanceToUpdate}
        onSubmit={handleUpdateInstance}
      />

      <InstanceConsoleModal
        isOpen={isTerminalModalOpen}
        onClose={() => { setIsTerminalModalOpen(false); setInstanceForTerminal(null); }}
        instance={instanceForTerminal}
      />

      <InstanceTerminalModal
        isOpen={isConnectModalOpen}
        onClose={() => { setIsConnectModalOpen(false); setInstanceToConnect(null); }}
        instance={instanceToConnect}
      />
    </>
  );
}

export default InstanceDashboard;

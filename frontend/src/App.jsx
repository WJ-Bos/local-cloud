import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Modal from './components/Modal';
import DatabaseForm from './components/DatabaseForm';
import DatabaseTable from './components/DatabaseTable';
import ProvisioningModal from './components/ProvisioningModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import UpdateDatabaseModal from './components/UpdateDatabaseModal';
import DatabaseConsoleModal from './components/DatabaseConsoleModal';
import { DATABASE_TYPES } from './components/DatabaseTypeSelector';
import databaseService from './services/databaseService';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProvisioningModalOpen, setIsProvisioningModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false);
  const [databaseToDelete, setDatabaseToDelete] = useState(null);
  const [databaseToUpdate, setDatabaseToUpdate] = useState(null);
  const [databaseForTerminal, setDatabaseForTerminal] = useState(null);
  const [provisioningDatabaseName, setProvisioningDatabaseName] = useState('');
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatabases();
  }, []);

  useEffect(() => {
    const hasActiveOperation = databases.some(
      db => ['PROVISIONING', 'DESTROYING', 'STARTING', 'STOPPING', 'UPDATING'].includes(db.status)
    );
    if (!hasActiveOperation) return;

    const pollInterval = setInterval(() => {
      fetchDatabases();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [databases]);

  const fetchDatabases = async () => {
    try {
      const data = await databaseService.getAllDatabases();
      setDatabases(data);
      setLoading(false);

      if (isProvisioningModalOpen) {
        const provisioningDb = data.find(
          db => db.name === provisioningDatabaseName && db.status !== 'PROVISIONING'
        );
        if (provisioningDb) {
          setIsProvisioningModalOpen(false);
          if (provisioningDb.status === 'RUNNING') {
            toast.success(`Database "${provisioningDb.name}" is now running!`);
          } else if (provisioningDb.status === 'FAILED') {
            toast.error(`Database "${provisioningDb.name}" failed to provision`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch databases:', error);
      toast.error('Failed to fetch databases');
      setLoading(false);
    }
  };

  const handleCreateDatabase = async (formData) => {
    try {
      const newDb = await databaseService.createDatabase(formData);
      setIsModalOpen(false);
      setProvisioningDatabaseName(newDb.name);
      setIsProvisioningModalOpen(true);
      toast.success('Database creation initiated!');
      fetchDatabases();
    } catch (error) {
      console.error('Failed to create database:', error);
      toast.error(error.response?.data?.message || 'Failed to create database');
    }
  };

  const handleResync = async () => {
    toast.loading('Resyncing databases...', { id: 'resync' });
    await fetchDatabases();
    toast.success('Databases resynced!', { id: 'resync' });
  };

  const handleDatabaseAction = async (database, action) => {
    if (action === 'delete') {
      setDatabaseToDelete(database);
      setIsDeleteModalOpen(true);
    } else if (action === 'stop') {
      try {
        toast.loading(`Stopping ${database.name}...`, { id: 'stop' });
        await databaseService.stopDatabase(database.id);
        toast.success(`Database "${database.name}" is stopping!`, { id: 'stop' });
        fetchDatabases();
      } catch (error) {
        console.error('Failed to stop database:', error);
        toast.error(error.response?.data?.message || 'Failed to stop database', { id: 'stop' });
      }
    } else if (action === 'start') {
      try {
        toast.loading(`Starting ${database.name}...`, { id: 'start' });
        await databaseService.startDatabase(database.id);
        toast.success(`Database "${database.name}" is starting!`, { id: 'start' });
        fetchDatabases();
      } catch (error) {
        console.error('Failed to start database:', error);
        toast.error(error.response?.data?.message || 'Failed to start database', { id: 'start' });
      }
    } else if (action === 'restart') {
      try {
        toast.loading(`Restarting ${database.name}...`, { id: 'restart' });
        await databaseService.stopDatabase(database.id);
        setTimeout(async () => {
          await databaseService.startDatabase(database.id);
          toast.success(`Database "${database.name}" is restarting!`, { id: 'restart' });
          fetchDatabases();
        }, 1000);
      } catch (error) {
        console.error('Failed to restart database:', error);
        toast.error(error.response?.data?.message || 'Failed to restart database', { id: 'restart' });
      }
    } else if (action === 'update') {
      setDatabaseToUpdate(database);
      setIsUpdateModalOpen(true);
    } else if (action === 'terminal') {
      setDatabaseForTerminal(database);
      setIsTerminalModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!databaseToDelete) return;
    try {
      setIsDeleteModalOpen(false);
      toast.loading(`Deleting ${databaseToDelete.name}...`, { id: 'delete' });
      await databaseService.deleteDatabase(databaseToDelete.id);
      toast.success(`Database "${databaseToDelete.name}" is being destroyed!`, { id: 'delete' });
      setDatabaseToDelete(null);
      fetchDatabases();
    } catch (error) {
      console.error('Failed to delete database:', error);
      toast.error(error.response?.data?.message || 'Failed to delete database', { id: 'delete' });
    }
  };

  const handleUpdateDatabase = async (updateData) => {
    try {
      setIsUpdateModalOpen(false);
      toast.loading(`Updating ${updateData.name}...`, { id: 'update' });
      await databaseService.updateDatabase(updateData.name, updateData);
      toast.success(`Database "${updateData.name}" is being updated!`, { id: 'update' });
      setDatabaseToUpdate(null);
      fetchDatabases();
    } catch (error) {
      console.error('Failed to update database:', error);
      toast.error(error.response?.data?.message || 'Failed to update database', { id: 'update' });
      throw error;
    }
  };

  const runningCount      = databases.filter(db => db.status === 'RUNNING').length;
  const provisioningCount = databases.filter(db => db.status === 'PROVISIONING').length;
  const inactiveCount     = databases.filter(db => db.status === 'STOPPED' || db.status === 'FAILED').length;

  return (
    <div className="min-h-screen bg-[#05060f] dot-bg font-sans">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f1024',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '13px',
          },
        }}
      />

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40">
        <div className="mx-auto max-w-[1800px] px-6 py-3">
          <div className="island rounded-2xl px-5 flex items-center justify-between h-14">
            {/* Brand */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-sm tracking-tight">Cloud Control</span>
              </div>

              <div className="hidden md:flex items-center">
                <span className="px-3 py-1 text-xs font-medium text-white bg-white/[0.08] rounded-lg border border-white/[0.1]">
                  Storage
                </span>
              </div>
            </div>

            {/* Status + refresh */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06]">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full running-dot block" />
                <span className="text-xs font-medium text-emerald-400">Operational</span>
              </div>
              <button
                onClick={handleResync}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] transition-colors text-primary-gray-500 hover:text-white"
                title="Refresh"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-[1800px] px-6 pb-12 pt-6">

        {/* Page header */}
        <div className="flex items-end justify-between mb-7">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight leading-none mb-1.5">
              Database Management
            </h1>
            <p className="text-sm text-primary-gray-600">
              Provision and manage database instances running in Docker
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 h-9 bg-white hover:bg-white/90 text-black text-sm font-semibold rounded-xl transition-all shadow-lg shadow-white/[0.08]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Database
          </button>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">

          {/* Total */}
          <div className="island-sm rounded-2xl p-5">
            <p className="text-[11px] font-semibold text-primary-gray-600 uppercase tracking-widest mb-3">Total</p>
            <p className="text-4xl font-semibold text-white leading-none mb-2">{databases.length}</p>
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

          {/* Provisioning */}
          <div className="island-sm glow-sky rounded-2xl p-5">
            <p className="text-[11px] font-semibold text-primary-gray-600 uppercase tracking-widest mb-3">Provisioning</p>
            <div className="flex items-end gap-2 mb-2">
              <p className="text-4xl font-semibold text-sky-400 leading-none">{provisioningCount}</p>
              {provisioningCount > 0 && (
                <span className="w-2 h-2 mb-1 bg-sky-400 rounded-full animate-pulse block" />
              )}
            </div>
            <p className="text-xs text-sky-500/60">starting up</p>
          </div>

          {/* Inactive */}
          <div className={`island-sm rounded-2xl p-5 ${inactiveCount > 0 ? 'glow-amber' : ''}`}>
            <p className="text-[11px] font-semibold text-primary-gray-600 uppercase tracking-widest mb-3">Inactive</p>
            <p className={`text-4xl font-semibold leading-none mb-2 ${inactiveCount > 0 ? 'text-amber-400' : 'text-primary-gray-600'}`}>
              {inactiveCount}
            </p>
            <p className="text-xs text-primary-gray-600">
              {databases.filter(db => db.status === 'FAILED').length > 0 ? 'needs attention' : 'stopped'}
            </p>
          </div>
        </div>

        {/* DB type breakdown — only show if any types exist */}
        {databases.length > 0 && (
          <div className="island-sm rounded-2xl px-5 py-4 mb-5 flex items-center gap-6 flex-wrap">
            <span className="text-[11px] font-semibold text-primary-gray-600 uppercase tracking-widest">Types</span>
            {DATABASE_TYPES.map(type => {
              const count = databases.filter(db => db.type === type.id).length;
              if (count === 0) return null;
              return (
                <div key={type.id} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-md ${type.bgColor} flex items-center justify-center p-0.5 flex-shrink-0`}>
                    <img src={type.logo} alt={type.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xs text-primary-gray-400">{type.name}</span>
                  <span className="text-xs font-semibold text-white">{count}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Database table island ───────────────────────────────────── */}
        <div className="island rounded-2xl overflow-hidden">
          <div className="max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <svg className="w-5 h-5 text-primary-gray-600 spin-slow" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <span className="text-xs text-primary-gray-600">Loading databases…</span>
              </div>
            ) : (
              <DatabaseTable databases={databases} onAction={handleDatabaseAction} />
            )}
          </div>
        </div>
      </main>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Database">
        <DatabaseForm onSubmit={handleCreateDatabase} onClose={() => setIsModalOpen(false)} />
      </Modal>

      <ProvisioningModal
        isOpen={isProvisioningModalOpen}
        databaseName={provisioningDatabaseName}
        onComplete={() => setIsProvisioningModalOpen(false)}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDatabaseToDelete(null); }}
        onConfirm={confirmDelete}
        databaseName={databaseToDelete?.name}
      />

      <UpdateDatabaseModal
        isOpen={isUpdateModalOpen}
        onClose={() => { setIsUpdateModalOpen(false); setDatabaseToUpdate(null); }}
        database={databaseToUpdate}
        onSubmit={handleUpdateDatabase}
      />

      <DatabaseConsoleModal
        isOpen={isTerminalModalOpen}
        onClose={() => { setIsTerminalModalOpen(false); setDatabaseForTerminal(null); }}
        database={databaseForTerminal}
      />
    </div>
  );
}

export default App;

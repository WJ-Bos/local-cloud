import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Modal from './components/Modal';
import DatabaseForm from './components/DatabaseForm';
import DatabaseTable from './components/DatabaseTable';
import ProvisioningModal from './components/ProvisioningModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import UpdateDatabaseModal from './components/UpdateDatabaseModal';
import { DATABASE_TYPES } from './components/DatabaseTypeSelector';
import databaseService from './services/databaseService';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProvisioningModalOpen, setIsProvisioningModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [databaseToDelete, setDatabaseToDelete] = useState(null);
  const [databaseToUpdate, setDatabaseToUpdate] = useState(null);
  const [provisioningDatabaseName, setProvisioningDatabaseName] = useState('');
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch databases on mount
  useEffect(() => {
    fetchDatabases();
  }, []);

  // Poll for active operations (PROVISIONING, DESTROYING, STARTING, STOPPING, UPDATING)
  useEffect(() => {
    const hasActiveOperation = databases.some(
      db => ['PROVISIONING', 'DESTROYING', 'STARTING', 'STOPPING', 'UPDATING'].includes(db.status)
    );
    if (!hasActiveOperation) return;

    const pollInterval = setInterval(() => {
      fetchDatabases();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [databases]);

  const fetchDatabases = async () => {
    try {
      const data = await databaseService.getAllDatabases();
      setDatabases(data);
      setLoading(false);

      // Close provisioning modal if database is no longer provisioning
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
        // Wait a moment before starting
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
      throw error; // Re-throw to let the modal handle it
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <Toaster position="top-right" />

      {/* Professional Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-[#111113]/80 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-[1800px] mx-auto px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-base tracking-tight">Cloud Control</span>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-1">
                <button className="px-3 py-1.5 text-sm font-medium text-primary-gray-400 hover:text-white transition-colors">
                  Overview
                </button>
                <button className="px-3 py-1.5 text-sm font-medium text-white bg-white/[0.06] rounded-md">
                  Databases
                </button>
                <button className="px-3 py-1.5 text-sm font-medium text-primary-gray-400 hover:text-white transition-colors">
                  Compute
                </button>
                <button className="px-3 py-1.5 text-sm font-medium text-primary-gray-400 hover:text-white transition-colors">
                  Storage
                </button>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                <span className="text-xs font-medium text-emerald-400">Operational</span>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/[0.06] transition-colors">
                <svg className="w-4 h-4 text-primary-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-md flex items-center justify-center text-xs font-semibold text-white">
                JD
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-[1800px] mx-auto px-8 py-8">
        {/* Page Header with Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1 tracking-tight">Database Management</h1>
            <p className="text-sm text-primary-gray-500">
              Provision and manage database instances across your infrastructure
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleResync}
              className="inline-flex items-center gap-2 px-4 h-9 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-sm font-medium text-white rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 h-9 bg-white hover:bg-white/90 text-sm font-medium text-black rounded-lg transition-all shadow-lg shadow-white/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Database
            </button>
          </div>
        </div>

        {/* Stats Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          {/* Database Types - Spans 2 columns */}
          <div className="lg:col-span-2 bg-[#111113] border border-white/[0.08] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white">Database Types</h3>
              <span className="text-xl font-semibold text-white">{databases.length}</span>
            </div>
            <div className="space-y-3">
              {DATABASE_TYPES.map(type => {
                const count = databases.filter(db => db.type === type.id).length;
                if (count === 0) return null;
                return (
                  <div key={type.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${type.bgColor} flex items-center justify-center p-1`}>
                        <img src={type.logo} alt={type.name} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-sm text-primary-gray-400 group-hover:text-white transition-colors">{type.name}</span>
                    </div>
                    <span className="text-sm font-medium text-white">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total */}
          <div className="bg-[#111113] border border-white/[0.08] rounded-xl p-5">
            <p className="text-xs font-medium text-primary-gray-500 mb-3">TOTAL</p>
            <p className="text-3xl font-semibold text-white mb-1">{databases.length}</p>
            <p className="text-xs text-primary-gray-600">instances</p>
          </div>

          {/* Running */}
          <div className="bg-[#111113] border border-white/[0.08] rounded-xl p-5">
            <p className="text-xs font-medium text-primary-gray-500 mb-3">RUNNING</p>
            <p className="text-3xl font-semibold text-emerald-400 mb-1">
              {databases.filter(db => db.status === 'RUNNING').length}
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
              <p className="text-xs text-primary-gray-600">healthy</p>
            </div>
          </div>

          {/* Provisioning */}
          <div className="bg-[#111113] border border-white/[0.08] rounded-xl p-5">
            <p className="text-xs font-medium text-primary-gray-500 mb-3">PROVISIONING</p>
            <p className="text-3xl font-semibold text-sky-400 mb-1">
              {databases.filter(db => db.status === 'PROVISIONING').length}
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-sky-400 rounded-full animate-pulse"></div>
              <p className="text-xs text-primary-gray-600">starting</p>
            </div>
          </div>

          {/* Stopped/Failed Combined */}
          <div className="bg-[#111113] border border-white/[0.08] rounded-xl p-5">
            <p className="text-xs font-medium text-primary-gray-500 mb-3">INACTIVE</p>
            <p className="text-3xl font-semibold text-primary-gray-500 mb-1">
              {databases.filter(db => db.status === 'STOPPED' || db.status === 'FAILED').length}
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-primary-gray-500 rounded-full"></div>
              <p className="text-xs text-primary-gray-600">
                {databases.filter(db => db.status === 'FAILED').length > 0 ? 'requires attention' : 'stopped'}
              </p>
            </div>
          </div>
        </div>

        {/* Database Table Container */}
        <div className="bg-[#111113] border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
            <DatabaseTable databases={databases} onAction={handleDatabaseAction} />
          </div>
        </div>
      </main>

      {/* Create Database Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Database"
      >
        <DatabaseForm onSubmit={handleCreateDatabase} onClose={() => setIsModalOpen(false)} />
      </Modal>

      {/* Provisioning Progress Modal */}
      <ProvisioningModal
        isOpen={isProvisioningModalOpen}
        databaseName={provisioningDatabaseName}
        onComplete={() => setIsProvisioningModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDatabaseToDelete(null);
        }}
        onConfirm={confirmDelete}
        databaseName={databaseToDelete?.name}
      />

      {/* Update Database Modal */}
      <UpdateDatabaseModal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setDatabaseToUpdate(null);
        }}
        database={databaseToUpdate}
        onSubmit={handleUpdateDatabase}
      />
    </div>
  );
}

export default App;

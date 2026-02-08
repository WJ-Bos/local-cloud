import { useState } from 'react';
import Modal from './components/Modal';
import DatabaseForm from './components/DatabaseForm';
import DatabaseTable from './components/DatabaseTable';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data for demonstration
  const [databases] = useState([
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'production-db',
      status: 'RUNNING',
      port: 5433,
      connectionString: 'postgresql://postgres:password@localhost:5433/production-db',
      createdAt: '2025-02-08T10:30:00Z',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'staging-db',
      status: 'PROVISIONING',
      port: 5434,
      connectionString: null,
      createdAt: '2025-02-08T11:00:00Z',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'test-db',
      status: 'FAILED',
      port: 5435,
      connectionString: null,
      createdAt: '2025-02-08T11:15:00Z',
    },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary-darker to-primary-dark">
      {/* Top Navigation */}
      <nav className="bg-primary-blue border-b border-primary-gray-800">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-orange to-primary-orange-dark rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-lg">Local Cloud Control Plane</span>
              </div>
              <div className="flex items-center space-x-1 text-sm">
                <a href="#" className="px-3 py-2 text-primary-gray-300 hover:text-white hover:bg-primary-gray-800 rounded transition-colors">
                  Dashboard
                </a>
                <a href="#" className="px-3 py-2 text-white bg-primary-gray-800 rounded">
                  Databases
                </a>
                <a href="#" className="px-3 py-2 text-primary-gray-300 hover:text-white hover:bg-primary-gray-800 rounded transition-colors">
                  Resources
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-primary-gray-900 rounded-full border border-primary-gray-800">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-primary-gray-300">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-6 py-6">
        <div className="max-w-[1600px] mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Databases</h1>
                <p className="text-sm text-primary-gray-400">
                  Manage your PostgreSQL database instances
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-primary-orange to-primary-orange-dark hover:from-primary-orange-dark hover:to-primary-orange text-white font-semibold rounded-md transition-all shadow-lg shadow-primary-orange/20 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Database
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-primary-gray-900 border border-primary-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary-gray-400 uppercase tracking-wider mb-1">Total Databases</p>
                  <p className="text-2xl font-bold text-white">{databases.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-primary-gray-900 border border-primary-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary-gray-400 uppercase tracking-wider mb-1">Running</p>
                  <p className="text-2xl font-bold text-green-500">
                    {databases.filter(db => db.status === 'RUNNING').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-primary-gray-900 border border-primary-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary-gray-400 uppercase tracking-wider mb-1">Provisioning</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {databases.filter(db => db.status === 'PROVISIONING').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-primary-gray-900 border border-primary-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary-gray-400 uppercase tracking-wider mb-1">Failed</p>
                  <p className="text-2xl font-bold text-red-500">
                    {databases.filter(db => db.status === 'FAILED').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Database Table */}
          <DatabaseTable databases={databases} />
        </div>
      </main>

      {/* Create Database Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Database"
      >
        <DatabaseForm onClose={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}

export default App;

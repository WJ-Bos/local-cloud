import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import InstanceDetailsModal from './InstanceDetailsModal';
import { getImageInfo, getInstanceTypeInfo } from './instanceCatalog';

const InstanceTable = ({ instances, onAction }) => {
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInstanceClick = (instance) => {
    setSelectedInstance(instance);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInstance(null);
  };

  const handleAction = (instance, action) => {
    if (onAction) onAction(instance, action);
  };

  if (instances.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl island-inset flex items-center justify-center">
          <svg className="h-6 w-6 text-primary-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-sm font-medium text-white mb-1">No instances yet</h3>
          <p className="text-xs text-primary-gray-600">Launch your first compute instance to get started</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="px-6 py-3.5 text-left text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
                Name
              </th>
              <th className="px-6 py-3.5 text-left text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
                Image
              </th>
              <th className="px-6 py-3.5 text-left text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
                Type
              </th>
              <th className="px-6 py-3.5 text-left text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
                Container
              </th>
              <th className="px-6 py-3.5 text-left text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
                Status
              </th>
              <th className="px-6 py-3.5 text-left text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
                SSH Port
              </th>
              <th className="px-6 py-3.5 text-left text-[10px] font-semibold text-primary-gray-600 uppercase tracking-widest">
                Launched
              </th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {instances.map((instance, index) => {
              const imageInfo = getImageInfo(instance.image);
              const typeInfo = getInstanceTypeInfo(instance.instanceType);
              return (
                <tr
                  key={instance.id}
                  className={`island-row ${index === instances.length - 1 ? 'border-b-0' : ''}`}
                >
                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white leading-none">
                      {instance.name}
                    </div>
                  </td>

                  {/* Image */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${imageInfo.bgColor} flex items-center justify-center p-1.5 flex-shrink-0`}>
                        <img src={imageInfo.logo} alt={imageInfo.name} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-sm text-primary-gray-400">{imageInfo.name}</span>
                    </div>
                  </td>

                  {/* Instance type */}
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-mono text-primary-gray-400 bg-white/[0.03] border border-white/[0.05] px-2 py-1 rounded-md">
                      {typeInfo.name}
                    </span>
                  </td>

                  {/* Container ID */}
                  <td className="px-6 py-4">
                    {instance.containerId ? (
                      <span className="text-[11px] font-mono text-primary-gray-600 bg-white/[0.03] border border-white/[0.05] px-2 py-1 rounded-md">
                        {instance.containerId.slice(0, 12)}
                      </span>
                    ) : (
                      <span className="text-primary-gray-700 text-sm">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge status={instance.status} />
                  </td>

                  {/* SSH Port */}
                  <td className="px-6 py-4">
                    {instance.sshPort ? (
                      <span className="text-sm font-mono text-primary-gray-400">:{instance.sshPort}</span>
                    ) : (
                      <span className="text-primary-gray-700 text-sm">—</span>
                    )}
                  </td>

                  {/* Created */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-primary-gray-600">
                      {new Date(instance.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </td>

                  {/* Connect + Details */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                    {instance.status === 'RUNNING' && (
                      <button
                        onClick={() => handleAction(instance, 'connect')}
                        className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-500/20 border border-emerald-500/25 text-xs font-semibold transition-colors"
                        title="Open web console"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Connect
                      </button>
                    )}
                    <button
                      onClick={() => handleInstanceClick(instance)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-primary-gray-600 hover:text-white hover:bg-white/[0.06] transition-colors"
                      title="View details"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.58-3.007-9.964-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <InstanceDetailsModal
        instance={selectedInstance}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAction={handleAction}
      />
    </>
  );
};

export default InstanceTable;

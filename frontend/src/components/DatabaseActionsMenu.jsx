import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

const DatabaseActionsMenu = ({ database, onAction }) => {
  const isRunning = database.status === 'RUNNING';
  const isStopped = database.status === 'STOPPED';
  const isProvisioning = database.status === 'PROVISIONING';
  const isDestroying = database.status === 'DESTROYING';

  const handleAction = (action) => {
    onAction(database, action);
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex items-center justify-center w-8 h-8 text-primary-gray-400 hover:text-white hover:bg-primary-gray-800 rounded transition-colors">
        <EllipsisVerticalIcon className="w-5 h-5" />
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
        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-primary-gray-700 rounded-lg bg-primary-gray-850 border border-primary-gray-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          {/* Start */}
          <div className="px-1 py-1">
            <Menu.Item disabled={!isStopped || isDestroying}>
              {({ active, disabled }) => (
                <button
                  onClick={() => handleAction('start')}
                  disabled={disabled}
                  className={`${
                    active ? 'bg-primary-gray-800 text-white' : 'text-primary-gray-300'
                  } ${
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                  } group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start
                  {!isStopped && <span className="ml-auto text-xs">(Not stopped)</span>}
                </button>
              )}
            </Menu.Item>
          </div>

          {/* Stop */}
          <div className="px-1 py-1">
            <Menu.Item disabled={!isRunning || isDestroying}>
              {({ active, disabled }) => (
                <button
                  onClick={() => handleAction('stop')}
                  disabled={disabled}
                  className={`${
                    active ? 'bg-primary-gray-800 text-white' : 'text-primary-gray-300'
                  } ${
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                  } group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  Stop
                  {!isRunning && <span className="ml-auto text-xs">(Not running)</span>}
                </button>
              )}
            </Menu.Item>
          </div>

          {/* Restart */}
          <div className="px-1 py-1">
            <Menu.Item disabled={!isRunning || isDestroying}>
              {({ active, disabled }) => (
                <button
                  onClick={() => handleAction('restart')}
                  disabled={disabled}
                  className={`${
                    active ? 'bg-primary-gray-800 text-white' : 'text-primary-gray-300'
                  } ${
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                  } group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Restart
                  {!isRunning && <span className="ml-auto text-xs">(Not running)</span>}
                </button>
              )}
            </Menu.Item>
          </div>

          {/* Update */}
          <div className="px-1 py-1">
            <Menu.Item disabled={!isStopped || isDestroying}>
              {({ active, disabled }) => (
                <button
                  onClick={() => handleAction('update')}
                  disabled={disabled}
                  className={`${
                    active ? 'bg-primary-gray-800 text-white' : 'text-primary-gray-300'
                  } ${
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                  } group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Update
                  {!isStopped && <span className="ml-auto text-xs">(Stop first)</span>}
                </button>
              )}
            </Menu.Item>
          </div>

          {/* Delete */}
          <div className="px-1 py-1">
            <Menu.Item disabled={isRunning || isDestroying}>
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
                  Delete
                  {isRunning && <span className="ml-auto text-xs">(Stop first)</span>}
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default DatabaseActionsMenu;

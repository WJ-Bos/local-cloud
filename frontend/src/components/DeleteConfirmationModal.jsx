import Modal from './Modal';

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, databaseName }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Database">
      <div className="space-y-4">
        {/* Warning Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-white">Are you absolutely sure?</h3>
          <p className="text-sm text-primary-gray-400">
            This action cannot be undone. This will permanently delete the database
          </p>
          <div className="bg-primary-gray-900 border border-primary-gray-700 rounded-lg p-3">
            <p className="text-sm font-mono text-primary-orange">{databaseName}</p>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-xs text-red-400 leading-relaxed">
            <span className="font-semibold">Warning:</span> All data in this database will be lost.
            The container and all associated resources will be destroyed.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-primary-gray-800 hover:bg-primary-gray-700 text-white rounded-md transition-colors border border-primary-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors"
          >
            Yes, Delete Database
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default DeleteConfirmationModal;

import Modal from './Modal';

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, databaseName }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Database">
      <div className="space-y-5">
        {/* Warning Icon */}
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center">
            <svg
              className="w-7 h-7 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div className="text-center space-y-3">
          <h3 className="text-lg font-semibold text-white">Are you absolutely sure?</h3>
          <p className="text-sm text-primary-gray-500">
            This action cannot be undone. This will permanently delete the database
          </p>
          <div className="bg-[#0A0A0B] border border-white/[0.08] rounded-lg p-3">
            <p className="text-sm font-mono font-medium text-white">{databaseName}</p>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-xs text-red-300">
            <span className="font-semibold">Warning:</span> All data and associated resources will be permanently destroyed.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white text-sm font-medium rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Delete Database
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default DeleteConfirmationModal;

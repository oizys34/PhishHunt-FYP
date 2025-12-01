import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-900">Exit Game?</h3>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <p className="text-gray-700 mb-6">
            Are you sure you want to exit the game? Your progress will be lost if you haven't completed the current scenario.
          </p>
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              No, Stay
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Yes, Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmationModal;


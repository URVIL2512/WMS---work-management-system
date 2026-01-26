import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const typeStyles = {
    danger: {
      icon: 'text-red-600',
      button: 'bg-red-500 hover:bg-red-600',
      border: 'border-red-200'
    },
    warning: {
      icon: 'text-yellow-600',
      button: 'bg-yellow-500 hover:bg-yellow-600',
      border: 'border-yellow-200'
    },
    info: {
      icon: 'text-blue-600',
      button: 'bg-blue-500 hover:bg-blue-600',
      border: 'border-blue-200'
    }
  };

  const styles = typeStyles[type];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full shadow-xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              type === 'danger' ? 'bg-red-100' : 
              type === 'warning' ? 'bg-yellow-100' : 
              'bg-blue-100'
            }`}>
              <AlertTriangle className={`${styles.icon} w-5 h-5`} />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 md:p-6">
          <p className="text-sm md:text-base text-gray-700 leading-relaxed">{message}</p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 p-4 md:p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 font-semibold rounded-lg transition-colors border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 ${styles.button} text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

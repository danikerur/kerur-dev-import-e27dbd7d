import React from 'react';
import { X } from 'lucide-react';

interface ExportDeliveriesModalProps {
  onClose: () => void;
}

export function ExportDeliveriesModal({ onClose }: ExportDeliveriesModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">ייצוא אספקות</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-gray-600 text-center">
            אפשרויות הייצוא יהיו זמינות בקרוב
          </p>
          <div className="flex justify-end mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              סגור
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

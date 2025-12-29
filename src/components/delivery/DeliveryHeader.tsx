import React from 'react';
import { Plus, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DeliveryHeaderProps {
  onExport: () => void;
}

export function DeliveryHeader({ onExport }: DeliveryHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 lg:mb-6">
      <h1 className="text-xl lg:text-2xl font-bold">ניהול אספקות</h1>
      <div className="flex gap-2 w-full sm:w-auto">
        <button
          onClick={onExport}
          className="flex-1 sm:flex-none bg-green-600 text-white px-3 lg:px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 text-sm"
        >
          <Download className="w-5 h-5" />
          <span>ייצוא</span>
        </button>
        <Link
          to="/deliveries/new"
          className="flex-1 sm:flex-none bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>אספקה חדשה</span>
        </Link>
      </div>
    </div>
  );
}

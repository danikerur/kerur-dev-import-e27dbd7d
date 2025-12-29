import React from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';

interface DeliveryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'planned' | 'completed' | 'canceled';
  onStatusFilterChange: (status: 'all' | 'planned' | 'completed' | 'canceled') => void;
  showStatusFilter: boolean;
  onToggleStatusFilter: () => void;
}

export function DeliveryFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  showStatusFilter,
  onToggleStatusFilter
}: DeliveryFiltersProps) {
  const getStatusLabel = () => {
    switch (statusFilter) {
      case 'planned': return 'מתוכננת';
      case 'completed': return 'הושלמה';
      case 'canceled': return 'בוטלה';
      default: return 'כל הסטטוסים';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 lg:p-4 mb-4 lg:mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="חיפוש לפי מוביל, לקוח, כתובת או מוצר..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pr-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <button
            onClick={onToggleStatusFilter}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg flex items-center justify-between gap-2 ${
              statusFilter !== 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>{getStatusLabel()}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {showStatusFilter && (
            <div className="absolute z-10 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 left-0 sm:right-0 sm:left-auto">
              {['all', 'planned', 'completed', 'canceled'].map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusFilterChange(status as any)}
                  className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-100 ${
                    statusFilter === status ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {status === 'all' && 'כל הסטטוסים'}
                  {status === 'planned' && 'מתוכננת'}
                  {status === 'completed' && 'הושלמה'}
                  {status === 'canceled' && 'בוטלה'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

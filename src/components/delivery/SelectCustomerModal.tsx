import React from 'react';
import { Search, Plus, X } from 'lucide-react';
import type { Customer } from '../../types/delivery';

interface SelectCustomerModalProps {
  customers: Customer[];
  selectedCustomerIds: string[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  onShowAddCustomer: () => void;
  onClose: () => void;
}

export function SelectCustomerModal({
  customers,
  selectedCustomerIds,
  searchTerm,
  onSearchChange,
  onSelectCustomer,
  onShowAddCustomer,
  onClose
}: SelectCustomerModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">בחירת לקוח</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="חיפוש לפי שם, טלפון או כתובת..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="block w-full pr-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={onShowAddCustomer}
              className="bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 mr-4 whitespace-nowrap hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              לקוח חדש
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {customers
              .filter(customer =>
                !selectedCustomerIds.includes(customer.id) &&
                (customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 customer.phone.includes(searchTerm) ||
                 customer.address.toLowerCase().includes(searchTerm.toLowerCase()))
              )
              .map(customer => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => onSelectCustomer(customer)}
                  className="w-full text-right p-3 hover:bg-gray-50 rounded-lg mb-2"
                >
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-gray-500">{customer.phone}</div>
                  <div className="text-sm text-gray-500">{customer.address}</div>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

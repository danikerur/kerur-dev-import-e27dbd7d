import React from 'react';
import { Plus, Truck } from 'lucide-react';
import type { SelectedCustomer } from '../../types/delivery';
import { DeliveryCustomerCard } from './DeliveryCustomerCard';

interface DeliveryCustomersListProps {
  selectedCustomers: SelectedCustomer[];
  onShowCustomerSelector: () => void;
  onRemoveCustomer: (customerId: string) => void;
  onShowProductSelector: (customerId: string) => void;
  onUpdateCustomer: (customerId: string, field: 'delivery_price' | 'notes', value: string | number) => void;
  onUpdateQuantity: (customerId: string, productId: string, quantity: number) => void;
  onRemoveProduct: (customerId: string, productId: string) => void;
}

export function DeliveryCustomersList({
  selectedCustomers,
  onShowCustomerSelector,
  onRemoveCustomer,
  onShowProductSelector,
  onUpdateCustomer,
  onUpdateQuantity,
  onRemoveProduct
}: DeliveryCustomersListProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">לקוחות באספקה</h2>
        <button
          type="button"
          onClick={onShowCustomerSelector}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-base font-medium"
        >
          <Plus className="w-5 h-5" />
          הוסף לקוח
        </button>
      </div>

      <div className="space-y-6">
        {selectedCustomers.map((customer, index) => (
          <DeliveryCustomerCard
            key={customer.id}
            customer={customer}
            index={index}
            onRemove={() => onRemoveCustomer(customer.id)}
            onShowProductSelector={() => onShowProductSelector(customer.id)}
            onUpdateDeliveryPrice={(value) => onUpdateCustomer(customer.id, 'delivery_price', value)}
            onUpdateNotes={(value) => onUpdateCustomer(customer.id, 'notes', value)}
            onUpdateQuantity={(productId, quantity) => onUpdateQuantity(customer.id, productId, quantity)}
            onRemoveProduct={(productId) => onRemoveProduct(customer.id, productId)}
          />
        ))}

        {selectedCustomers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Truck className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">לא נבחרו לקוחות</p>
          </div>
        )}
      </div>
    </div>
  );
}

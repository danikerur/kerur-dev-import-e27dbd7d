import React from 'react';
import { X } from 'lucide-react';
import type { SelectedCustomer } from '../../types/delivery';
import { CustomerProducts } from './CustomerProducts';

interface DeliveryCustomerCardProps {
  customer: SelectedCustomer;
  index: number;
  onRemove: () => void;
  onShowProductSelector: () => void;
  onUpdateDeliveryPrice: (value: number) => void;
  onUpdateNotes: (value: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveProduct: (productId: string) => void;
}

export function DeliveryCustomerCard({
  customer,
  index,
  onRemove,
  onShowProductSelector,
  onUpdateDeliveryPrice,
  onUpdateNotes,
  onUpdateQuantity,
  onRemoveProduct
}: DeliveryCustomerCardProps) {
  return (
    <div className="border rounded-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              תחנה {index + 1}
            </span>
            <h3 className="text-lg font-medium">{customer.customer.name}</h3>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            <div>{customer.customer.phone}</div>
            <div>{customer.customer.address}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            מחיר הובלה
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={customer.delivery_price}
            onChange={(e) => onUpdateDeliveryPrice(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-base"
            placeholder="הכנס מחיר הובלה"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            הערות
          </label>
          <textarea
            value={customer.notes}
            onChange={(e) => onUpdateNotes(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-base resize-none"
            rows={2}
            placeholder="הכנס הערות (אופציונלי)"
          />
        </div>

        <CustomerProducts
          products={customer.products}
          onShowProductSelector={onShowProductSelector}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveProduct={onRemoveProduct}
        />
      </div>
    </div>
  );
}

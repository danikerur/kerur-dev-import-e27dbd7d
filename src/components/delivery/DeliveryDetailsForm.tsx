import React from 'react';
import type { Driver } from '../../types/delivery';

interface DeliveryDetailsFormProps {
  driverId: string | null;
  deliveryDate: string | null;
  status: 'planned' | 'completed' | 'canceled';
  drivers: Driver[];
  onUpdate: (field: 'driver_id' | 'delivery_date' | 'status', value: string | null) => void;
}

export function DeliveryDetailsForm({
  driverId,
  deliveryDate,
  status,
  drivers,
  onUpdate
}: DeliveryDetailsFormProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">פרטי אספקה</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            מוביל
          </label>
          <select
            value={driverId || ''}
            onChange={(e) => onUpdate('driver_id', e.target.value || null)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-base"
          >
            <option value="">בחר מוביל</option>
            {drivers.map(driver => (
              <option key={driver.id} value={driver.id}>
                {driver.full_name} - {driver.phone}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            תאריך אספקה
          </label>
          <input
            type="date"
            value={deliveryDate || ''}
            onChange={(e) => onUpdate('delivery_date', e.target.value || null)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            סטטוס
          </label>
          <select
            value={status}
            onChange={(e) => onUpdate('status', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-base"
          >
            <option value="planned">מתוכננת</option>
            <option value="completed">הושלמה</option>
            <option value="canceled">בוטלה</option>
          </select>
        </div>
      </div>
    </div>
  );
}

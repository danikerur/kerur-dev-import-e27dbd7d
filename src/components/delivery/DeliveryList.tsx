import React from 'react';
import { ChevronDown, ChevronUp, Printer, Trash2, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MonthGroup, Delivery } from '../../types/delivery';

interface DeliveryListProps {
  groupedDeliveries: MonthGroup[];
  expandedDeliveries: Set<string>;
  onToggleExpand: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onPrint: (id: string) => void;
  onDelete: (id: string) => void;
  getStatusText: (status: string) => string;
  getStatusColor: (status: string) => string;
}

export function DeliveryList({
  groupedDeliveries,
  expandedDeliveries,
  onToggleExpand,
  onUpdateStatus,
  onPrint,
  onDelete,
  getStatusText,
  getStatusColor
}: DeliveryListProps) {
  if (groupedDeliveries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
        לא נמצאו אספקות
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedDeliveries.map((group) => (
        <div key={`${group.year}-${group.month}`}>
          <h2 className="text-lg font-semibold mb-4">
            {group.month} {group.year}
          </h2>
          <div className="space-y-4">
            {group.deliveries.map((delivery) => (
              <div key={delivery.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(delivery.status)}`}>
                          {getStatusText(delivery.status)}
                        </span>
                        <span className="text-gray-600">
                          {delivery.delivery_date
                            ? new Date(delivery.delivery_date).toLocaleDateString('he-IL')
                            : 'לא נקבע'}
                        </span>
                      </div>
                      <div className="mt-2 font-medium">
                        מוביל: {delivery.driver?.full_name || 'לא הוקצה'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {delivery.customers?.length || 0} תחנות
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onToggleExpand(delivery.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title={expandedDeliveries.has(delivery.id) ? 'הסתר פרטים' : 'הצג פרטים'}
                      >
                        {expandedDeliveries.has(delivery.id) ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      <Link
                        to={`/deliveries/edit/${delivery.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="ערוך אספקה"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => onPrint(delivery.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="הדפס אספקה"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onDelete(delivery.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="מחק אספקה"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {expandedDeliveries.has(delivery.id) && delivery.customers && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {delivery.customers
                        .sort((a, b) => a.order - b.order)
                        .map((customer, index) => (
                          <div key={customer.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="font-medium">
                              תחנה {index + 1}: {customer.customer?.name}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {customer.address}
                            </div>
                            {customer.notes && (
                              <div className="text-sm text-gray-500 mt-1">
                                הערות: {customer.notes}
                              </div>
                            )}
                            {customer.products && customer.products.length > 0 && (
                              <div className="mt-2 text-sm">
                                <span className="text-gray-500">מוצרים: </span>
                                {customer.products.map((p, i) => (
                                  <span key={p.id}>
                                    {p.product?.name} (×{p.quantity})
                                    {i < customer.products.length - 1 && ', '}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}

                      <div className="flex gap-2 pt-2">
                        {delivery.status !== 'completed' && (
                          <button
                            onClick={() => onUpdateStatus(delivery.id, 'completed')}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                          >
                            סמן כהושלמה
                          </button>
                        )}
                        {delivery.status !== 'canceled' && (
                          <button
                            onClick={() => onUpdateStatus(delivery.id, 'canceled')}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                          >
                            בטל אספקה
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DeliveryHeader } from '../components/delivery/DeliveryHeader';
import { DeliveryFilters } from '../components/delivery/DeliveryFilters';
import { DeliveryList } from '../components/delivery/DeliveryList';
import { ExportDeliveriesModal } from '../components/delivery/ExportDeliveriesModal';
import type { Delivery, MonthGroup } from '../types/delivery';

export function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'completed' | 'canceled'>('all');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [expandedDeliveries, setExpandedDeliveries] = useState<Set<string>>(new Set());

  useEffect(() => { fetchDeliveries(); }, []);

  async function fetchDeliveries() {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          id, driver_id, delivery_date, status, created_at,
          driver:drivers(id, full_name, phone),
          customers:delivery_customers(
            id, customer_id, delivery_price, notes, address, order,
            customer:customers(name, phone),
            products:delivery_products(
              id,
              product_id,
              quantity,
              dimension_index,
              product:products(
                id,
                name,
                specifications,
                dimensions
              )
            )
          )
        `)
        .order('delivery_date', { ascending: false });

      if (error) throw error;
      setDeliveries((data || []) as unknown as Delivery[]);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned': return 'מתוכננת';
      case 'completed': return 'הושלמה';
      case 'canceled': return 'בוטלה';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const groupDeliveriesByMonth = (deliveries: Delivery[]): MonthGroup[] => {
    const groups: Record<string, MonthGroup> = {};
    deliveries.forEach(delivery => {
      if (!delivery.delivery_date) return;
      const date = new Date(delivery.delivery_date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!groups[key]) {
        groups[key] = {
          month: date.toLocaleString('he-IL', { month: 'long' }),
          year: date.getFullYear(),
          deliveries: []
        };
      }
      groups[key].deliveries.push(delivery);
    });
    return Object.values(groups).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return Object.keys(groups).indexOf(b.month) - Object.keys(groups).indexOf(a.month);
    });
  };

  const toggleDeliveryExpansion = (deliveryId: string) => {
    setExpandedDeliveries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deliveryId)) newSet.delete(deliveryId);
      else newSet.add(deliveryId);
      return newSet;
    });
  };

  const handleUpdateStatus = async (deliveryId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({ status: status as 'planned' | 'completed' | 'canceled' })
        .eq('id', deliveryId);
      if (error) throw error;
      fetchDeliveries();
    } catch (error) {
      alert('שגיאה בעדכון סטטוס האספקה');
      console.error(error);
    }
  };

  const handleDelete = async (deliveryId: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את האספקה?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('deliveries')
        .delete()
        .eq('id', deliveryId);

      if (error) throw error;
      fetchDeliveries();
    } catch (error) {
      alert('שגיאה במחיקת האספקה');
      console.error(error);
    }
  };

  const handlePrint = async (deliveryId: string) => {
    alert('פונקציית ההדפסה תהיה זמינה בקרוב');
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const searchLower = searchTerm.toLowerCase();
    const driverMatch = delivery.driver?.full_name?.toLowerCase().includes(searchLower) || delivery.driver?.phone?.includes(searchLower);
    const customerMatch = delivery.customers?.some(c =>
      c.customer?.name?.toLowerCase().includes(searchLower) ||
      c.customer?.phone?.includes(searchLower) ||
      c.address?.toLowerCase().includes(searchLower)
    );
    const productMatch = delivery.customers?.some(c =>
      c.products?.some(p => p.product?.name?.toLowerCase().includes(searchLower))
    );
    const statusMatch = statusFilter === 'all' || delivery.status === statusFilter;
    return (driverMatch || customerMatch || productMatch) && statusMatch;
  });

  const groupedDeliveries = groupDeliveriesByMonth(filteredDeliveries);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <DeliveryHeader onExport={() => setShowExportModal(true)} />
      <DeliveryFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={(status) => {
          setStatusFilter(status);
          setShowStatusFilter(false);
        }}
        showStatusFilter={showStatusFilter}
        onToggleStatusFilter={() => setShowStatusFilter(!showStatusFilter)}
      />
      <DeliveryList
        groupedDeliveries={groupedDeliveries}
        expandedDeliveries={expandedDeliveries}
        onToggleExpand={toggleDeliveryExpansion}
        onUpdateStatus={handleUpdateStatus}
        onPrint={handlePrint}
        onDelete={handleDelete}
        getStatusText={getStatusText}
        getStatusColor={getStatusColor}
      />
      {showExportModal && <ExportDeliveriesModal onClose={() => setShowExportModal(false)} />}
    </div>
  );
}

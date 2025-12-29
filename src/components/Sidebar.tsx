import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Package, LayoutDashboard, LogOut, Menu, X, ChevronDown, ChevronRight, Truck, Warehouse, FileText, Search, Factory, Globe, Image, ClipboardList } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showProductsSubmenu, setShowProductsSubmenu] = useState(false);
  const [showDeliveriesSubmenu, setShowDeliveriesSubmenu] = useState(false);
  const [showInventorySubmenu, setShowInventorySubmenu] = useState(false);
  const [showQuotesSubmenu, setShowQuotesSubmenu] = useState(false);
  const [showSuppliersSubmenu, setShowSuppliersSubmenu] = useState(false);
  const [newLeadsCount, setNewLeadsCount] = useState<number>(0);

  // Realtime badge for new leads
  useEffect(() => {
    // Reset counter when entering leads page
    if (location.pathname === '/leads') {
      setNewLeadsCount(0);
    }
  }, [location.pathname]);

  useEffect(() => {
    const channel = supabase
      .channel('leads-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
        try {
          const lastSeen = Number(localStorage.getItem('leads_last_viewed_at') || '0');
          const createdAt = payload.new?.created_at ? new Date(payload.new.created_at as string).getTime() : Date.now();
          const createdVia = (payload.new?.created_via as string) || 'manual';
          // Only count webhook-created leads, and only when not on the page, and newer than last seen
          if (createdVia === 'webhook' && location.pathname !== '/leads' && createdAt > lastSeen) {
            setNewLeadsCount((c) => c + 1);
          }
        } catch {}
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'לוח בקרה' },
    { to: '/dashboard-search', icon: Search, label: 'איתור לקוחות' },
    { to: '/customers', icon: Users, label: 'לקוחות' },
    { to: '/leads', icon: Users, label: 'לידים' },
    { to: '/customer-orders', icon: ClipboardList, label: 'הזמנות לקוחות' },
    { to: '/category-images', icon: Image, label: 'תמונות לפי קטגוריה' },
    { to: '/suppliers', icon: Globe, label: 'ספקים' },
  ];

  const supplierLinks = [
    { to: '/supplier-orders', label: 'ניהול ספקים' },
    { to: '/supplier-containers', label: 'ניהול הזמנות' },
    { to: '/supplier-shipments', label: 'קונטיינרים' },
  ];

  const productLinks = [
    { to: '/products', label: 'ניהול מוצרים' },
    { to: '/products/add', label: 'הוסף מוצר' },
  ];

  const deliveryLinks = [
    { to: '/deliveries', label: 'ניהול אספקות' },
    { to: '/drivers', label: 'ניהול מובילים' },
  ];

  const inventoryLinks = [
    { to: '/inventory', label: 'מלאי ומעקב הזמנות' },
    { to: '/warehouses', label: 'ניהול מחסנים' },
  ];

  const quotesLinks = [
    { to: '/quick-quote', label: 'הצעת מחיר בדקה' },
    { to: '/quotes', label: 'היסטוריית הצעות מחיר' },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleProductsSubmenu = () => {
    setShowProductsSubmenu(!showProductsSubmenu);
  };

  const toggleDeliveriesSubmenu = () => {
    setShowDeliveriesSubmenu(!showDeliveriesSubmenu);
  };

  const toggleInventorySubmenu = () => {
    setShowInventorySubmenu(!showInventorySubmenu);
  };

  const toggleSuppliersSubmenu = () => {
    setShowSuppliersSubmenu(!showSuppliersSubmenu);
  };

  const isProductRoute = location.pathname.startsWith('/products');
  const isDeliveryRoute = location.pathname.startsWith('/deliveries') || location.pathname.startsWith('/drivers');
  const isInventoryRoute = location.pathname.startsWith('/inventory') || location.pathname.startsWith('/warehouses');
  const isQuotesRoute = location.pathname.startsWith('/quick-quote') || location.pathname.startsWith('/quotes');
  const isSupplierRoute = location.pathname.startsWith('/supplier-orders') || location.pathname.startsWith('/supplier-containers');

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 right-0 left-0 h-16 bg-white shadow-md z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        <img
          src="https://jthvcbeoblgvgettmehi.supabase.co/storage/v1/object/public/products/logo/logosys.png"
          alt="קירור דן"
          className="h-8 w-auto"
        />
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 right-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-30
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        ${isOpen ? 'top-16' : 'top-0'} lg:top-0
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex justify-center items-center">
            <img
              src="https://jthvcbeoblgvgettmehi.supabase.co/storage/v1/object/public/products/logo/logosys.png"
              alt="קירור דן"
              className="h-12 w-auto"
            />
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.to === '/customer-orders'
                    ? location.pathname.startsWith('/customer-orders')
                    : location.pathname === link.to;

                return (
                  <li key={link.to}>
                    {link.to === '/suppliers' ? (
                      <button
                        onClick={toggleSuppliersSubmenu}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                          isSupplierRoute
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{link.label}</span>
                        <Icon className="w-5 h-5 mr-auto" />
                        {showSuppliersSubmenu ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      <Link
                        to={link.to}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {link.label}
                          {link.to === '/leads' && newLeadsCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-xs">
                              {newLeadsCount}
                            </span>
                          )}
                        </span>
                        <Icon className="w-5 h-5 mr-auto" />
                      </Link>
                    )}
                    {/* Supplier submenu under suppliers link */}
                    {link.to === '/suppliers' && showSuppliersSubmenu && (
                      <ul className="mt-2 pr-4 space-y-1">
                        {supplierLinks.map((sublink) => {
                          const isSubActive = location.pathname === sublink.to;
                          return (
                            <li key={sublink.to}>
                              <Link
                                to={sublink.to}
                                onClick={() => setIsOpen(false)}
                                className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                                  isSubActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <span>{sublink.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}

              {/* Products Menu */}
              <li>
                <button
                  onClick={toggleProductsSubmenu}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isProductRoute
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>מוצרים</span>
                  <Package className="w-5 h-5 mr-auto" />
                  {showProductsSubmenu ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {showProductsSubmenu && (
                  <ul className="mt-2 pr-4 space-y-1">
                    {productLinks.map((link) => {
                      const isActive = location.pathname === link.to;
                      return (
                        <li key={link.to}>
                          <Link
                            to={link.to}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                              isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span>{link.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>

              {/* Deliveries Menu */}
              <li>
                <button
                  onClick={toggleDeliveriesSubmenu}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isDeliveryRoute
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>אספקות</span>
                  <Truck className="w-5 h-5 mr-auto" />
                  {showDeliveriesSubmenu ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {showDeliveriesSubmenu && (
                  <ul className="mt-2 pr-4 space-y-1">
                    {deliveryLinks.map((link) => {
                      const isActive = location.pathname === link.to;
                      return (
                        <li key={link.to}>
                          <Link
                            to={link.to}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                              isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span>{link.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>

              {/* Quotes Menu */}
              <li>
                <button
                  onClick={() => setShowQuotesSubmenu(!showQuotesSubmenu)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isQuotesRoute
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>הצעות מחיר</span>
                  <FileText className="w-5 h-5 mr-auto" />
                  {showQuotesSubmenu ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {showQuotesSubmenu && (
                  <ul className="mt-2 pr-4 space-y-1">
                    {quotesLinks.map((link) => {
                      const isActive = location.pathname === link.to;
                      return (
                        <li key={link.to}>
                          <Link
                            to={link.to}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                              isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span>{link.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>

              {/* Inventory Menu */}
              <li>
                <button
                  onClick={toggleInventorySubmenu}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isInventoryRoute
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>מלאי</span>
                  <Warehouse className="w-5 h-5 mr-auto" />
                  {showInventorySubmenu ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {showInventorySubmenu && (
                  <ul className="mt-2 pr-4 space-y-1">
                    {inventoryLinks.map((link) => {
                      const isActive = location.pathname === link.to;
                      return (
                        <li key={link.to}>
                          <Link
                            to={link.to}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                              isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span>{link.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            </ul>
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <span>התנתק</span>
              <LogOut className="w-5 h-5 mr-auto" />
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

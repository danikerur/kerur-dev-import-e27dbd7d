import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpRight, Users, ShoppingCart, DollarSign, RefreshCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export default function NewDashboardPage() {
  const [monthlySales, setMonthlySales] = useState<number>(0);
  const [todaySales, setTodaySales] = useState<number>(0);
  const [series, setSeries] = useState<{ name: string; Revenue: number }[]>([]);
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0);
  const [newCustomersCount, setNewCustomersCount] = useState<number>(0);
  const [newCustomersToday, setNewCustomersToday] = useState<number>(0);
  const [lastMonthOrdersVAT, setLastMonthOrdersVAT] = useState<number>(0);

  const monthsHe = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(
      Math.round(n),
    );

  useEffect(() => {
    async function fetchOrders() {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
      const { data, error } = await (supabase as any)
        .from('customer_order')
        .select('created_at,total_amount,status')
        .gte('created_at', startOfYear);
      if (error || !data) return;

      // סנן רק הזמנות מאושרות/סופקו
      const valid = data.filter(
        (o: any) => ['Confirmed', 'Fulfilled'].includes(o.status) && typeof o.total_amount === 'number',
      );

      // הזמנות חדשות בחודש האחרון (כל הסטטוסים)
      const now = new Date();
      const lastMonth = new Date(now);
      lastMonth.setMonth(now.getMonth() - 1);
      const newOrders = data.filter((o: any) => new Date(o.created_at) >= lastMonth);
      setNewOrdersCount(newOrders.length || 0);
      const vatSum = newOrders.reduce(
        (s: number, o: any) => s + ((Number(o.total_amount) || 0) * 1.18),
        0
      );
      setLastMonthOrdersVAT(vatSum);

      // סכום החודש
      const month = now.getMonth();
      const year = now.getFullYear();
      const monthSum = valid
        .filter((o: any) => {
          const d = new Date(o.created_at);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
      setMonthlySales(monthSum);

      // סכום של היום
      const today = now.toDateString();
      const todaySum = valid
        .filter((o: any) => new Date(o.created_at).toDateString() === today)
        .reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
      setTodaySales(todaySum);

      // סדרה חודשית לשנה הנוכחית
      const buckets = Array.from({ length: 12 }, (_, i) => ({ name: monthsHe[i], Revenue: 0 }));
      valid.forEach((o: any) => {
        const d = new Date(o.created_at);
        if (d.getFullYear() === year) {
          buckets[d.getMonth()].Revenue += Number(o.total_amount || 0);
        }
      });
      setSeries(buckets);

      // לקוחות חדשים בחודש הנוכחי + היום
      const startOfMonth = new Date(year, month, 1);
      const startOfNextMonth = new Date(year, month + 1, 1);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      const { count: monthCustomers } = await (supabase as any)
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())
        .lt('created_at', startOfNextMonth.toISOString());

      const { count: todayCustomers } = await (supabase as any)
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', startOfTomorrow.toISOString());

      setNewCustomersCount(monthCustomers || 0);
      setNewCustomersToday(todayCustomers || 0);
    }
    fetchOrders();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: 'סה״כ מכירות החודש',
        value: formatCurrency(monthlySales),
        change: `+${formatCurrency(todaySales)} היום`,
        color: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: <DollarSign className="w-6 h-6 text-yellow-500" />,
      },
      {
        label: 'הזמנות חדשות (בחודש האחרון)',
        value: newOrdersCount.toLocaleString('he-IL'),
        change: '',
        color: 'bg-green-100',
        text: 'text-green-700',
        icon: <ShoppingCart className="w-6 h-6 text-green-500" />,
      },
      {
        label: 'לקוחות חדשים',
        value: newCustomersCount.toLocaleString('he-IL'),
        change: newCustomersToday ? `+${newCustomersToday.toLocaleString('he-IL')} היום` : '',
        color: 'bg-blue-100',
        text: 'text-blue-700',
        icon: <Users className="w-6 h-6 text-blue-500" />,
      },
      {
        label: 'סה״כ הזמנות כולל מע״מ (בחודש האחרון)',
        value: formatCurrency(lastMonthOrdersVAT),
        change: '',
        color: 'bg-purple-100',
        text: 'text-purple-700',
        icon: <RefreshCcw className="w-6 h-6 text-purple-500" />,
      },
    ],
    [monthlySales, todaySales, newOrdersCount, newCustomersCount, newCustomersToday, lastMonthOrdersVAT],
  );

  // אספקות פעילות אחרונות
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);

  useEffect(() => {
    async function fetchRecentDeliveries() {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          id,
          delivery_date,
          status,
          driver:drivers(full_name)
        `)
        .in('status', ['planned', 'completed'])
        .not('driver_id', 'is', null)
        .not('delivery_date', 'is', null)
        .order('delivery_date', { ascending: false })
        .limit(3);
      if (!error && data) {
        setRecentDeliveries(data.filter(d => d.driver && d.delivery_date));
      }
    }
    fetchRecentDeliveries();
  }, []);

  // הצעות מחיר אחרונות
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);

  useEffect(() => {
    async function fetchRecentQuotes() {
      const { data, error } = await supabase
        .from('quick_quotes')
        .select('id, client_name, created_at, quote_number')
        .order('created_at', { ascending: false })
        .limit(3);
      if (!error && data) {
        // שלוף סכום כולל לכל הצעה
        const withTotals = await Promise.all(
          data.map(async (q: any) => {
            const { data: products, error: prodError } = await supabase
              .from('quick_quote_products')
              .select('total_price')
              .eq('quote_id', q.id);
            let total = 0;
            if (!prodError && products) {
              total = products.reduce((sum: number, p: any) => sum + (Number(p.total_price) || 0), 0);
            }
            return { ...q, total };
          })
        );
        setRecentQuotes(withTotals);
      }
    }
    fetchRecentQuotes();
  }, []);

  // המוצרים הכי מבוקשים
  const [topRequestedProducts, setTopRequestedProducts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTopRequestedProducts() {
      // שלוף את כל המופעים של מוצרים בהצעות מחיר
      const { data: quoteProducts, error } = await supabase
        .from('quick_quote_products')
        .select('product_id, selected_dimension')
        .not('product_id', 'is', null);
      if (error || !quoteProducts) return;
      // ספור מופעים לכל מוצר+מידה
      const countMap = new Map();
      for (const row of quoteProducts) {
        const key = row.product_id + '|' + (row.selected_dimension || '');
        countMap.set(key, (countMap.get(key) || 0) + 1);
      }
      // קח את שלושת המוצרים/מידות הכי מבוקשים
      const sorted = Array.from(countMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      // שלוף פרטי מוצר ומידה
      const productsInfo = await Promise.all(sorted.map(async ([key, count]) => {
        const [product_id, selected_dimension] = key.split('|');
        // שלוף מוצר
        const { data: product } = await supabase
          .from('products')
          .select('*')
          .eq('id', product_id)
          .single();
        let dimension = null;
        if (selected_dimension && selected_dimension !== 'null' && product) {
          try {
            const dimObj = JSON.parse(selected_dimension);
            dimension = dimObj;
          } catch {}
        }
        return {
          id: product_id,
          name: product?.name || '',
          image_url: product?.image_url || '',
          count,
          dimension,
        };
      }));
      setTopRequestedProducts(productsInfo);
    }
    fetchTopRequestedProducts();
  }, []);

  // פונקציות סטטוס כמו בעמוד DeliveriesPage
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

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-2 md:px-8">
      {/* כרטיסי מידע */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className={`bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-4 transition hover:shadow-2xl`}>
            <div className="flex items-center gap-4 mb-2">
              <div className={`rounded-full p-3 ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <div className="text-gray-500 text-sm font-medium">{stat.label}</div>
                <div className={`text-2xl font-bold text-gray-900`}>{stat.value}</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-green-600 text-sm font-semibold">{stat.change}</span>
              <ArrowUpRight className="w-5 h-5 text-green-400" />
            </div>
          </div>
        ))}
      </div>

      {/* כרטיסי טבלאות מידע */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {/* אספקות אחרונות/מתוכננות */}
        <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-6 transition hover:shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 rounded-full p-2">
              <RefreshCcw className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">אספקות אחרונות/מתוכננות</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-base">
              <thead>
                <tr className="text-gray-500 bg-gray-50">
                  <th className="py-4 px-6 font-semibold">מוביל</th>
                  <th className="py-4 px-6 font-semibold">תאריך</th>
                  <th className="py-4 px-6 font-semibold">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {recentDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-gray-400 py-8">אין נתונים</td>
                  </tr>
                ) : (
                  recentDeliveries.map((delivery, idx) => (
                    <tr
                      key={delivery.id}
                      className={`transition hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="py-4 px-6">
                        <Link to={`/deliveries/edit/${delivery.id}`} className="text-blue-700 hover:underline font-medium">
                          {delivery.driver?.full_name || '---'}
                        </Link>
                      </td>
                      <td className="py-4 px-6">{delivery.delivery_date ? new Date(delivery.delivery_date).toLocaleDateString('he-IL') : ''}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(delivery.status)}`}>{getStatusText(delivery.status)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* הצעות מחיר אחרונות */}
        <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-6 transition hover:shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 rounded-full p-2">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">הצעות מחיר אחרונות</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-base">
              <thead>
                <tr className="text-gray-500 bg-gray-50">
                  <th className="py-4 px-6 font-semibold">לקוח</th>
                  <th className="py-4 px-6 font-semibold">מספר הצעה</th>
                  <th className="py-4 px-6 font-semibold">תאריך</th>
                  <th className="py-4 px-6 font-semibold">סכום</th>
                </tr>
              </thead>
              <tbody>
                {recentQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-8">אין נתונים</td>
                  </tr>
                ) : (
                  recentQuotes.map((quote, idx) => (
                    <tr
                      key={quote.id}
                      className={`transition hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="py-4 px-6">
                        <Link to={`/quick-quote?id=${quote.id}`} className="text-blue-700 hover:underline font-medium">
                          {quote.client_name || '---'}
                        </Link>
                      </td>
                      <td className="py-4 px-6">{quote.quote_number || quote.id}</td>
                      <td className="py-4 px-6">{quote.created_at ? new Date(quote.created_at).toLocaleDateString('he-IL') : ''}</td>
                      <td className="py-4 px-6 font-bold">₪{quote.total?.toLocaleString() || '0'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* מכירות לפי חודשים (שנה נוכחית) */}
        <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-6 transition hover:shadow-2xl md:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-100 rounded-full p-2">
              <DollarSign className="w-6 h-6 text-yellow-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">מכירות לפי חודשים (שנה נוכחית)</h3>
          </div>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Revenue" stroke="#f59e0b" name="מכירות (₪)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* המוצרים הכי מבוקשים */}
        <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-6 transition hover:shadow-2xl md:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-100 rounded-full p-2">
              <ShoppingCart className="w-6 h-6 text-yellow-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">המוצרים הכי מבוקשים</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-base">
              <thead>
                <tr className="text-gray-500 bg-gray-50">
                  <th className="py-4 px-6 font-semibold">תמונה</th>
                  <th className="py-4 px-6 font-semibold">מוצר</th>
                  <th className="py-4 px-6 font-semibold">מידה</th>
                  <th className="py-4 px-6 font-semibold"># הצעות מחיר</th>
                </tr>
              </thead>
              <tbody>
                {topRequestedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-8">אין נתונים</td>
                  </tr>
                ) : (
                  topRequestedProducts.map((prod, idx) => (
                    <tr key={prod.id + idx} className={`transition hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="py-4 px-6">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="w-16 h-16 object-contain rounded bg-gray-50 border" />
                        ) : (
                          <span className="text-xs text-gray-400">ללא תמונה</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-bold">{prod.name}</td>
                      <td className="py-4 px-6">
                        {prod.dimension ? `${prod.dimension.length}×${prod.dimension.width}×${prod.dimension.height}` : '-'}
                      </td>
                      <td className="py-4 px-6 text-blue-700 font-bold">{prod.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

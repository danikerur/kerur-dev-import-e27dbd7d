import { useState } from 'react';

interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface QuoteItem {
  product?: {
    name: string;
    image_url?: string;
  };
  dimension?: {
    name: string;
    length: number;
    depth?: number;
    width?: number;
    height: number;
  };
  text?: string;
  quantity: number;
  price: number;
  total: number;
}

const QuickQuotePage = () => {
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [vat, setVat] = useState(0);
  const [total, setTotal] = useState(0);

  const generatePDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.getElementById('quote-pdf');
    if (!element) return;

    element.style.display = 'block';
    element.style.position = 'absolute';
    element.style.left = '-9999px';

    const opt = {
      margin: 0,
      filename: 'הצעת_מחיר.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' as const,
        compress: true
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      element.style.display = 'none';
      element.style.position = 'static';
      element.style.left = 'auto';
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">הצעת מחיר בדקה</h1>
      
      {/* Customer Details Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">פרטי לקוח</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">שם</label>
            <input
              type="text"
              value={customerDetails.name}
              onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
              className="w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">טלפון</label>
            <input
              type="text"
              value={customerDetails.phone}
              onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
              className="w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">אימייל</label>
            <input
              type="email"
              value={customerDetails.email}
              onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
              className="w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">כתובת</label>
            <input
              type="text"
              value={customerDetails.address}
              onChange={(e) => setCustomerDetails({...customerDetails, address: e.target.value})}
              className="w-full border rounded-md p-2"
            />
          </div>
        </div>
      </div>

      {/* Quote Items */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">פריטים</h2>
        {quoteItems.length === 0 ? (
          <p className="text-gray-500">אין פריטים עדיין</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-right">מוצר</th>
                <th className="p-2 text-right">מידה</th>
                <th className="p-2 text-right">כמות</th>
                <th className="p-2 text-right">מחיר</th>
                <th className="p-2 text-right">סה"כ</th>
              </tr>
            </thead>
            <tbody>
              {quoteItems.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{item.product?.name || item.text}</td>
                  <td className="p-2">
                    {item.dimension ? `${item.dimension.height}×${item.dimension.length}×${item.dimension.width}` : '-'}
                  </td>
                  <td className="p-2">{item.quantity}</td>
                  <td className="p-2">₪{item.price.toFixed(2)}</td>
                  <td className="p-2">₪{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Totals */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between mb-2">
          <span>סה"כ לפני מע"מ:</span>
          <span>₪{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>מע"מ (18%):</span>
          <span>₪{vat.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg">
          <span>סה"כ לתשלום:</span>
          <span>₪{total.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={generatePDF}
        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
      >
        הורד PDF
      </button>

      {/* Hidden div for PDF generation */}
      <div
        id="quote-pdf"
        style={{
          display: 'none',
          fontFamily: "'Heebo', sans-serif",
          direction: 'rtl',
          background: '#fff',
          position: 'relative',
          width: '210mm',
          minHeight: '297mm',
          paddingTop: '0',
          paddingBottom: '90px',
          boxSizing: 'border-box',
        }}
      >
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8 text-center">הצעת מחיר</h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">פרטי לקוח</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">שם:</p>
                <p>{customerDetails.name}</p>
              </div>
              <div>
                <p className="font-medium">טלפון:</p>
                <p>{customerDetails.phone}</p>
              </div>
              <div>
                <p className="font-medium">אימייל:</p>
                <p>{customerDetails.email}</p>
              </div>
              <div>
                <p className="font-medium">כתובת:</p>
                <p>{customerDetails.address}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">פרטי הזמנה</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">מוצר</th>
                  <th className="border p-2">מידה</th>
                  <th className="border p-2">כמות</th>
                  <th className="border p-2">מחיר ליחידה</th>
                  <th className="border p-2">סה"כ</th>
                </tr>
              </thead>
              <tbody>
                {quoteItems.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border p-2">
                      <div className="flex items-center gap-2">
                        {item.product?.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name || 'תמונת מוצר'}
                            className="w-12 h-12 object-cover rounded"
                            style={{ border: '1px solid #eee', background: '#fff' }}
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">ללא תמונת מוצר</span>
                        )}
                        <span>{item.product?.name || item.text}</span>
                      </div>
                    </td>
                    <td className="border p-2">
                      {item.dimension ? `${item.dimension.height}×${item.dimension.length}×${item.dimension.width}` : '-'}
                    </td>
                    <td className="border p-2">{item.quantity}</td>
                    <td className="border p-2">₪{item.price.toFixed(2)}</td>
                    <td className="border p-2">₪{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={4} className="border p-2 text-left">סה"כ לפני מע"מ:</td>
                  <td className="border p-2">₪{subtotal.toFixed(2)}</td>
                </tr>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={4} className="border p-2 text-left">מע"מ (18%):</td>
                  <td className="border p-2">₪{vat.toFixed(2)}</td>
                </tr>
                <tr className="bg-gray-100 font-bold text-lg">
                  <td colSpan={4} className="border p-2 text-left">סה"כ לתשלום:</td>
                  <td className="border p-2">₪{total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickQuotePage;

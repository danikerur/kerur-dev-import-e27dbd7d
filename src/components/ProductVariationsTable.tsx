import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export interface ProductVariation {
  id?: number;
  name: string;
}

interface ProductVariationsTableProps {
  variations: ProductVariation[];
  onChange: (variations: ProductVariation[]) => void;
}

export default function ProductVariationsTable({ variations, onChange }: ProductVariationsTableProps) {
  const handleChange = (index: number, value: string) => {
    const newVars = [...variations];
    newVars[index].name = value;
    onChange(newVars);
  };

  const addVariation = () => {
    onChange([
      ...variations,
      { name: '' }
    ]);
  };

  const removeVariation = (index: number) => {
    onChange(variations.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">וריאציות מוצר</h2>
        <button
          type="button"
          onClick={addVariation}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 ml-1" />
          הוסף וריאציה
        </button>
      </div>
      {variations.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שם הווריאציה</th>
                <th className="relative px-6 py-3"><span className="sr-only">פעולות</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {variations.map((variation, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={variation.name}
                      onChange={e => handleChange(index, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      minLength={1}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => removeVariation(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p>אין וריאציות מוגדרות</p>
          <p className="text-sm mt-1">לחץ על "הוסף וריאציה" כדי להתחיל</p>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface InspectionItem {
  id: string;
  orderId: string;
  item: string;
  quantity: number;
  status: string;
}

export default function Inspection() {
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InspectionItem | null>(null);
  const [items] = useState<InspectionItem[]>([]);

  const [result, setResult] = useState('');
  const [remarks, setRemarks] = useState('');

  const openInspectionModal = (item: InspectionItem) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Inspection result:', result, 'Remarks:', remarks);
    setShowModal(false);
    setResult('');
    setRemarks('');
    setSelectedItem(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inspection</h1>
        <p className="text-gray-500 mt-1">Quality control and inspection management</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.orderId}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{item.item}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">{item.quantity}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => openInspectionModal(item)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedItem && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowModal(false);
            setSelectedItem(null);
            setResult('');
            setRemarks('');
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Inspection Report</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Order ID: <span className="font-semibold text-gray-900">{selectedItem.orderId}</span></p>
                <p className="text-sm text-gray-600">Item: <span className="font-semibold text-gray-900">{selectedItem.item}</span></p>
                <p className="text-sm text-gray-600">Quantity: <span className="font-semibold text-gray-900">{selectedItem.quantity}</span></p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Inspection Result</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-green-50 transition-colors">
                    <input
                      type="radio"
                      name="result"
                      value="pass"
                      checked={result === 'pass'}
                      onChange={(e) => setResult(e.target.value)}
                      className="w-4 h-4"
                      required
                    />
                    <CheckCircle className="text-green-600" size={24} />
                    <span className="font-semibold text-gray-900">Pass</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                    <input
                      type="radio"
                      name="result"
                      value="fail"
                      checked={result === 'fail'}
                      onChange={(e) => setResult(e.target.value)}
                      className="w-4 h-4"
                    />
                    <XCircle className="text-red-600" size={24} />
                    <span className="font-semibold text-gray-900">Fail</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter inspection remarks..."
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

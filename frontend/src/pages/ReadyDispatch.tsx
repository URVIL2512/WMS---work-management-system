import { useState } from 'react';
import { Truck, X } from 'lucide-react';

interface DispatchItem {
  id: string;
  orderId: string;
  customer: string;
  item: string;
  quantity: number;
}

export default function ReadyDispatch() {
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DispatchItem | null>(null);
  const [items] = useState<DispatchItem[]>([]);

  const [formData, setFormData] = useState({
    transportName: '',
    lrNumber: '',
    dispatchDate: new Date().toISOString().split('T')[0]
  });

  const openDispatchModal = (item: DispatchItem) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Dispatching order:', selectedItem?.orderId, formData);
    setShowModal(false);
    setFormData({
      transportName: '',
      lrNumber: '',
      dispatchDate: new Date().toISOString().split('T')[0]
    });
    setSelectedItem(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ready For Dispatch</h1>
        <p className="text-gray-500 mt-1">Items ready to be dispatched to customers</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.orderId}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{item.customer}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{item.item}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">{item.quantity}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => openDispatchModal(item)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Truck size={16} />
                      Dispatch
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
            setFormData({
              transportName: '',
              lrNumber: '',
              dispatchDate: new Date().toISOString().split('T')[0]
            });
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Dispatch Order</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Order ID: <span className="font-semibold text-gray-900">{selectedItem.orderId}</span></p>
                <p className="text-sm text-gray-600">Customer: <span className="font-semibold text-gray-900">{selectedItem.customer}</span></p>
                <p className="text-sm text-gray-600">Item: <span className="font-semibold text-gray-900">{selectedItem.item}</span></p>
                <p className="text-sm text-gray-600">Quantity: <span className="font-semibold text-gray-900">{selectedItem.quantity}</span></p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Transport Name</label>
                <input
                  type="text"
                  value={formData.transportName}
                  onChange={(e) => setFormData({ ...formData, transportName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter transport company name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">LR Number</label>
                <input
                  type="text"
                  value={formData.lrNumber}
                  onChange={(e) => setFormData({ ...formData, lrNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter LR number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Dispatch Date</label>
                <input
                  type="date"
                  value={formData.dispatchDate}
                  onChange={(e) => setFormData({ ...formData, dispatchDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Confirm Dispatch
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

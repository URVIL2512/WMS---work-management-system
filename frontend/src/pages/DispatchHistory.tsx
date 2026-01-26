import { useState } from 'react';
import { Eye, Download } from 'lucide-react';

interface DispatchRecord {
  id: string;
  orderId: string;
  customer: string;
  item: string;
  transport: string;
  lrNumber: string;
  dispatchDate: string;
  status: string;
}

export default function DispatchHistory() {
  const [records] = useState<DispatchRecord[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dispatch History</h1>
          <p className="text-gray-500 mt-1">View all dispatched orders</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors">
          <Download size={20} />
          Export Report
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Transport</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">LR Number</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Dispatch Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{record.orderId}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.customer}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{record.item}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.transport}</td>
                  <td className="py-3 px-4 text-sm text-gray-700 font-medium">{record.lrNumber}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.dispatchDate}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      record.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                      record.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Details">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

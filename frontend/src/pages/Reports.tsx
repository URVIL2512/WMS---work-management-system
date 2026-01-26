import { useState } from 'react';
import { Download, Filter } from 'lucide-react';

type ReportType = 'production' | 'vendor' | 'dispatch';

export default function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>('production');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });

  const productionData: any[] = [];
  const vendorData: any[] = [];
  const dispatchData: any[] = [];

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">Generate and view system reports</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6">
          <Filter size={20} className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
          <h3 className="text-base md:text-lg font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center p-3 md:p-4 gap-3 md:gap-0">
            <div className="flex overflow-x-auto -mx-3 md:mx-0 px-3 md:px-0 scrollbar-hide">
              <button
                onClick={() => setActiveReport('production')}
                className={`px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold whitespace-nowrap transition-colors ${
                  activeReport === 'production'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Production Report
              </button>
              <button
                onClick={() => setActiveReport('vendor')}
                className={`px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold whitespace-nowrap transition-colors ${
                  activeReport === 'vendor'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Vendor Job Report
              </button>
              <button
                onClick={() => setActiveReport('dispatch')}
                className={`px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold whitespace-nowrap transition-colors ${
                  activeReport === 'dispatch'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dispatch Report
              </button>
            </div>
            <button className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm md:text-base font-semibold transition-colors whitespace-nowrap">
              <Download size={16} md:size={18} />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

        <div className="p-3 md:p-6">
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <div className="inline-block min-w-full align-middle px-3 md:px-0">
            {activeReport === 'production' && (
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Work Order ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Completed</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {productionData.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.workOrderId}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{item.item}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{item.quantity}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{item.completed}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                          item.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'vendor' && (
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Vendor</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Job ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Sent</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Received</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Pending</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorData.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.vendor}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{item.jobId}</td>
                      <td className="py-3 px-4 text-sm text-orange-600 font-semibold">{item.sent}</td>
                      <td className="py-3 px-4 text-sm text-green-600 font-semibold">{item.received}</td>
                      <td className="py-3 px-4 text-sm text-blue-600 font-semibold">{item.pending}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                          item.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'dispatch' && (
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Dispatch Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatchData.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.orderId}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{item.customer}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 font-semibold">{item.quantity}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{item.dispatchDate}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                          item.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                          item.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Plus, Printer, X } from 'lucide-react';

interface OutsideJob {
  id: string;
  jobId: string;
  vendor: string;
  challanNo: string;
  workOrderId: string;
  itemName: string;
  quantitySent: number;
  receivedQty: number;
  status: string;
}

export default function OutsideJobs() {
  const [showModal, setShowModal] = useState(false);
  const [jobs] = useState<OutsideJob[]>([]);

  const [formData, setFormData] = useState({
    vendorName: '',
    challanNumber: '',
    workOrderId: '',
    itemName: '',
    quantitySent: '',
    process: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Outside job work created:', formData);
    setShowModal(false);
    setFormData({
      vendorName: '',
      challanNumber: '',
      workOrderId: '',
      itemName: '',
      quantitySent: '',
      process: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Outside Job Work</h1>
          <p className="text-gray-500 mt-1">Manage vendor job work assignments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <Plus size={20} />
          Create Job Work
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Job ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Vendor</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Challan No</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Work Order</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Sent Qty</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Received Qty</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{job.jobId}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{job.vendor}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{job.challanNo}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{job.workOrderId}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{job.itemName}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-orange-600">{job.quantitySent}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-green-600">{job.receivedQty}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      job.status === 'Received' ? 'bg-green-100 text-green-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors" title="Print Challan">
                      <Printer size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Create Outside Job Work</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vendor Name</label>
                  <input
                    type="text"
                    value={formData.vendorName}
                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Challan Number</label>
                  <input
                    type="text"
                    value={formData.challanNumber}
                    onChange={(e) => setFormData({ ...formData, challanNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Work Order ID</label>
                <select
                  value={formData.workOrderId}
                  onChange={(e) => setFormData({ ...formData, workOrderId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select work order</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name</label>
                <input
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity Sent</label>
                  <input
                    type="number"
                    value={formData.quantitySent}
                    onChange={(e) => setFormData({ ...formData, quantitySent: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Process</label>
                  <input
                    type="text"
                    value={formData.process}
                    onChange={(e) => setFormData({ ...formData, process: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Powder Coating"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Create Job Work
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

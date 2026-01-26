import { useState } from 'react';
import { Package, X } from 'lucide-react';

interface PendingJob {
  id: string;
  jobId: string;
  vendor: string;
  sentQty: number;
  receivedQty: number;
  balanceQty: number;
}

export default function Inward() {
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<PendingJob | null>(null);
  const [pendingJobs] = useState<PendingJob[]>([]);

  const [receiveQty, setReceiveQty] = useState('');
  const [completedProcess, setCompletedProcess] = useState('');

  const openReceiveModal = (job: PendingJob) => {
    setSelectedJob(job);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Receiving quantity:', receiveQty, 'for job:', selectedJob?.jobId);
    setShowModal(false);
    setReceiveQty('');
    setCompletedProcess('');
    setSelectedJob(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inward - Job Work Return</h1>
        <p className="text-gray-500 mt-1">Receive materials from vendors</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Job ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Vendor</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Sent Quantity</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Received Quantity</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Balance Quantity</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingJobs.map((job) => (
                <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{job.jobId}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{job.vendor}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-orange-600">{job.sentQty}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-green-600">{job.receivedQty}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-blue-600">{job.balanceQty}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => openReceiveModal(job)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Package size={16} />
                      Receive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedJob && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowModal(false);
            setSelectedJob(null);
            setReceiveQty('');
            setCompletedProcess('');
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Receive Material</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Job ID: <span className="font-semibold text-gray-900">{selectedJob.jobId}</span></p>
                <p className="text-sm text-gray-600">Vendor: <span className="font-semibold text-gray-900">{selectedJob.vendor}</span></p>
                <p className="text-sm text-gray-600">Balance Quantity: <span className="font-semibold text-blue-600">{selectedJob.balanceQty}</span></p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Enter Received Quantity</label>
                <input
                  type="number"
                  value={receiveQty}
                  onChange={(e) => setReceiveQty(e.target.value)}
                  max={selectedJob.balanceQty}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Completed Process</label>
                <select
                  value={completedProcess}
                  onChange={(e) => setCompletedProcess(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select process</option>
                  <option value="Powder Coating">Powder Coating</option>
                  <option value="Painting">Painting</option>
                  <option value="Heat Treatment">Heat Treatment</option>
                  <option value="Electroplating">Electroplating</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors"
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

import { useState } from 'react';
import { Truck } from 'lucide-react';

interface CompletedJob {
  id: string;
  orderId: string;
  item: string;
  quantity: number;
  completionDate: string;
  status: string;
}

export default function CompletedJobs() {
  const [jobs] = useState<CompletedJob[]>([]);

  const markReadyForDispatch = (orderId: string) => {
    console.log('Marking order ready for dispatch:', orderId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Completed Jobs</h1>
        <p className="text-gray-500 mt-1">Jobs that have passed inspection</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Completion Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{job.orderId}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{job.item}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">{job.quantity}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{job.completionDate}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      {job.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => markReadyForDispatch(job.orderId)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Truck size={16} />
                      Mark Ready For Dispatch
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

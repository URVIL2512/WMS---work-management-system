import { useState } from 'react';
import { Eye, CheckCircle } from 'lucide-react';

interface JobCard {
  id: string;
  jobCardId: string;
  workOrderId: string;
  process: string;
  department: string;
  quantity: number;
  status: string;
}

export default function InhouseJobs() {
  const [jobCards] = useState<JobCard[]>([]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inhouse Job Cards</h1>
        <p className="text-gray-500 mt-1">Track internal production job cards</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Job Card ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Work Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Process</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Department</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobCards.map((job) => (
                <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{job.jobCardId}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{job.workOrderId}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{job.process}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{job.department}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">{job.quantity}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      job.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      job.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Details">
                        <Eye size={18} />
                      </button>
                      {job.status !== 'Completed' && (
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors" title="Mark Complete">
                          <CheckCircle size={18} />
                        </button>
                      )}
                    </div>
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

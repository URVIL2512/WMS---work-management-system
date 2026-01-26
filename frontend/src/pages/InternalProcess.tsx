import { useState } from 'react';
import { CheckCircle, Circle, Send } from 'lucide-react';

interface ProcessStep {
  name: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
}

export default function InternalProcess() {
  const [processes, setProcesses] = useState<ProcessStep[]>([]);

  const toggleProcess = (index: number) => {
    const newProcesses = [...processes];
    if (index === 0 || newProcesses[index - 1].completed) {
      newProcesses[index].completed = !newProcesses[index].completed;
      if (newProcesses[index].completed) {
        newProcesses[index].completedBy = 'Current User';
        newProcesses[index].completedAt = new Date().toLocaleString();
      }
      setProcesses(newProcesses);
    }
  };

  const allCompleted = processes.every(p => p.completed);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Internal Process</h1>
        <p className="text-gray-500 mt-1">Track internal processing steps</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Work Order: -</h2>
          <p className="text-gray-600">Item: - Quantity: -</p>
        </div>

        <div className="space-y-4">
          {processes.map((process, index) => (
            <div
              key={process.name}
              className={`p-4 rounded-lg border-2 transition-all ${
                process.completed
                  ? 'bg-green-50 border-green-300'
                  : index === 0 || processes[index - 1]?.completed
                  ? 'bg-blue-50 border-blue-300 cursor-pointer hover:bg-blue-100'
                  : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
              }`}
              onClick={() => toggleProcess(index)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {process.completed ? (
                    <CheckCircle className="text-green-600 mt-1" size={24} />
                  ) : (
                    <Circle className={`mt-1 ${index === 0 || processes[index - 1]?.completed ? 'text-blue-600' : 'text-gray-400'}`} size={24} />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{process.name}</p>
                    {process.completed && process.completedBy && (
                      <p className="text-sm text-gray-600 mt-1">
                        Completed by {process.completedBy} at {process.completedAt}
                      </p>
                    )}
                    {!process.completed && (index === 0 || processes[index - 1]?.completed) && (
                      <p className="text-sm text-blue-600 mt-1">Click to mark as complete</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {allCompleted && (
          <div className="mt-6">
            <button className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-lg transition-colors">
              <Send size={20} />
              Send To Inspection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

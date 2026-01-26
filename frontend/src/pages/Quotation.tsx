import { useState, useEffect } from 'react';
import { Plus, Eye, Printer, X, Trash2, Minus } from 'lucide-react';
import api from '../api/axios';
import ConfirmationModal from '../components/ConfirmationModal';
import QuotationForm from '../components/QuotationForm';

interface QuotationItem {
  _id: string;
  quotationNumber: string;
  partyName: string;
  totalAmount: number;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  status?: string;
}

export default function Quotation() {
  const [showModal, setShowModal] = useState(false);
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [processes, setProcesses] = useState<Array<{ processName: string; rate: string }>>([
    { processName: '', rate: '' }
  ]);
  const [availableProcesses, setAvailableProcesses] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    partyName: '',
    quotationNo: '',
    email: '',
    contactNumber: '',
    itemDescription: '',
    gst: '18',
    packagingCost: '',
    transportCost: '',
    paymentTerms: '',
    deliveryDate: ''
  });

  // Fetch quotations and processes on component mount
  useEffect(() => {
    fetchQuotations();
    fetchProcesses();
  }, []);

  const fetchProcesses = async () => {
    try {
      const response = await api.get('/masters/Process');
      if (response.data.success) {
        const processNames = response.data.data
          .filter((p: any) => p.isActive !== false)
          .map((p: any) => p.name);
        setAvailableProcesses(processNames);
      }
    } catch (err: any) {
      console.error('Error fetching processes:', err);
    }
  };

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/quotations');
      if (response.data.success) {
        setQuotations(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch quotations');
      console.error('Error fetching quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  const addProcess = () => {
    setProcesses([...processes, { processName: '', rate: '' }]);
  };

  const removeProcess = (index: number) => {
    if (processes.length > 1) {
      setProcesses(processes.filter((_, i) => i !== index));
    }
  };

  const updateProcess = (index: number, field: 'processName' | 'rate', value: string) => {
    const updated = [...processes];
    updated[index] = { ...updated[index], [field]: value };
    setProcesses(updated);
  };

  // Reset form fields and processes
  const resetForm = () => {
    setFormData({
      partyName: '',
      quotationNo: '',
      email: '',
      contactNumber: '',
      itemDescription: '',
      gst: '18',
      packagingCost: '',
      transportCost: '',
      paymentTerms: '',
      deliveryDate: ''
    });
    setProcesses([{ processName: '', rate: '' }]);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate processes
    const validProcesses = processes.filter(p => p.processName.trim() && p.rate.trim());
    if (validProcesses.length === 0) {
      setError('At least one process with rate is required');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/quotations', {
        partyName: formData.partyName,
        email: formData.email,
        contactNumber: formData.contactNumber,
        itemDescription: formData.itemDescription,
        processes: validProcesses.map(p => ({
          processName: p.processName.trim(),
          rate: Number(p.rate)
        })),
        gstPercent: Number(formData.gst),
        packagingCost: Number(formData.packagingCost) || 0,
        transportCost: Number(formData.transportCost) || 0,
        paymentTerms: formData.paymentTerms,
        deliveryDate: formData.deliveryDate || undefined
      });

      if (response.data.success) {
        setShowModal(false);
        resetForm();
        // Refresh quotations and processes list
        await fetchQuotations();
        await fetchProcesses();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create quotation';
      setError(errorMessage);
      
      // If duplicate entry, show additional details if available
      if (err.response?.data?.duplicateDetails) {
        const duplicate = err.response.data.duplicateDetails;
        setError(
          `${errorMessage}\n\nExisting quotation details:\n` +
          `Quotation No: ${duplicate.quotationNumber}\n` +
          `Party Name: ${duplicate.partyName}\n` +
          `Created: ${new Date(duplicate.createdAt).toLocaleDateString()}`
        );
      }
      
      console.error('Error creating quotation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setQuotationToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!quotationToDelete) return;

    try {
      setDeleting(true);
      const response = await api.delete(`/quotations/${quotationToDelete}`);
      
      if (response.data.success) {
        setShowDeleteModal(false);
        setQuotationToDelete(null);
        // Refresh quotations list
        await fetchQuotations();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete quotation');
      console.error('Error deleting quotation:', err);
      setShowDeleteModal(false);
      setQuotationToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {!showModal && (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Quotation Management</h1>
              <p className="text-sm md:text-base text-gray-500 mt-1">Create and manage customer quotations</p>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition-colors w-full sm:w-auto"
            >
              <Plus size={20} className="w-4 h-4 md:w-5 md:h-5" />
              <span>New Quotation</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto -mx-3 md:mx-0">
          <div className="inline-block min-w-full align-middle px-3 md:px-0">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quotation No</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Party Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created By</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Loading quotations...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No quotations found. Create your first quotation!
                  </td>
                </tr>
              ) : (
                quotations.map((quotation) => (
                  <tr key={quotation._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-gray-900">
                        {quotation.quotationNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{quotation.partyName}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-semibold">₹{quotation.totalAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {new Date(quotation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {quotation.createdBy?.name || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                        quotation.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        quotation.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {quotation.status || 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View">
                          <Eye size={18} />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors" title="Print">
                          <Printer size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(quotation._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors" 
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
        </>
      )}

      {showModal && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <QuotationForm
            onClose={handleCloseModal}
            onSuccess={() => {
              fetchQuotations();
              handleCloseModal();
            }}
          />
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setQuotationToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Quotation"
        message="Are you sure you want to delete this quotation? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
}

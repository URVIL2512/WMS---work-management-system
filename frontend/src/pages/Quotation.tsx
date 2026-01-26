import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Eye, Printer, X, Trash2, Minus, MoreVertical, Edit, Send, CheckCircle, XCircle, RefreshCw, FileText, AlertCircle } from 'lucide-react';
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
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [quotationToEdit, setQuotationToEdit] = useState<any>(null);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [selectedQuotationDetails, setSelectedQuotationDetails] = useState<any>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; openUpward: boolean } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

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
    setQuotationToEdit(null);
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
        deliveryDate: formData.deliveryDate || undefined,
        status: 'Draft' // Default status for new quotations
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
        setDropdownPosition(null);
      }
    };

    const handleScroll = () => {
      // Close dropdown on scroll
      setOpenMenuId(null);
      setDropdownPosition(null);
    };

    const handleResize = () => {
      // Close dropdown on resize
      setOpenMenuId(null);
      setDropdownPosition(null);
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [openMenuId]);

  const toggleMenu = (id: string) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      setDropdownPosition(null);
      return;
    }

    const button = buttonRefs.current[id];
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const dropdownHeight = 350; // Approximate height of dropdown menu with status actions
    const dropdownWidth = 224; // w-56 = 14rem = 224px
    const spacing = 8; // mt-2 = 0.5rem = 8px
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Determine if dropdown should open upward
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    // Calculate top position
    let top: number;
    if (openUpward) {
      top = rect.top - dropdownHeight - spacing;
      // Ensure it doesn't go above viewport
      if (top < 10) {
        top = 10;
      }
    } else {
      top = rect.bottom + spacing;
      // Ensure it doesn't go below viewport
      if (top + dropdownHeight > viewportHeight - 10) {
        top = viewportHeight - dropdownHeight - 10;
      }
    }

    // Calculate left position (align to right edge of button)
    let left = rect.right - dropdownWidth;
    // Ensure it doesn't go off-screen
    if (left < 10) {
      left = 10;
    }
    if (left + dropdownWidth > viewportWidth - 10) {
      left = viewportWidth - dropdownWidth - 10;
    }

    setDropdownPosition({ top, left, openUpward });
    setOpenMenuId(id);
  };

  const handleView = async (quotation: QuotationItem) => {
    try {
      const response = await api.get(`/quotations/${quotation._id}`);
      if (response.data.success) {
        setSelectedQuotationDetails(response.data.data);
        setShowViewDetails(true);
      }
    } catch (err: any) {
      console.error('Error fetching quotation details:', err);
      setError(err.response?.data?.message || 'Failed to fetch quotation details');
    }
    setOpenMenuId(null);
    setDropdownPosition(null);
  };

  const handleCloseViewDetails = () => {
    setShowViewDetails(false);
    setSelectedQuotationDetails(null);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'sent':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'changes required':
      case 'changes_required':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'converted':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const handleStatusUpdate = async (quotationId: string, newStatus: string) => {
    try {
      setError('');
      const response = await api.patch(`/quotations/${quotationId}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        setSuccess(`Quotation status updated to ${newStatus}`);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
        
        // Refresh quotations list
        await fetchQuotations();
        // If viewing details, refresh that too
        if (showViewDetails && selectedQuotationDetails?._id === quotationId) {
          const detailsResponse = await api.get(`/quotations/${quotationId}`);
          if (detailsResponse.data.success) {
            setSelectedQuotationDetails(detailsResponse.data.data);
          }
        }
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.message || 'Failed to update status');
    }
    setOpenMenuId(null);
    setDropdownPosition(null);
  };

  const canEditQuotation = (status: string) => {
    const s = status?.toLowerCase();
    return s === 'draft' || s === 'changes required' || s === 'changes_required' || !s;
  };

  const canDeleteQuotation = (status: string) => {
    const s = status?.toLowerCase();
    return s !== 'converted';
  };

  const canConvertToOrder = (status: string) => {
    return status?.toLowerCase() === 'approved';
  };

  const canMarkAsSent = (status: string) => {
    const s = status?.toLowerCase();
    return s === 'draft' || s === 'changes required' || s === 'changes_required' || !s;
  };

  const canMarkAsApproved = (status: string) => {
    return status?.toLowerCase() === 'sent';
  };

  const canMarkAsRejected = (status: string) => {
    return status?.toLowerCase() === 'sent';
  };

  const canRequestChanges = (status: string) => {
    return status?.toLowerCase() === 'sent';
  };

  const handleEdit = async (quotation: QuotationItem) => {
    try {
      const response = await api.get(`/quotations/${quotation._id}`);
      if (response.data.success) {
        setQuotationToEdit(response.data.data);
        setShowModal(true);
      }
    } catch (err: any) {
      console.error('Error fetching quotation details:', err);
      setError(err.response?.data?.message || 'Failed to fetch quotation details');
    }
    setOpenMenuId(null);
    setDropdownPosition(null);
  };

  const handlePrint = (quotation: QuotationItem) => {
    // Implement print functionality
    console.log('Printing quotation:', quotation.quotationNumber);
    // You can open a print dialog or generate PDF
    alert(`Print functionality for ${quotation.quotationNumber} - Coming soon!`);
    setOpenMenuId(null);
    setDropdownPosition(null);
  };

  const handleDelete = (quotation: QuotationItem) => {
    handleDeleteClick(quotation._id);
    setOpenMenuId(null);
    setDropdownPosition(null);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {!showModal && !showViewDetails && (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Quotation Management</h1>
              <p className="text-sm md:text-base text-gray-500 mt-1">Create and manage customer quotations</p>
            </div>
            <button
              onClick={() => { 
                resetForm(); 
                setQuotationToEdit(null);
                setShowModal(true); 
              }}
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition-colors w-full sm:w-auto"
            >
              <Plus size={20} className="w-4 h-4 md:w-5 md:h-5" />
              <span>New Quotation</span>
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border-2 border-green-300 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
              <span>{success}</span>
              <button
                onClick={() => setSuccess('')}
                className="text-green-700 hover:text-green-900 ml-4 p-1 hover:bg-green-100 rounded transition-colors"
                aria-label="Close success message"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                className="text-red-700 hover:text-red-900 ml-4 p-1 hover:bg-red-100 rounded transition-colors"
                aria-label="Close error message"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto -mx-3 md:mx-0">
          <div className="inline-block min-w-full align-middle px-3 md:px-0">
            <table className="min-w-full divide-y divide-gray-200 relative">
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
                        quotation.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-700' :
                        quotation.status?.toLowerCase() === 'sent' ? 'bg-blue-100 text-blue-700' :
                        quotation.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-700' :
                        quotation.status?.toLowerCase() === 'converted' ? 'bg-purple-100 text-purple-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {quotation.status || 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        ref={(el) => { buttonRefs.current[quotation._id] = el; }}
                        onClick={() => toggleMenu(quotation._id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="More actions"
                      >
                        <MoreVertical size={18} className="text-gray-600" />
                      </button>
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
            quotationToEdit={quotationToEdit}
          />
        </div>
      )}

      {/* View Quotation Details */}
      {showViewDetails && selectedQuotationDetails && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            {/* Header with Status and Close Button */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-300">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Quotation Details</h2>
                <span className={`inline-block px-4 py-1.5 text-sm font-semibold rounded-full border ${getStatusBadgeColor(selectedQuotationDetails.status || 'Draft')}`}>
                  {selectedQuotationDetails.status || 'Draft'}
                </span>
              </div>
              <button
                onClick={handleCloseViewDetails}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            {/* Changes Required Banner */}
            {(selectedQuotationDetails.status?.toLowerCase() === 'changes required' || 
              selectedQuotationDetails.status?.toLowerCase() === 'changes_required') && (
              <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <AlertCircle size={20} className="text-orange-600 flex-shrink-0 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-bold text-orange-900 mb-1">Changes Required</h3>
                    <p className="text-sm text-orange-800">
                      Customer has requested modifications to this quotation. Please review and make necessary changes, then mark as "Sent" again.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <RefreshCw size={16} />
                Status Timeline
              </h3>
              <div className="flex items-center justify-between flex-wrap gap-2">
                {/* Draft */}
                <div className={`flex flex-col items-center ${
                  selectedQuotationDetails.status?.toLowerCase() === 'draft' || !selectedQuotationDetails.status
                    ? 'opacity-100' : 'opacity-40'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    selectedQuotationDetails.status?.toLowerCase() === 'draft' || !selectedQuotationDetails.status
                      ? 'bg-yellow-500 border-yellow-600 text-white'
                      : 'bg-gray-200 border-gray-300 text-gray-500'
                  }`}>
                    1
                  </div>
                  <span className="text-xs font-medium text-gray-700 mt-1">Draft</span>
                  {selectedQuotationDetails.createdAt && (
                    <span className="text-xs text-gray-500">{new Date(selectedQuotationDetails.createdAt).toLocaleDateString()}</span>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex-1 min-w-[20px] h-0.5 bg-gray-300"></div>

                {/* Sent */}
                <div className={`flex flex-col items-center ${
                  ['sent', 'approved', 'rejected', 'changes required', 'converted'].includes(selectedQuotationDetails.status?.toLowerCase())
                    ? 'opacity-100' : 'opacity-40'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    ['sent', 'approved', 'rejected', 'changes required', 'converted'].includes(selectedQuotationDetails.status?.toLowerCase())
                      ? 'bg-blue-500 border-blue-600 text-white'
                      : 'bg-gray-200 border-gray-300 text-gray-500'
                  }`}>
                    2
                  </div>
                  <span className="text-xs font-medium text-gray-700 mt-1">Sent</span>
                </div>

                {/* Arrow */}
                <div className="flex-1 min-w-[20px] h-0.5 bg-gray-300"></div>

                {/* Approved/Rejected/Changes Required */}
                <div className={`flex flex-col items-center ${
                  ['approved', 'rejected', 'changes required', 'converted'].includes(selectedQuotationDetails.status?.toLowerCase())
                    ? 'opacity-100' : 'opacity-40'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    selectedQuotationDetails.status?.toLowerCase() === 'approved' || selectedQuotationDetails.status?.toLowerCase() === 'converted'
                      ? 'bg-green-500 border-green-600 text-white'
                      : selectedQuotationDetails.status?.toLowerCase() === 'rejected'
                      ? 'bg-red-500 border-red-600 text-white'
                      : selectedQuotationDetails.status?.toLowerCase() === 'changes required'
                      ? 'bg-orange-500 border-orange-600 text-white'
                      : 'bg-gray-200 border-gray-300 text-gray-500'
                  }`}>
                    {selectedQuotationDetails.status?.toLowerCase() === 'approved' || selectedQuotationDetails.status?.toLowerCase() === 'converted' ? (
                      <CheckCircle size={16} />
                    ) : selectedQuotationDetails.status?.toLowerCase() === 'rejected' ? (
                      <XCircle size={16} />
                    ) : selectedQuotationDetails.status?.toLowerCase() === 'changes required' ? (
                      <AlertCircle size={16} />
                    ) : (
                      '3'
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700 mt-1">
                    {selectedQuotationDetails.status?.toLowerCase() === 'approved' || selectedQuotationDetails.status?.toLowerCase() === 'converted'
                      ? 'Approved'
                      : selectedQuotationDetails.status?.toLowerCase() === 'rejected'
                      ? 'Rejected'
                      : selectedQuotationDetails.status?.toLowerCase() === 'changes required'
                      ? 'Changes Req.'
                      : 'Pending'}
                  </span>
                </div>

                {/* Arrow - Only if Approved */}
                {(selectedQuotationDetails.status?.toLowerCase() === 'approved' || 
                  selectedQuotationDetails.status?.toLowerCase() === 'converted') && (
                  <>
                    <div className="flex-1 min-w-[20px] h-0.5 bg-gray-300"></div>

                    {/* Converted */}
                    <div className={`flex flex-col items-center ${
                      selectedQuotationDetails.status?.toLowerCase() === 'converted'
                        ? 'opacity-100' : 'opacity-40'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        selectedQuotationDetails.status?.toLowerCase() === 'converted'
                          ? 'bg-purple-500 border-purple-600 text-white'
                          : 'bg-gray-200 border-gray-300 text-gray-500'
                      }`}>
                        <FileText size={16} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 mt-1">Converted</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quotation Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quotation Number</label>
                <p className="text-gray-900">{selectedQuotationDetails.quotationNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Name</label>
                <p className="text-gray-900">{selectedQuotationDetails.partyName}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quote Date</label>
                <p className="text-gray-900">
                  {selectedQuotationDetails.quotationDate 
                    ? new Date(selectedQuotationDetails.quotationDate).toLocaleDateString() 
                    : new Date(selectedQuotationDetails.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date</label>
                <p className="text-gray-900">
                  {selectedQuotationDetails.validUntil 
                    ? new Date(selectedQuotationDetails.validUntil).toLocaleDateString() 
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Created By</label>
                <p className="text-gray-900">{selectedQuotationDetails.createdBy?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Created Date</label>
                <p className="text-gray-900">
                  {new Date(selectedQuotationDetails.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Subject */}
            {selectedQuotationDetails.subject && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                <p className="text-gray-900">{selectedQuotationDetails.subject}</p>
              </div>
            )}

            {/* Item List Table */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Items</h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Item Name</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Quantity</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Discount</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedQuotationDetails.items && selectedQuotationDetails.items.length > 0 ? (
                      selectedQuotationDetails.items.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.itemName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            ₹{(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.discount || 0}%</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                            ₹{(item.subTotal || item.lineTotal || item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    ) : selectedQuotationDetails.processes && selectedQuotationDetails.processes.length > 0 ? (
                      selectedQuotationDetails.processes.map((process: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{process.processName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{process.quantity || 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            ₹{(process.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">0%</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                            ₹{((process.rate || 0) * (process.quantity || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-sm text-gray-500 text-center">No items found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-3">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Financial Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ₹{(selectedQuotationDetails.totalSubTotal || selectedQuotationDetails.baseAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {selectedQuotationDetails.gstPercent > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      GST ({selectedQuotationDetails.gstPercent}%):
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{(selectedQuotationDetails.totalTaxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {selectedQuotationDetails.tdsPercent > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span className="text-sm font-medium">
                      TDS ({selectedQuotationDetails.tdsPercent}%):
                    </span>
                    <span className="text-sm font-semibold">
                      -₹{(selectedQuotationDetails.tdsAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {selectedQuotationDetails.tcsPercent > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      TCS ({selectedQuotationDetails.tcsPercent}%):
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{(selectedQuotationDetails.tcsAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {selectedQuotationDetails.remittanceCharges > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span className="text-sm font-medium">Remittance Charges:</span>
                    <span className="text-sm font-semibold">
                      -₹{(selectedQuotationDetails.remittanceCharges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="border-t-2 border-gray-300 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Total Amount:</span>
                    <span className="text-xl font-bold text-green-600">
                      ₹{(selectedQuotationDetails.totalAmount || selectedQuotationDetails.receivableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Notes */}
            {selectedQuotationDetails.customerNotes && (
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Notes</label>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedQuotationDetails.customerNotes}</p>
              </div>
            )}

            {/* Terms and Conditions */}
            {selectedQuotationDetails.termsAndConditions && (
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Terms & Conditions</label>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedQuotationDetails.termsAndConditions}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-300">
              <button
                onClick={handleCloseViewDetails}
                className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Menu Portal */}
      {openMenuId && dropdownPosition && createPortal(
        <div
          ref={menuRef}
          className="fixed w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-[10000]"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
        >
          <div className="py-1">
            {(() => {
              const quotation = quotations.find(q => q._id === openMenuId);
              if (!quotation) return null;
              const status = quotation.status || 'Draft';

              return (
                <>
                  {/* View Details */}
                  <button
                    onClick={() => handleView(quotation)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                  >
                    <Eye size={16} className="text-blue-600 flex-shrink-0" />
                    <span>View Details</span>
                  </button>

                  {/* Edit - Only if editable */}
                  {canEditQuotation(status) && (
                    <button
                      onClick={() => handleEdit(quotation)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2 transition-colors"
                    >
                      <Edit size={16} className="text-green-600 flex-shrink-0" />
                      <span>Edit</span>
                    </button>
                  )}

                  {/* Print */}
                  <button
                    onClick={() => handlePrint(quotation)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <Printer size={16} className="text-gray-600 flex-shrink-0" />
                    <span>Print</span>
                  </button>

                  {/* Status Actions Divider */}
                  <div className="border-t border-gray-200 my-1"></div>

                  {/* Mark as Sent */}
                  {canMarkAsSent(status) && (
                    <button
                      onClick={() => handleStatusUpdate(quotation._id, 'Sent')}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                    >
                      <Send size={16} className="text-blue-600 flex-shrink-0" />
                      <span>Mark as Sent</span>
                    </button>
                  )}

                  {/* Mark as Approved */}
                  {canMarkAsApproved(status) && (
                    <button
                      onClick={() => handleStatusUpdate(quotation._id, 'Approved')}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                      <span>Mark as Approved</span>
                    </button>
                  )}

                  {/* Mark as Rejected */}
                  {canMarkAsRejected(status) && (
                    <button
                      onClick={() => handleStatusUpdate(quotation._id, 'Rejected')}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <XCircle size={16} className="text-red-600 flex-shrink-0" />
                      <span>Mark as Rejected</span>
                    </button>
                  )}

                  {/* Request Changes */}
                  {canRequestChanges(status) && (
                    <button
                      onClick={() => handleStatusUpdate(quotation._id, 'Changes Required')}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 flex items-center gap-2 transition-colors"
                    >
                      <AlertCircle size={16} className="text-orange-600 flex-shrink-0" />
                      <span>Request Changes</span>
                    </button>
                  )}

                  {/* Convert to Order */}
                  {canConvertToOrder(status) && (
                    <>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => {
                          alert('Convert to Sales Order feature - Coming soon!\nThis will create a new order from this approved quotation.');
                          setOpenMenuId(null);
                          setDropdownPosition(null);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 flex items-center gap-2 transition-colors"
                      >
                        <FileText size={16} className="text-purple-600 flex-shrink-0" />
                        <span>Convert to Order</span>
                      </button>
                    </>
                  )}

                  {/* Delete - Only if allowed */}
                  {canDeleteQuotation(status) && (
                    <>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => handleDelete(quotation)}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 size={16} className="flex-shrink-0" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>,
        document.body
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

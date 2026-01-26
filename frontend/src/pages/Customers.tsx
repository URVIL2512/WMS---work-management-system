import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, X } from 'lucide-react';
import api from '../api/axios';
import CustomerForm from '../components/CustomerForm';

interface Customer {
  _id: string;
  customerId: string;
  customerName: string;
  contactPerson?: string;
  mobile: string;
  email?: string;
  customerType: string;
  billingCity?: string;
  billingState?: string;
  gstNumber?: string;
  outstandingBalance: number;
  status: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter, searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      
      const response = await api.get('/customers', { params });
      if (response.data.success) {
        setCustomers(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setShowForm(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete customer');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/customers/${id}/status`, { status });
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedCustomer(null);
    fetchCustomers();
  };

  const handleFormSuccess = () => {
    handleFormClose();
  };

  if (showForm) {
    return (
      <CustomerForm
        customer={selectedCustomer}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Master</h1>
          <p className="text-gray-600 mt-1">Manage customer information and details</p>
        </div>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
        >
          <Plus size={20} />
          <span>New Customer</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search by name, mobile, email, or GST..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Contact Person</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Mobile</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">City</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">GST Number</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Outstanding Balance</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{customer.customerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{customer.contactPerson || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{customer.mobile}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{customer.billingCity || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{customer.gstNumber || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      ₹{customer.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={customer.status}
                        onChange={(e) => handleStatusChange(customer._id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded ${
                          customer.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : customer.status === 'Blocked'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        } border-0 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(customer._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
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
  );
}
